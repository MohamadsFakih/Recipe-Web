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

## Setup

1. Install: `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `NEXTAUTH_SECRET`, etc.
3. Migrate: `npx prisma migrate dev`
4. Run: `npm run dev`
