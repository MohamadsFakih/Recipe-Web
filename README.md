# Recipe

A modern recipe management web app. Create, organize, and share recipes with friends. Built with Next.js, Prisma, and NextAuth.

---

## Features

- **Authentication** — Register, login, and profile management
- **Recipes** — Full CRUD with status (Favourite, To try, Made before), multiple images, cuisine types, prep/cook times
- **Discover** — Browse public recipes and search by cuisine
- **Social** — Friend requests, notifications, and recipe sharing
- **Admin panel** — Moderate users, recipes, and comments (see [Admin](#admin-panel) below)

---

## Tech stack

| Layer      | Tech |
| --------- | -----|
| Framework | Next.js 16 (App Router) |
| Database  | Prisma (SQLite locally; Postgres for production) |
| Auth      | NextAuth v5 (Credentials) |
| Styling   | Tailwind CSS |

---

## Prerequisites

- **Node.js** 18.x or 20.x
- **npm** (or yarn / pnpm)

---

## Run locally

### 1. Clone and install

```bash
git clone <repository-url>
cd recipe-app
npm install
```

### 2. Environment variables

Copy the example env file and edit it:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

| Variable         | Required | Description |
| -----------------| -------- | ----------- |
| `DATABASE_URL`   | Yes      | Local: `file:./dev.db` |
| `AUTH_SECRET`    | Yes      | Generate with: `openssl rand -base64 32` |
| `ADMIN_PASSWORD` | Yes      | Password for the admin user (see [Admin](#admin-panel)) |

See `.env.example` for optional vars (e.g. AI generation, Vercel Blob).

### 3. Database

Apply migrations and create the SQLite database:

```bash
npx prisma migrate deploy
```

### 4. Start the app

```bash
npm run dev
```

The seed runs automatically and creates/updates the admin user from `.env`. Open [http://localhost:3000](http://localhost:3000).

- **Register** at `/register` or **login** at `/login`
- **Admin** at `/admin` (login with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`)

---

## Available scripts

| Command           | Description |
| ----------------- | ----------- |
| `npm run dev`     | Run seed, then start dev server (port 3000) |
| `npm run build`   | Build for production |
| `npm run start`   | Run seed, then start production server |
| `npm run db:seed` | Create/update admin user from `.env` |
| `npm run db:migrate` | Apply pending Prisma migrations |

---

## Admin panel

The app includes an admin area for moderation.

- **URL:** [http://localhost:3000/admin](http://localhost:3000/admin) (or `/admin/login` to sign in)
- **Credentials:** Use the email and password set in `.env`:
  - `ADMIN_EMAIL` (optional, defaults to `admin@admin.com`)
  - `ADMIN_PASSWORD` (required)

The admin user is created or updated whenever you run `npm run dev`, `npm run start`, or `npm run db:seed`. Change the password anytime by updating `ADMIN_PASSWORD` in `.env` and running the app or `npm run db:seed` again.

**Admin capabilities:**

- View all users; disable or delete accounts (except other admins)
- View all recipes; delete any recipe
- View recent comments; delete any comment

---

## Production / Deployed app

For the deployed app to work (including admin login), set these **environment variables** in your host (e.g. Vercel → Project → Settings → Environment Variables):

| Variable         | Required | When used | Description |
| -----------------| -------- | --------- | ----------- |
| `DATABASE_URL`   | Yes      | Build + Runtime | Postgres URL (e.g. Vercel Postgres). The app uses Postgres when it sees `postgresql://`. |
| `AUTH_SECRET`    | Yes      | Runtime | e.g. `openssl rand -base64 32` |
| `NEXTAUTH_URL`   | Yes      | Runtime | Your app URL, e.g. `https://your-app.vercel.app` (no trailing slash) |
| `ADMIN_PASSWORD` | Yes      | **Build** | Admin account password. The seed runs during **build** and creates/updates the admin user. |
| `ADMIN_EMAIL`    | No       | Build | Defaults to `admin@admin.com` if not set |

**Why admin login didn’t work:** The admin user is created by the seed script. On deploy, the seed runs during `npm run build` only if `DATABASE_URL` and `ADMIN_PASSWORD` are set in the **build** environment. If they were missing or not available at build time, no admin user exists in the production database.

**What to do now:**

1. In your deployment dashboard (e.g. Vercel), add **Build** (and Runtime) environment variables: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_PASSWORD`, and optionally `ADMIN_EMAIL`.
2. **Redeploy** the app (e.g. trigger a new deployment or push a commit). The build will run the seed and create/update the admin user in the production DB.
3. Log in at `https://your-app.vercel.app/admin` with `ADMIN_EMAIL` (or `admin@admin.com`) and `ADMIN_PASSWORD`.

**If you can’t redeploy:** Run the seed once against the production database from your machine:

```bash
DATABASE_URL="postgresql://..." ADMIN_PASSWORD="your-admin-password" npm run db:seed
```

Use the same `DATABASE_URL` as in production and the password you want for admin. Then try logging in at `/admin` again.

---

## License

Private / MIT (adjust as needed)
