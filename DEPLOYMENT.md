# Deploying Recipe Web to DigitalOcean

This guide gets the full-stack app (Next.js, Prisma, NextAuth) running on **DigitalOcean App Platform** so anyone can sign up, log in, and use the app.

---

## 1. Prerequisites

- A **DigitalOcean** account ([sign up](https://www.digitalocean.com/))
- Your app in a **Git repository** (GitHub, GitLab, or Bitbucket) and pushed to the remote
- (Optional) A **Hugging Face** token if you want AI recipe generation: [Create token](https://huggingface.co/settings/tokens)

---

## 2. Create a PostgreSQL database

1. In DigitalOcean: **Databases** → **Create Database**.
2. Choose **PostgreSQL**, pick a plan (e.g. Basic), region, and a name (e.g. `recipe-db`).
3. After it’s created, open the database and go to **Connection Details**.
4. Copy the **Connection string** (or note **Host**, **Port**, **User**, **Password**, **Database**).  
   It looks like:  
   `postgresql://doadmin:PASSWORD@db-postgresql-xxx.ondigitalocean.com:25060/defaultdb?sslmode=require`  
   Use this as `DATABASE_URL` later.

---

## 3. Use PostgreSQL for production (one-time)

The app uses **SQLite** by default for local dev. For production you must use **PostgreSQL**.

1. **Switch Prisma to PostgreSQL**

   Edit `prisma/schema.prisma` and change the datasource:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Apply the schema to the production database**

   Set `DATABASE_URL` to your DigitalOcean Postgres URL (from step 2), then run:

   ```bash
   npx prisma db push
   ```

   This creates/updates all tables. (Alternatively you can use [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) and run `npx prisma migrate deploy` in the release phase instead of `db push`.)

3. **Commit and push** the `schema.prisma` change so the build on App Platform uses PostgreSQL.

**Local development after switching to Postgres:**  
Use a local Postgres (e.g. run `docker compose up -d` and set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recipe`) or keep SQLite for local only by reverting `provider` to `"sqlite"` and using a separate DB URL when deploying.

---

## 4. Create the app on App Platform

1. In DigitalOcean: **Apps** → **Create App**.
2. **Choose source**: connect your Git provider and select the repo and branch (e.g. `main`).
3. **Resource type**: select **Web Service**.
4. **Build settings** (App Platform often detects Next.js; if not, set manually):
   - **Build Command:** `npm run build`  
     (runs `prisma generate && npx next build` from `package.json`)
   - **Output Directory:** leave default (`.next` is used by `next start`).
5. **Run settings**:
   - **Run Command:** `npm start` (i.e. `next start`).
   - **HTTP Port:** `3000`.

---

## 5. Add a release command (run DB schema on deploy)

So the database is always in sync when you deploy:

1. In your App → **Settings** → **App-Level** (or the component’s **Settings**).
2. Add a **Release Command** (or “Run Command” that runs after build):
   ```bash
   npx prisma db push
   ```
   If you use migrations instead, run:
   ```bash
   npx prisma migrate deploy
   ```

This runs on every deploy before the new app starts.

---

## 6. Environment variables

In the App → **Settings** → **App** → **Environment Variables**, add:

| Variable            | Required | Description |
|---------------------|----------|-------------|
| `DATABASE_URL`      | Yes      | Full Postgres connection string from step 2. |
| `AUTH_SECRET`      | Yes      | Random secret for sessions. Generate with: `openssl rand -base64 32`. |
| `NEXTAUTH_URL`      | Yes (prod) | Your app’s public URL, e.g. `https://your-app-xxxx.ondigitalocean.app`. No trailing slash. |
| `HUGGINGFACE_API_KEY` | No   | Hugging Face token for AI recipe generation. |
| `HUGGINGFACE_MODEL`   | No   | Optional model override (default: Mistral-7B-Instruct). |

- For **NEXTAUTH_URL**: use the URL App Platform gives you (e.g. `https://recipe-web-xxxx.ondigitalocean.app`). After you add a custom domain, change it to `https://yourdomain.com`.
- **AUTH_SECRET** must be the same on every run; do not leave it empty in production.

---

## 7. Deploy

1. Save settings and trigger a **Deploy** (or push to the connected branch).
2. Wait for build and release to finish. The first deploy may take a few minutes.
3. Open the app URL. You should see the app; use **Register** to create an account and log in.

---

## 8. File uploads (profile pictures, recipe images)

- **App Platform** runs on an **ephemeral filesystem**: files written to `public/uploads/` are **lost on redeploy**.
- For a production setup with persistent uploads, use **DigitalOcean Spaces** (S3-compatible):
  1. Create a Space and get **Access Key** and **Secret**.
  2. Store files in the Space and serve them via the Space’s public URL (or CDN).
  3. You’d need to change the upload API routes to use an S3 client (e.g. `@aws-sdk/client-s3`) and point them at your Space.

Until then, uploads work but **do not persist** across deploys. The rest of the app (accounts, recipes, likes, comments) is stored in PostgreSQL and persists.

**Optional – Docker Postgres for local dev:**  
A `docker-compose.yml` is included. Run `docker compose up -d` and set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recipe` to develop against Postgres locally.

---

## 9. Optional: custom domain

1. In your App → **Settings** → **Domains**.
2. Add your domain and follow the CNAME instructions from DigitalOcean.
3. Update **NEXTAUTH_URL** to `https://yourdomain.com`.

---

## 10. Summary checklist

- [ ] PostgreSQL database created; `DATABASE_URL` copied.
- [ ] `prisma/schema.prisma` set to `provider = "postgresql"` and `db push` (or migrations) run once against that DB.
- [ ] App created on App Platform; build command `npm run build`, run command `npm start`, port `3000`.
- [ ] Release command set to `npx prisma db push` (or `npx prisma migrate deploy`).
- [ ] Env vars set: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, and optionally `HUGGINGFACE_API_KEY`.
- [ ] Deploy triggered; app URL opens and registration/login work.

After that, anyone can use the app at your public URL: register, log in, create recipes, and use AI generation if you set the Hugging Face key.
