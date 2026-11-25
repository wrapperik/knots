-- Private calendar feeds: each user can have one secret link that calendar
-- apps (Google, Apple, Outlook) subscribe to, showing their open action items
-- on their due dates.
--
-- Calendar apps cannot log in, so the link itself is the key. That shapes the
-- design:
--   - The token is 32 random bytes, so it cannot be guessed.
--   - Only a SHA-256 hash of it is stored. Someone who reads this table cannot
--     rebuild a working link, so the app shows the link once, when created.
--   - Creating a new link replaces the old one, which stops working at once.
--   - Turning the feed off deletes the row, which also stops the link.

create table public.calendar_feeds (
    -- One feed per user.
    user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
    token_hash text not null unique,
    created_at timestamptz not null default now()
);

alter table public.calendar_feeds enable row level security;

-- Users may see whether they have a feed and when it was made. Rows are only
-- written by the functions below, so there are no insert, update or delete policies.
create policy "Active users can view their own calendar feed"
  on public.calendar_feeds for select to authenticated
  using (user_id = (select auth.uid()) and (select public.is_active_user()));

revoke all on public.calendar_feeds from anon, authenticated;
grant select (created_at) on public.calendar_feeds to authenticated;


-- Creates the caller's feed, or replaces it, and returns the new token. This is
-- the only time the token exists in plain text.
create function public.create_calendar_feed()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
    if v_user_id is null or not public.is_active_user() then
        raise exception 'Not logged in' using errcode = '28000';
    end if;

    insert into public.calendar_feeds (user_id, token_hash)
    values (v_user_id, encode(extensions.digest(v_token, 'sha256'), 'hex'))
    on conflict (user_id) do update
        set token_hash = excluded.token_hash, created_at = now();

    return v_token;
end;
$$;

-- Turns the caller's feed off. The old link stops working straight away.
create function public.delete_calendar_feed()
returns void
language sql
security definer
set search_path = ''
as $$
    delete from public.calendar_feeds where user_id = (select auth.uid());
$$;

revoke execute on function public.create_calendar_feed() from public, anon;
revoke execute on function public.delete_calendar_feed() from public, anon;
grant execute on function public.create_calendar_feed() to authenticated;
grant execute on function public.delete_calendar_feed() to authenticated;


-- What the feed shows, looked up by token. Called by the calendar-feed Edge
-- Function, which has no logged-in user, so anon may call it. It returns
-- nothing for an unknown token, a deleted account or an empty calendar alike,
-- so a caller cannot tell which it was.
--
-- Open items with a due date, from the feed owner's meetings that are not
-- archived. Only the columns the calendar needs are returned: never the
-- transcript or the summary.
create function public.calendar_feed_items(p_token text)
returns table (
    id uuid,
    description text,
    owner text,
    due_date date,
    status text,
    meeting_title text,
    updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
    select a.id, a.description, a.owner, a.due_date, a.status, m.title, a.updated_at
    from public.calendar_feeds f
    join public.profiles p on p.id = f.user_id and p.deleted_at is null
    join public.meetings m on m.user_id = f.user_id and m.archived_at is null
    join public.action_items a on a.meeting_id = m.id
    where f.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
      and a.status <> 'done'
      and a.due_date is not null
    order by a.due_date, a.created_at;
$$;

revoke execute on function public.calendar_feed_items(text) from public;
grant execute on function public.calendar_feed_items(text) to anon, authenticated;
