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

### Run the dev server

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file and fill in the values (see [Environment variables](#environment-variables)):

   ```bash
   cp .env.example .env.local
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173).

### Other scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Vite dev server with hot reload |
| `npm run build` | Type-checks and builds for production into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs Oxlint |

## Environment variables

| Variable | Where it is used | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Frontend | Supabase: Project Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Safe in the browser; Row Level Security controls access |
| `OPENROUTER_API_KEY` | Edge Functions only | Set with `npx supabase secrets set`. Never prefix with `VITE_` |
| `OPENROUTER_MODEL` | Edge Functions only | The OpenRouter free model ID to use |

## Accounts to create before launch

- [ ] **Supabase**: create a project, then copy the project URL and anon key into `.env.local`. Link the repo with `npx supabase link --project-ref <your-project-ref>`. Match the password rules in the dashboard (Authentication settings), because `config.toml` only applies locally.
- [ ] **OpenRouter**: create a free account, generate an API key and choose a free model. Store both as Supabase secrets, not in the repo.
- [ ] **Vercel**: create an account, import the GitHub repository and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables. Then add the Vercel URL to Supabase's allowed redirect URLs.
- [ ] **GitHub**: create a public repository and push this project to it.
