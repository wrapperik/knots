-- Core tables for Knots: profiles, meetings, decisions, action items and analysis runs.
-- Every table has an owner, and Row Level Security limits each user to their own rows.

-- ---------------------------------------------------------------------------
-- Helpers used by several tables
-- ---------------------------------------------------------------------------


-- Keeps updated_at current on every update.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Records who last edited a row and when. The trigger passes the columns that
-- count as an edit, so changing an item's status or order does not.
-- Writes made while saving an AI analysis set knots.ai_write and are skipped.

create function public.mark_edited()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    column_name text;
begin
    if auth.uid() is null or current_setting('knots.ai_write', true) = 'on' then
        return new;
    end if;

    foreach column_name in array tg_argv loop
        if to_jsonb(new) -> column_name is distinct from to_jsonb(old) -> column_name then
            new.edited_at = now();
            new.edited_by = auth.uid();
            return new;
        end if;
    end loop;

    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles: one row per user, created automatically on sign-up
-- ---------------------------------------------------------------------------

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text check (char_length(display_name) between 1 and 100),
    -- Soft delete: set when the user deletes their account. The row is kept.
    deleted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

-- Creates the profile when a user signs up. security definer lets it insert
-- into profiles even though users cannot insert there themselves.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''));
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();


-- True when the logged-in user exists and has not deleted their account.
-- Used in every policy, so a soft-deleted user's unexpired login token stops
-- working straight away.


create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and deleted_at is null
    );
$$;


-- ---------------------------------------------------------------------------
-- Meetings: one row per transcript
-- ---------------------------------------------------------------------------

create table public.meetings (
    id uuid primary key default gen_random_uuid(),
    -- Filled in from the logged-in user, so the frontend never sends it.
    user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
    title text not null check (char_length(title) between 1 and 200),
    meeting_date date not null default current_date,
    -- Null when the transcript does not say when the meeting started.
    start_time time,
    source text not null default 'paste' check (source in ('upload', 'paste')),
    file_name text check (char_length(file_name) between 1 and 255),
    transcript text not null check (char_length(transcript) between 1 and 1000000),
    analysis_status text not null default 'pending'
        check (analysis_status in ('pending', 'processing', 'done', 'failed')),
    summary text check (char_length(summary) <= 5000),
    analysis_error text check (char_length(analysis_error) <= 1000),
    summary_edited_at timestamptz,
    summary_edited_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- An upload always has a file name; pasted text never does.
    check ((source = 'upload') = (file_name is not null)),
    -- Lets decisions and action items point at (meeting, owner) together.
    unique (id, user_id)
);


create index meetings_user_date_idx on public.meetings (user_id, meeting_date desc);

create trigger meetings_set_updated_at
  before update on public.meetings
  for each row execute function public.set_updated_at();

-- Same idea as mark_edited, for the summary, which has its own columns.
create function public.mark_summary_edited()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if auth.uid() is not null
        and current_setting('knots.ai_write', true) is distinct from 'on'
        and new.summary is distinct from old.summary then
        new.summary_edited_at = now();
        new.summary_edited_by = auth.uid();
    end if;
    return new;
end;
$$;

create trigger meetings_mark_summary_edited
  before update on public.meetings
  for each row execute function public.mark_summary_edited();
