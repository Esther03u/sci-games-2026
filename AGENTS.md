<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules (Sci Games 2026)

- **Push and update `Handoff.md` after every completed piece of work** (each phase, fix, or feature). `Handoff.md` at the repo root is the living hand-off document — update its `Last updated` line, Completed Milestones, Current Task & Blockers and the Prompt for the Next AI, then commit and push to `main`.
- Do **not** touch `docs/handoff-summary-*.md` (local dated snapshots, gitignored). Only create one when explicitly asked.
- Never commit secrets (Supabase keys, `PIN_SESSION_SECRET`, local Postgres password). `supabase/message.txt` is a local duplicate of migration 001 — do not commit it.
- Migrations are additive and idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`); never edit an already-applied migration file — add a new numbered one.
- Before committing: `npm run build` must pass, and DB changes must pass `bash supabase/tests/run-local.sh` (needs `PGPASSWORD` for the local PostgreSQL on port 5432 — ask the user).
- Read `docs/plans/2026-09-20-live-scoring-v2.md` before starting a phase.
