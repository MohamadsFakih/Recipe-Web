# Recipe-Web

A recipe management web app built with Next.js. Create, edit, and share recipes with friends.

## Features

- User auth (register / login)
- Recipe CRUD with status (Favourite, To try, Made before)
- Multiple images per recipe with slideshow
- Cuisine types, prep/cook times, public recipes
- Friend requests and notifications
- Share recipes via link

## Tech

- Next.js (App Router), Prisma (SQLite), NextAuth, Tailwind CSS

## Admin panel

The app includes an admin area for moderating users, recipes (posts), and comments.

- **URL:** `/admin` (or `/admin/login` to sign in).
- **Admin login:** Set in `.env`:
  - **`ADMIN_PASSWORD`** (required) – the admin password; change it anytime and re-run `npm run db:seed` to update.
  - **`ADMIN_EMAIL`** (optional) – defaults to `admin@admin.com` if not set.

After the first migration, create or update the admin user by running:

```bash
npm run db:seed
```

Change the admin password anytime by updating `ADMIN_PASSWORD` in `.env` and running `npm run db:seed` again.

Admins can:

- View all registered users and disable or delete accounts (except other admins).
- View all recipes and delete any recipe (post).
- View recent comments and delete any comment.

## Setup

1. Install: `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `NEXTAUTH_SECRET`, etc.
3. Migrate: `npx prisma migrate dev`
4. Seed the admin user: `npm run db:seed`
5. Run: `npm run dev`
