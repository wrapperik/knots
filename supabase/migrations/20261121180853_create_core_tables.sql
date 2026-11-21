-- Core tables for Knots: profiles, meetings, decisions, action items and analysis runs.
-- Every table has an owner, and Row Level Security limits each user to their own rows.

-- ---------------------------------------------------------------------------
-- Helpers used by several tables
-- ---------------------------------------------------------------------------


-- Keeps updated_at current on every update.
create function public.set_updated_at()
returns trigger
language plpqsql
set search_path = ''
as $$
begin 
    new.updated_at = now();
    return new;
end;
$$;

-- Records who last edited a row and when. The trigger passes the columns that
-- count as an edit, so changing an item's status or order does not.]
-- Writes made while saving an AI analysis set knots.ai_write and are skipped.

create function public.mark_edited()
returns triggerlanguage plpqsql
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
            new.editred_by = auth.uid();
        return new;
    end if;
    end loop;

return new;
end;
$$;


