![Knots: every decision, knotted down.](docs/readme-banner.png)

# Knots

Knots turns a meeting transcript into something a team can act on. Paste or upload a transcript and Knots returns a short summary, the decisions that were made and the action items, each with an owner and a due date when the transcript gives one. Everything the AI produces can then be edited, assigned, tracked across meetings and ticked off.

The name comes from the Inca *quipu*: knotted cords used to record information.

- **Live app:** [knots-delta.vercel.app](https://knots-delta.vercel.app)
- **Built for:** the Luckybeard Launchpad 2027 discipline challenge, "AI Meeting Notes"

---

## Contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Run it locally](#run-it-locally)
- [Environment variables](#environment-variables)
- [Demo accounts](#demo-accounts)
- [How to check every requirement](#how-to-check-every-requirement)
- [Key decisions and trade-offs](#key-decisions-and-trade-offs)
- [Known limitations](#known-limitations)
- [With another week](#with-another-week)
- [Deploying](#deploying)
- [Project structure](#project-structure)

---

## What it does

**Accounts**
- Sign up and log in with email and password. Passwords need at least 8 characters, with upper-case and lower-case letters and a number.
- Sign-up asks for the password twice, and every password field has a show/hide toggle. Auth forms show inline errors and cannot be submitted twice.
- The account page lets users rename themselves, set up the calendar feed and delete their account. Deleting is a **soft delete**: the account is marked as deleted, logged out, and can no longer log in or see any data.

**Meetings**
- Upload a `.txt`, `.vtt` or `.md` transcript (up to 1 MB) by dragging it onto the page, or paste the text in.
- Each meeting stores a title, a date, an optional start time and the original transcript.
- The meetings list can be searched by title or date, starred, edited and archived. Archived meetings move to their own tab and can be restored.

**AI analysis**
- Each new meeting is analysed straight away. The result is a summary, a list of decisions and a list of action items.
- Owners and dates are only kept if they can be found in the transcript. Items with no clear owner, or where something had to be dropped, are flagged **Needs review**.
- If the AI is slow, busy, out of credit or replies with something unusable, the meeting is marked **Needs retry** and the transcript is kept, so it can be analysed again from its page with **Try again**.

**Reviewing and tracking**
- Everything is editable: the summary, each decision, and each action item's text, owner, due date and status (to do, in progress, done). Items can be added, deleted and ticked off.
- Every change people make to summaries, decisions and action items is recorded, and shown in a History panel on the meeting page.
- **My action items** is a board across all meetings, with To do, In progress and Done columns. It filters by owner and overdue, and switches between **Mine** (items assigned to you) and **Everyone** (every item in your meetings).

**Integration: calendar feed**
- Each user can create a private calendar link on the account page. Google Calendar, Apple Calendar or Outlook can subscribe to it, and open action items then appear on their due dates.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Vite, React 19, TypeScript, React Router |
| UI | Tailwind CSS v4, shadcn/ui components (in `src/components/ui`), Lucide icons, Sonner toasts |
| Backend | Supabase: Auth, Postgres with Row Level Security, Edge Functions (Deno) |
| AI | OpenRouter with free models, called only from the `analyse-meeting` Edge Function |
| Validation | Zod, for the AI reply |
| Hosting | Vercel (frontend), Supabase (database, auth and functions) |
| Tooling | Oxlint, Supabase CLI (as a dev dependency, run with `npx supabase`) |

---

## Run it locally

### What you need

- Node.js 20 or later, and npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), which runs the local Supabase backend (no Docker account needed)
- An [OpenRouter](https://openrouter.ai) API key, which is free, for the AI analysis

### Steps

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start Docker Desktop** and wait until the engine is running.

3. **Start Supabase locally.** This runs the database, auth, the Edge Functions and Studio in Docker, then applies the migrations and the seed data. The first run downloads several images and takes a few minutes.

   ```bash
   npx supabase start
   ```

   It prints the local URLs and keys when it finishes. Run `npx supabase status` to see them again.

4. **Frontend environment file**

   ```bash
   cp .env.example .env.local
   ```

   Paste the **API URL** and **publishable key** from step 3 into `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Do not use the secret key: anything starting with `VITE_` is sent to the browser.

5. **Edge Function secrets.** Create `supabase/functions/.env`, which Git ignores, with your OpenRouter details:

   ```bash
   OPENROUTER_API_KEY=your-openrouter-key
   OPENROUTER_MODEL=a-free-model-id,another-free-model-id
   ```

   Several models can be listed, separated by commas. OpenRouter tries the next one when a model is busy. Then restart Supabase so the functions pick the file up:

   ```bash
   npx supabase stop
   ```

   ```bash
   npx supabase start
   ```

6. **Start the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) and log in with a [demo account](#demo-accounts). Supabase Studio, for browsing tables and users, is at [http://localhost:54323](http://localhost:54323).

To stop, run `npx supabase stop` before quitting Docker Desktop.

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the app with hot reload |
| `npm run build` | Type-checks and builds for production into `dist/` |
| `npm run lint` | Runs Oxlint |
| `npx supabase db reset` | Rebuilds the local database from the migrations and the seed data |
| `npx supabase status` | Shows the local URLs and keys |
| `npx supabase gen types typescript --local > src/lib/database.types.ts` | Regenerates the database types after a migration |

---

## Environment variables

`.env.example` lists every variable. Real `.env` files are never committed.

| Variable | Used by | Where it is set | Notes |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Frontend | `.env.local`, and Vercel for the live app | The project's API URL. Public by design |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend | `.env.local`, and Vercel for the live app | Public by design: Row Level Security decides what each user can reach |
| `OPENROUTER_API_KEY` | `analyse-meeting` Edge Function | `supabase/functions/.env`, and `npx supabase secrets set` for the live app | Secret. Never prefix it with `VITE_` |
| `OPENROUTER_MODEL` | `analyse-meeting` Edge Function | As above | One OpenRouter model id, or several separated by commas |
| `OPENROUTER_URL` | `analyse-meeting` Edge Function | Optional | Another address for the chat completions API, for example a mock |

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are given to Edge Functions by Supabase automatically, so they are not set by hand.

---

## Demo accounts

The seed data in [`supabase/seed.sql`](supabase/seed.sql) creates three users on the **local** database. All of them use the password `Knots-demo-1`, which is local only and never used in production.

| Email | Has | Use it to check |
| --- | --- | --- |
| `alex@knots.test` | Two meetings: one analysed, with a decision and two action items, and one mid-analysis | The main flow, editing, the board |
| `sam@knots.test` | One meeting waiting to be analysed | That Sam cannot see Alex's meetings |
| `jordan@knots.test` | Nothing | The empty states, and that Jordan sees no one else's data |

There is one role, a regular user: every user owns their own meetings and sees nothing else. The three accounts exist so data isolation can be checked from more than one side.

The **live app** starts without demo data. Create an account on the sign-up page; email confirmation is turned off on the live project so the account works straight away.

---

## How to check every requirement

The brief supplies three sample transcripts: a clean one, a messy one and one with no action items. Use them for the AI checks.

| Requirement | How to check it |
| --- | --- |
| Register and log in | Sign up with a new email. Then log out (sidebar) and log back in. Wrong details show an inline error |
| Secure passwords | A password like `password` is refused with an explanation. Passwords are hashed by Supabase Auth and never stored or logged by the app |
| No double submission | Click the submit button on any auth form several times quickly: one request is sent and the button shows "Logging in…" |
| Only your own data | Log in as Alex and open a meeting. Copy its address, log in as Jordan and paste it: it shows "Meeting not found". Changing the id in an API call returns nothing either, because Row Level Security filters every query |
| Visitors can only log in or register | Log out and open `/` or `/action-items`: you are sent to the login page |
| Soft-delete account | Account, then Delete my account, then enter your password. You are logged out, and logging in again says the account has been deleted. In Studio the `profiles` row is still there, with `deleted_at` set |
| Upload or paste a transcript | Drag a `.txt`, `.vtt` or `.md` file onto the homepage, or choose "Or paste a transcript instead". A wrong file type or a file over 1 MB is refused |
| Title, date and transcript stored | The New meeting dialog asks for the title and date. The meeting page shows the original transcript beside the results |
| AI summary, decisions and action items | Upload the clean sample transcript. The meeting is analysed and its page shows all three |
| No invented owners or dates | Upload the messy sample. Lines like "someone should update the doc" become items with **No owner**, **No due date** and **Needs review** |
| No action items | Upload the third sample. The meeting shows a summary and "No action items.", not made-up tasks |
| AI failure and retry | Set `OPENROUTER_MODEL` to a model id that does not exist and upload a transcript. The meeting is marked **Needs retry**, the transcript is still there, and the **Try again** button on its page runs it again |
| Edit everything | On a meeting page, use the pencil icons on the summary, decisions and action items. History lists each change |
| Add, delete and tick off items | "Add action item", the delete button inside the edit form, and the circle beside each item |
| Meeting list and detail page | The homepage lists meetings, and each one opens its detail page |
| My open action items, with filters | My action items: the Owner menu, "Overdue only", and Mine or Everyone. The filters are kept in the address, so a refresh keeps them |
| Validation on the server | The database enforces every limit with check constraints and column permissions, not just the forms. For example, an empty title or someone else's id is refused by Postgres |
| Loading, empty and error states | Every page shows a loader while fetching, an empty state with a next step, and a retry button if loading fails |
| Integration | Account, then Calendar, then Create calendar link. Open the link in a browser to download the `.ics` file, or subscribe to it from a calendar app on the live site |

---

## Key decisions and trade-offs

### Supabase, with security in the database
Data isolation is enforced by Postgres, not by the frontend. Every table has **Row Level Security** policies that only let a user reach their own rows, and **column grants** that stop the app from writing columns it should not, such as `user_id`, `created_by` and the edit stamps. Asking for someone else's meeting by id returns the same "not found" as an id that does not exist, so ids reveal nothing.

Every policy also calls `is_active_user()`, which checks that the account has not been deleted. A soft-deleted user is shut out even if their login token has not expired yet.

The trade-off is that the rules live in SQL, which is harder to read than application code. The upside is that no frontend bug can leak another user's data.

### The AI runs on the server, as the user
The OpenRouter key only exists in the `analyse-meeting` Edge Function. The function calls the database with the **caller's own login**, so Row Level Security still applies inside it: it can only read the meeting being analysed, and it only belongs to that user. Each request sends exactly one meeting, so one user's transcript can never end up in another user's AI context.

### AI output is treated as untrusted
1. The model is asked for **structured JSON** that matches a schema (`response_format: json_schema`), with temperature 0.
2. The reply is **validated with Zod** before anything is saved. Malformed, partial or empty replies are rejected with a clear message, and the meeting is marked **Needs retry**.
3. Owners and dates are **checked against the transcript**. An owner is kept only if that name appears in the transcript, and a due date only if it is a real date *and* the words it came from appear in the transcript. Anything dropped is flagged **Needs review** rather than guessed.
4. Everything is saved in **one transaction** by the `save_analysis` database function, so a half-saved analysis is impossible. AI rows are marked `created_by = 'ai'` and are not counted as a person's edit.
5. The prompt tells the model that the transcript is data, not instructions, as a guard against instructions hidden in a transcript.

### Failure handling for free models
- The transcript is saved **before** analysis starts, so a failure never loses it.
- Each attempt is logged in `analysis_runs`, with the model, timing, token counts and raw reply, which makes failures debuggable.
- Rate limits (429), lack of credit (402), timeouts (60 seconds) and empty replies each get their own message.
- Several models can be listed, and OpenRouter falls back to the next when one is busy.
- Each user can start 20 analyses a day, so one person cannot use up the shared free quota.
- Starting an analysis "claims" the meeting in a single update, so a double click or a second tab cannot run it twice.

### Owner names stay as written; "Mine" is explicit
The AI writes owners exactly as the transcript names them ("Priya", "Lerato M"). Those are not Knots accounts, and guessing which one is "you" would break the no-invention rule. Instead, any item can be **assigned to me** with one click, and the board's **Mine** view shows only those. The database only accepts the meeting's owner as the assignee, whatever the browser sends.

### Integration: a private calendar feed, not OAuth
I chose a subscribable `.ics` feed over a Google Calendar OAuth connection:
- **It works with every calendar app**, not just Google.
- **Reviewers can test it** without being added to an OAuth test-user list. An unverified Google app only works for listed accounts.
- **It is sensibly secured without OAuth tokens to store.** The link contains 32 random bytes, and only a SHA-256 hash is stored, so it is shown once. Creating a new link revokes the old one at once, and turning it off deletes it.
- **The feed function uses only the public key.** A database function turns the token into a user and returns only that user's open, dated items from active meetings, never transcripts or summaries.
- An unknown or revoked token gets an empty calendar, so a reply never confirms whether a token was real.

The trade-off: a feed is pull-only, and Google can take hours to refresh a subscribed calendar. OAuth would push changes instantly.

### Other choices
- **Soft delete with a timestamp** (`deleted_at`) rather than removing rows, as the brief asks. Edit history keeps pointing at a real profile.
- **Overdue is computed, never stored:** open and due before today. It is always right on the day the page is viewed.
- **Archive instead of delete** for meetings. It is reversible, and it hides the meeting's items from the board and the calendar.
- **Edit history is written by database triggers**, so every change is recorded however it was made, and the app cannot fake or skip an entry.
- **Status changes and reordering are not stamped as edits**; changes to text, owner, due date and priority are.
- **Filters live in the address**, so the board's state survives a refresh and can be bookmarked.

---

## Known limitations

- **Relative dates use the saved meeting date.** Words like "today" or "Wednesday" are turned into dates using the date chosen in the New meeting dialog, which defaults to the day of upload. Set it to the real meeting date when saving. The date check proves a due date came from the transcript, not that it was worked out from the right starting day.
- **No automated tests yet.** Everything above was checked by hand.
- **Read and delete permissions rely on a Supabase project setting.** The migrations grant insert and update per column, but select and delete come from the project's default grants ("Grant API access to new tables automatically"). A project with that setting off needs explicit grants added.
- **Meetings are private only.** There is no sharing between users, so there is a single role.
- **Search runs in the browser.** All of a user's meetings are loaded at once, which suits hundreds of meetings, not thousands.
- **Email confirmation is off on the live project**, because Supabase's built-in email sender allows only a few emails an hour. A real launch would turn it on, with a proper email provider.

---

## With another week

1. **Automated tests:** the AI validation and transcript checks with the AI mocked, Row Level Security tests that log in as two users and try to read each other's data, and the main routes.
2. **Better dates:** pre-fill the meeting date from the transcript when it states one, and flag items whose due date came from a relative word like "today" for review.
3. **Sharing:** invite people to a meeting as editors or viewers, with comments and @mentions. The access helpers are designed but not built.
4. **Source linking:** each decision and item already stores the transcript line it came from. Clicking it would highlight that line in the transcript.
5. **Streaming results**, so the summary appears while the rest is still being worked out.
6. **CSV export** of action items, and reminder emails before due dates.
7. **Explicit grants** in the migrations, so they do not depend on a project setting.

---

## Deploying

The live app uses Vercel for the frontend and a hosted Supabase project for the rest.

1. **Create the Supabase project.** Keep "Grant API access to new tables automatically" ticked (see [Known limitations](#known-limitations)), then link the repo:

   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```

2. **Push the database.** With this version of the CLI, `--remote` is needed, or the command targets the local database:

   ```bash
   npx supabase db push --remote
   ```

3. **Set the AI secrets and deploy the functions**

   ```bash
   npx supabase secrets set OPENROUTER_API_KEY=your-key OPENROUTER_MODEL=your-model-ids
   ```

   ```bash
   npx supabase functions deploy analyse-meeting
   ```

   ```bash
   npx supabase functions deploy calendar-feed
   ```

   `calendar-feed` runs without a login check (`verify_jwt = false` in `supabase/config.toml`), because calendar apps cannot log in.

4. **Configure auth in the Supabase dashboard**
   - Authentication, then URL Configuration: set the **Site URL** to the Vercel address, and add `https://your-app.vercel.app/**` to the redirect URLs.
   - Authentication, then Sign In / Providers, then Email: turn **Confirm email** on or off.
   - Match the password rules from `supabase/config.toml`, which only apply locally.

5. **Deploy the frontend on Vercel.** Import the GitHub repository and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as **Config** variables (they are public). Redeploy after changing them, because Vite builds them into the bundle. `vercel.json` sends every path to `index.html`, so refreshing on any page works.

---

## Project structure

```
src/
  pages/              One file per page: home, meeting view, action items, account, login, sign-up
  components/
    ui/               shadcn/ui components
    auth/             Auth layout, form fields, password field, photo grid background
    meeting/          Summary, decisions, action items, history panel
  lib/                Data access and helpers: meetings, action items, edits, account, calendar,
                      validation, and the generated database types
  hooks/              useAuth and others
supabase/
  migrations/         The database schema, in order: tables, policies, functions and triggers
  functions/
    analyse-meeting/  The AI analysis: prompt, schema, transcript checks, OpenRouter call
    calendar-feed/    The .ics feed
  seed.sql            Local demo users and data
  config.toml         Local Supabase settings
```

The schema is defined by the migrations in [`supabase/migrations`](supabase/migrations), from `create_core_tables` to `add_calendar_feeds`. `npx supabase db reset` rebuilds a local database from them.
