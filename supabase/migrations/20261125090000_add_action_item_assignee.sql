-- Lets a user claim an action item as theirs. "owner" stays the free-text name
-- from the transcript; assignee_id links the item to a Knots account. The AI
-- never sets it: only a person can say "this one is mine".

alter table public.action_items
    add column assignee_id uuid references public.profiles (id) on delete set null,
    -- Until meetings can be shared, the meeting's owner is the only person who
    -- can be assigned. Checked by the database, so a request with someone
    -- else's id is refused whatever the browser sends.
    add constraint action_items_assignee_is_owner
        check (assignee_id is null or assignee_id = user_id);

-- The existing policies already limit changes to the owner's items. The column
-- grants decide that the app may set the assignee.
grant insert (assignee_id) on public.action_items to authenticated;
grant update (assignee_id) on public.action_items to authenticated;
