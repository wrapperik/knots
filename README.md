# Knots

Knots turns meeting transcripts into something you can act on. Paste or upload a transcript and get back a summary, the key decisions and a list of action items with owners and due dates. You can then edit, track and tick off those items.

> **Status:** project setup is complete. The frontend, styling and Supabase tooling are in place. Features are not built yet.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Vite, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Auth, Postgres with Row Level Security, Edge Functions) |
| AI | OpenRouter, called only from a Supabase Edge Function so the API key never reaches the browser |
| Hosting | Vercel (frontend), Supabase (backend) |

## What is set up

- Vite + React + TypeScript project with Tailwind CSS wired in through the Vite plugin.
- Oxlint for linting.
- Supabase CLI installed as a dev dependency (run it with `npx supabase`) and the `supabase/` folder initialised.
- Local auth settings: minimum password length of 8, with upper-case letters, lower-case letters and digits required.
- A typed Supabase client in `src/lib/supabase.ts`.
- `.env.example` listing every environment variable. Real `.env` files are git-ignored.

## Getting started

### Prerequisites

- Node.js 20 or later
- npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), which runs the local Supabase backend. A Docker account is not needed.

### Run the app locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Open Docker Desktop and wait until it says the engine is running. Closing its window is fine; it keeps running in the background (whale icon in the menu bar).

3. Start the local Supabase stack (database, auth and Studio):

   ```bash
   npx supabase start
   ```

   The first run downloads several Docker images and takes a few minutes. When it finishes, it prints the local URLs and keys. Run `npx supabase status` to see them again later.

4. Create your local environment file:

   ```bash
   cp .env.example .env.local
   ```

   Then paste the **API URL** and **publishable key** printed in step 3 into `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Do not use the secret key: it bypasses Row Level Security and anything prefixed with `VITE_` is sent to the browser (see [Environment variables](#environment-variables)).

5. Start the dev server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173). Supabase Studio, for browsing tables and users, is at [http://localhost:54323](http://localhost:54323).

### Stopping

Stop the local Supabase stack before quitting Docker Desktop:

```bash
npx supabase stop
```

Quitting Docker Desktop while Supabase is running stops the database too. Next time, open Docker Desktop first, then run `npx supabase start` again.

### Docker tips

- Supabase runs about a dozen containers. Docker's default memory limit (around 4 GB) works, but if your machine has 16 GB or more, raising it to 6 GB in Docker Desktop (Settings > Resources) keeps things responsive.
- To have Docker ready without opening it each time, turn on "Start Docker Desktop when you sign in" (Settings > General).

### Other scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Vite dev server with hot reload |
| `npm run build` | Type-checks and builds for production into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs Oxlint |
| `npx supabase start` | Starts the local Supabase stack in Docker |
| `npx supabase status` | Shows the local URLs and keys |
| `npx supabase db reset` | Rebuilds the local database from the migrations and `supabase/seed.sql` |
| `npx supabase stop` | Stops the local Supabase stack |

## Environment variables

| Variable | Where it is used | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Frontend | Locally: the API URL from `npx supabase start`. Live: Supabase, Project Settings > API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend | Locally: the publishable key from `npx supabase start`. Live: Supabase, Project Settings > API. Safe in the browser; Row Level Security controls access |
| `OPENROUTER_API_KEY` | Edge Functions only | Set with `npx supabase secrets set`. Never prefix with `VITE_` |
| `OPENROUTER_MODEL` | Edge Functions only | The OpenRouter free model ID to use |

## Accounts to create before launch

- [ ] **Supabase**: create a project, then copy the project URL and publishable key into `.env.local`. Link the repo with `npx supabase link --project-ref <your-project-ref>`. Match the password rules in the dashboard (Authentication settings), because `config.toml` only applies locally.
- [ ] **OpenRouter**: create a free account, generate an API key and choose a free model. Store both as Supabase secrets, not in the repo.
- [ ] **Vercel**: create an account, import the GitHub repository and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as environment variables. Then add the Vercel URL to Supabase's allowed redirect URLs.
- [ ] **GitHub**: create a public repository and push this project to it.
