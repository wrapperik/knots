-- Local test data. Runs after the migrations on `npx supabase db reset`.
-- Three users, to check that nobody sees meetings that are not theirs.
-- All sign in with the password Knots-demo-1 (local only, never in production).

-- 1. Users. The on_auth_user_created trigger creates their profiles.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('Knots-demo-1', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', jsonb_build_object('display_name', u.name),
  now(), now(), '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'alex@knots.test', 'Alex Morgan'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'sam@knots.test', 'Sam Patel'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'jordan@knots.test', 'Jordan Lee')
) as u (id, email, name);

-- Supabase Auth needs a matching identity row for email sign-in.
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@knots.test';

-- 2. Meetings. user_id is set by hand because the seed runs without a logged-in user.
insert into public.meetings (
  id, user_id, title, meeting_date, start_time, source, file_name, transcript,
  analysis_status, summary
)
values
  (
    'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
    'Weekly product sync', '2026-11-18', '09:30', 'upload', 'weekly-sync.vtt',
    E'Alex: Let''s ship the export feature on Friday.\n'
      || E'Priya: I''ll write the release notes by Thursday.\n'
      || E'Jordan: Someone should update the pricing page.',
    'done',
    'The team agreed to ship the export feature on Friday. Priya will write the release notes, '
      || 'and the pricing page needs updating.'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
    'Client kick-off: Ridgeway', '2026-11-16', '14:00', 'paste', null,
    E'Alex: Welcome, everyone. Let''s agree the project scope today.',
    'processing', null
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
    'Sam''s team retro', '2026-11-17', null, 'paste', null,
    E'Sam: What went well this sprint?',
    'pending', null
  );

-- 3. The AI run, decisions and action items for the analysed meeting.
insert into public.analysis_runs (
  meeting_id, user_id, model, status, duration_ms, prompt_tokens, completion_tokens
)
values (
  'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
  'example/free-model', 'succeeded', 4200, 310, 180
);

insert into public.decisions (id, meeting_id, user_id, description, source_quote, created_by)
values (
  'dddddddd-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
  'Ship the export feature on Friday.', 'Let''s ship the export feature on Friday.', 'ai'
);

insert into public.action_items (
  id, meeting_id, user_id, description, owner, due_date, needs_review, source_quote,
  created_by, position, status
)
values
  (
    'eeeeeeee-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
    'Write the release notes', 'Priya', '2026-11-19', false,
    'I''ll write the release notes by Thursday.', 'ai', 0, 'in_progress'
  ),
  (
    -- No owner or date in the transcript, so both stay empty and it is flagged for review.
    'eeeeeeee-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
    'Update the pricing page', null, null, true,
    'Someone should update the pricing page.', 'ai', 1, 'todo'
  );
