# Run Recipe Web locally

**Local development uses SQLite** – no Docker or cloud database needed. Production (e.g. Vercel) uses PostgreSQL automatically when you set a Postgres `DATABASE_URL`.

---

## 1. Set your env vars

Copy `.env.example` to `.env` and `.env.local` if you haven’t already.

**For local dev** use SQLite. In **`.env`** (in the project root):

```
DATABASE_URL="file:./dev.db"
```

In **`.env.local`** (same or add):

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET=your-secret-at-least-32-chars
```

Optional: `HUGGINGFACE_API_KEY` for AI recipe generation.

---

## 2. Create the database (first time only)

From the project root:

```bash
npm run db:setup
```

(or `npx prisma db push`). This creates `prisma/dev.db` (SQLite).

---

## 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register or log in.

---

## Quick recap

| Step            | Command / action                    |
|-----------------|-------------------------------------|
| Set env         | `DATABASE_URL="file:./dev.db"` in `.env` and `.env.local` |
| Create DB       | `npm run db:setup`                  |
| Run the app     | `npm run dev`                       |

---

## How it works with production

- **Locally:** `DATABASE_URL="file:./dev.db"` → Prisma uses **SQLite** (schema in the repo).
- **On Vercel:** You set `DATABASE_URL` to a **Postgres** URL in the project settings. The build script sees `postgresql://` and temporarily switches the schema to PostgreSQL for that build, then runs `prisma generate` and `next build`. Your repo stays on SQLite for local dev.

No Docker or Neon needed for local development.
