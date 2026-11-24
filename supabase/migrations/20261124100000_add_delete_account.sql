-- Soft-deletes the logged-in user's account.
--
-- The profile row is kept and stamped with deleted_at, so is_active_user()
-- turns false and every policy stops showing or changing the user's data at
-- once, even with a token that has not expired yet. The login page refuses
-- deleted accounts by reading deleted_at.
--
-- The auth user is not banned: Supabase Auth then fails to log the user out.
--
-- security definer: users may not write deleted_at themselves. The function
-- only ever touches the caller's own row, so it takes no id.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception 'Not logged in' using errcode = '28000';
    end if;

    update public.profiles
    set deleted_at = now()
    where id = v_user_id and deleted_at is null;

    -- No row changed: the profile is missing or the account is already deleted.
    if not found then
        raise exception 'Account not found' using errcode = 'P0002';
    end if;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
