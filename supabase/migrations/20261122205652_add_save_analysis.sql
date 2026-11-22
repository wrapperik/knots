-- Saves an AI analysis in one transaction: the summary, the decisions and the
-- action items, and marks the meeting as done. Either all of it is saved or
-- none of it is.
--
-- security definer: runs with the rights of the function's owner, because the
-- app may not write created_by or needs_review itself. That is why it checks
-- the caller and the meeting's owner before writing anything.
create function public.save_analysis(
p_meeting_id uuid,
p_summary text,
p_decisions jsonb,
p_action_items jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
v_user_id uuid := auth.uid();
begin
if v_user_id is null or not public.is_active_user() then
raise exception 'Not allowed' using errcode = '42501';
end if;
-- Locks the meeting, so two analyses of the same meeting cannot save at once.
perform 1
from public.meetings
where id = p_meeting_id and user_id = v_user_id
for update;
if not found then
    raise exception 'Meeting not found' using errcode = 'P0002';
end if;

-- Tells the mark_edited triggers that these writes are not a person's edits.
-- true: the setting only lasts until the end of this transaction.
perform set_config('knots.ai_write', 'on', true);
insert into public.decisions (meeting_id, user_id, description, source_quote, created_by)
select p_meeting_id, v_user_id, d ->> 'description', d ->> 'source_quote', 'ai'
from jsonb_array_elements(p_decisions) as d;
-- with ordinality numbers the items 1, 2, 3…, which keeps the AI's order.
insert into public.action_items (
meeting_id, user_id, description, owner, due_date, position, needs_review,
source_quote, created_by
)
select
p_meeting_id,
v_user_id,
item ->> 'description',
item ->> 'owner',
(item ->> 'due_date')::date,
(n - 1)::integer,
coalesce((item ->> 'needs_review')::boolean, false),
item ->> 'source_quote',
'ai'
from jsonb_array_elements(p_action_items) with ordinality as a (item, n);
update public.meetings
set summary = p_summary, analysis_status = 'done', analysis_error = null
where id = p_meeting_id;
end;
$$;
-- Functions can be run by everyone by default. Only logged-in users may run this one.
revoke execute on function public.save_analysis(uuid, text, jsonb, jsonb) from public, anon;
grant execute on function public.save_analysis(uuid, text, jsonb, jsonb) to authenticated;