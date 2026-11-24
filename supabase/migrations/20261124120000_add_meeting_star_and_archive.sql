-- Lets users star meetings they come back to, and archive meetings they are
-- done with. Both only change how the list is shown: nothing is deleted.

alter table public.meetings
    -- Starred meetings are listed first.
    add column is_starred boolean not null default false,
    -- Set when the meeting is archived; null while it is active. A timestamp
    -- rather than a boolean, so the archived list can show when it happened.
    add column archived_at timestamptz;

-- The existing update policy already limits changes to the owner's meetings.
-- The column grant decides which columns the app may change.
grant update (is_starred, archived_at) on public.meetings to authenticated;
