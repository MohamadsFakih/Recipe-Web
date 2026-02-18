# Deploy Recipe Web on Vercel

Get your app live so **anyone** can sign up and use it. Vercel runs your Next.js app; you need a **PostgreSQL database** (Vercel doesn’t support SQLite in production).

---

## 1. Push your code to GitHub

Make sure your project is in a Git repo and pushed to GitHub (or GitLab/Bitbucket). Vercel will connect to this repo.

---

## 2. Create a PostgreSQL database

You need a Postgres database. Two simple options:

### Option A: Vercel Postgres (recommended)

1. Go to [vercel.com](https://vercel.com) → your account → **Storage**.
2. Click **Create Database** → choose **Postgres**.
3. Create the DB and link it to your app (or note the connection string).
4. In your project, go to **Settings → Environment Variables**. Vercel often adds **`POSTGRES_URL`** or **`DATABASE_URL`** for you when you link the DB. If you see **`POSTGRES_URL`**, use that as `DATABASE_URL` (see step 4).

### Option B: Neon (free tier)

1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Create a new project and copy the **connection string** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
3. You’ll use this as `DATABASE_URL` in Vercel.

---

## 3. Create the project on Vercel

The app uses **SQLite** locally; on Vercel, when you set `DATABASE_URL` to a Postgres URL, the build automatically uses PostgreSQL (no schema change in the repo).

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import** your Git repository (e.g. GitHub).
3. Select the repo and branch. Leave **Framework Preset** as Next.js if it’s detected.
4. **Environment Variables** — add these (click “Add” for each):

| Name | Value | Notes |
|------|--------|--------|
| `DATABASE_URL` | Your Postgres connection string | From Vercel Postgres or Neon. Must start with `postgresql://`. |
| `AUTH_SECRET` | Random secret (32+ chars) | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app URL | After first deploy use e.g. `https://your-app.vercel.app` (no trailing slash). You can set this after the first deploy. |

Optional:

| Name | Value |
|------|--------|
| `HUGGINGFACE_API_KEY` | Your Hugging Face token (for AI recipe generation) |
| `HUGGINGFACE_MODEL` | e.g. `mistralai/Mistral-7B-Instruct-v0.2` |

5. **Build and Output Settings** (optional):

- **Build Command:** leave default **`npm run build`** (it runs the Postgres switch, `prisma generate`, **`prisma db push`** to create/update tables, then `next build`).
- **Output Directory:** leave default (Next.js uses `.next`).

6. Click **Deploy**.

---

## 4. Tables are created on deploy

The build runs **`prisma db push`** automatically, so your production Postgres database gets all tables (and any schema updates) on **every deploy**. You don’t need to run anything by hand.

If you already deployed **before** this was added and the app still doesn’t work: trigger a **Redeploy** (Vercel → Deployments → … → Redeploy). That will run the full build including `prisma db push` and create the tables.

---

## 5. Set NEXTAUTH_URL after first deploy

1. After the first deploy, open your app (e.g. `https://your-project.vercel.app`).
2. In Vercel → your project → **Settings → Environment Variables**, add or edit:
   - **`NEXTAUTH_URL`** = `https://your-project.vercel.app` (use your real URL, no trailing slash).
3. Redeploy (e.g. **Deployments → … → Redeploy**) so the new variable is used.

Without `NEXTAUTH_URL`, login may redirect to the wrong URL. With it set, anyone can register and log in.

---

## Summary checklist

- [ ] Code pushed to GitHub (or similar).
- [ ] Postgres database created (Vercel Postgres or Neon).
- [ ] Vercel project created and repo connected.
- [ ] Env vars set: `DATABASE_URL`, `AUTH_SECRET`, and after first deploy `NEXTAUTH_URL`.
- [ ] Redeploy after setting `NEXTAUTH_URL` (tables are created automatically on each build).

---

## File uploads (profile and recipe images)

On Vercel, the filesystem is **read-only** except for `/tmp`. Files saved under `public/uploads/` **do not persist** and are lost on the next request or deploy.

- The app will still run: users can register, log in, create recipes, like, comment, and favorite.
- To **persist** profile pictures and recipe images in production, you’d store files in **Vercel Blob**, **AWS S3**, or similar and change the upload API routes to use that storage. The current code is ready for that change when you add a storage provider.

---

## Custom domain (optional)

1. Vercel → your project → **Settings → Domains**.
2. Add your domain and follow the DNS instructions.
3. Update **`NEXTAUTH_URL`** to `https://yourdomain.com` and redeploy.

After this, your Recipe app is deployed on Vercel and can be used by everyone who has the URL.
