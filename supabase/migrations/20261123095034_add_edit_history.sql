-- ---------------------------------------------------------------------------
-- Edit history: one row for every change a person makes to a meeting's
-- summary, decisions or action items. Written only by a trigger, so the app
-- cannot skip it, change it or fake it.
-- ---------------------------------------------------------------------------
create table public.edit_history (
id uuid primary key default gen_random_uuid(),
meeting_id uuid not null references public.meetings (id) on delete cascade,
-- The meeting's owner, which is who may read the row.
user_id uuid not null references public.profiles (id) on delete cascade,
-- Who made the change.
changed_by uuid references public.profiles (id) on delete set null,
entity_type text not null check (entity_type in ('summary', 'decision', 'action_item')),
entity_id uuid not null,
action text not null check (action in ('created', 'updated', 'deleted')),
-- What the decision or action item said at the time, so the history still
-- reads well after the item is edited again or deleted.
label text not null,
-- For updates: each changed field with its old and new value,
-- e.g. {"owner": {"from": "Priya", "to": "Sam"}}.
changes jsonb not null default '{}',
created_at timestamptz not null default now()
);
create index edit_history_meeting_idx on public.edit_history (meeting_id, created_at desc);
alter table public.edit_history enable row level security;
create policy "Active users can view the history of their own meetings"
on public.edit_history for select to authenticated
using (user_id = (select auth.uid()) and (select public.is_active_user()));
-- Read-only for the app. Only the trigger function below writes rows.
revoke all on public.edit_history from anon, authenticated;
grant select on public.edit_history to authenticated;
-- Records one change. The trigger passes the entity type first, then the
-- columns that count: a change to any other column (position, updated_at)
-- is not recorded.
--
-- security definer: the app has no insert rights on edit_history, so the
-- function runs with its owner's rights to write the row.
create function public.record_edit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
v_entity text := tg_argv[0];
v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
v_row jsonb := coalesce(v_new, v_old);
v_meeting_id uuid;
v_changes jsonb := '{}';
v_column text;
begin
-- AI results, seed data and changes made outside the app are not a person's edits.
if auth.uid() is null or current_setting('knots.ai_write', true) = 'on' then
return null;

end if;
v_meeting_id := case
when v_entity = 'summary' then (v_row ->> 'id')::uuid
else (v_row ->> 'meeting_id')::uuid
end;
-- Deleting a meeting deletes its items too. The meeting is already gone by
-- then, and its history goes with it, so there is nothing to record.
if not exists (select 1 from public.meetings where id = v_meeting_id) then
return null;
end if;
if tg_op = 'UPDATE' then
-- tg_argv starts at 0, so [1:] is every column name after the entity type.
foreach v_column in array tg_argv[1:] loop
if v_old -> v_column is distinct from v_new -> v_column then
v_changes := v_changes || jsonb_build_object(
v_column, jsonb_build_object('from', v_old -> v_column, 'to', v_new -> v_column)
);
end if;
end loop;
if v_changes = '{}' then
return null;
end if;
end if;
insert into public.edit_history (
meeting_id, user_id, changed_by, entity_type, entity_id, action, label, changes
)
values (
v_meeting_id,
(v_row ->> 'user_id')::uuid,
auth.uid(),
v_entity,
(v_row ->> 'id')::uuid,
case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end,
case
when v_entity = 'summary' then 'Summary'
else coalesce(v_old, v_new) ->> 'description'
end,
v_changes
);
return null;
end;
$$;
-- after: the history is written once the change itself has succeeded.
create trigger meetings_record_summary_edit
after update of summary on public.meetings
for each row execute function public.record_edit('summary', 'summary');
create trigger decisions_record_edit
after insert or update or delete on public.decisions
for each row execute function public.record_edit('decision', 'description');
create trigger action_items_record_edit
after insert or update or delete on public.action_items
for each row
execute function public.record_edit(
'action_item', 'description', 'owner', 'due_date', 'status'
);