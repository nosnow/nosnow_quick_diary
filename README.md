# Personal Diary

Minimal single-user diary and life tracker built with Next.js + Upstash Redis.

## Features

- Dynamic daily input generated from Redis template
- Instant save on interaction (no save button)
- Monthly calendar with GitHub-style streak intensity
- Template editor at `/template`
- JSON and CSV export with filters (`year`, `month`, `days`)
- One record per day (`journal:YYYY-MM-DD`), edits overwrite the same day

## Tech

- Next.js App Router
- React
- TailwindCSS
- Upstash Redis
- Netlify deployment compatible

## Setup

1. Ensure dependencies already exist in `node_modules`.

If `node_modules` is missing, then run:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill values:

```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

3. Run development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Routes

- `GET /api/record/[date]`
- `POST /api/record`
- `GET /api/template`
- `POST /api/template`
- `GET /api/calendar`
- `GET /api/export`
- `GET /api/export?year=2026`
- `GET /api/export?month=2026-03`
- `GET /api/export?days=30`
- `GET /api/export?format=csv`

## Netlify Deploy

1. Push repository to GitHub.
2. Import project in Netlify.
3. Set build command: `npm run build`.
4. Set publish directory: `.next`.
5. Add environment variables from `.env.local` to Netlify site settings.
6. Deploy.

## Security Notes

- Keep Redis credentials server-side only.
