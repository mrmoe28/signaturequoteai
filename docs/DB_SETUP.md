# Database Setup (Neon + Drizzle)

## 1) Environment variables
Create `.env.local` (for Next.js) and `.env` (for CLI) with:

```
DATABASE_URL=postgresql://neondb_owner:...@ep-crimson-wave-adnv565x-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

- Next.js uses `.env.local` automatically.
- CLI tools like `psql`/Drizzle read `.env`.

## 2) Apply schema
Use psql to apply the existing SQL migration:

```bash
psql 'postgresql://neondb_owner:...@ep-crimson-wave-adnv565x-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' \
  -v ON_ERROR_STOP=1 -f lib/db/migrations/0000_odd_quasar.sql
```

Verify tables:

```bash
psql 'postgresql://neondb_owner:...@ep-crimson-wave-adnv565x-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -c '\\dt public.*'
```

You should see: `products`, `price_snapshots`, `quotes`, `quote_items`, `crawl_jobs`.

## 3) Local dev without DB
UI can run without DB for most pages (uses `/api/catalog` from local `lib/seed/catalog.json`). DB-backed routes will 500 if `DATABASE_URL` is missing/unreachable.

## 4) Common issues
- If Drizzle CLI shows Neon websocket driver errors, prefer applying SQL via `psql` as above.
- Tailwind/PostCSS v4 plugin error? See `docs/TROUBLESHOOTING.md`.
