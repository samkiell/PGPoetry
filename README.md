# PGpoetry — _Every verse, a priceless gift._

A minimalist, emotion-driven poetry platform. Readers browse, collect, and
respond to poems; the author publishes and curates them from an admin studio.

## ✨ Features

**For readers**

- Browse and search poems by title, line, or tag
- Curated **collections** (series of poems)
- **Accounts** — sign up with email/password or Google; profile with bio,
  favorites, and comment history
- **Engagement** — like, favorite, comment (guests can comment too), and share
- Light / dark theme, RSS feed, per-poem social preview images

**For the author (admin)**

- Dashboard with library stats
- **Rich poem editor** (Tiptap) with live preview, cover images, tags,
  collections, drafts, and **scheduled publishing**
- Collections manager
- Analytics — most viewed and most liked poems

## 🛠️ Stack

| Layer    | Choice                                               |
| -------- | ---------------------------------------------------- |
| Framework | Next.js (App Router) + React + TypeScript           |
| Styling  | Tailwind CSS v4 + shadcn/ui                          |
| Database | MongoDB + Mongoose                                   |
| Auth     | Auth.js v5 (Credentials + Google, MongoDB adapter)   |
| Uploads  | Cloudinary                                           |
| Editor   | Tiptap                                               |

## 🚀 Getting started

### Prerequisites

- Node.js 20.6+ (22 recommended)
- A MongoDB database (Atlas or local)
- _(optional)_ Cloudinary account for image uploads
- _(optional)_ Google OAuth credentials for "Sign in with Google"

### Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open <http://localhost:3000>.

To populate a fresh database with a sample collection and poems:

```bash
npm run seed
```

### Environment variables

See [`.env.example`](.env.example) for the full list. The essentials:

| Variable        | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `MONGODB_URI`   | MongoDB connection string                                      |
| `AUTH_SECRET`   | Auth.js session secret — `npx auth secret` to generate         |
| `ADMIN_EMAIL`   | The account with this email is granted the **admin** role      |
| `AUTH_GOOGLE_*` | Optional — enables Google sign-in                              |
| `CLOUDINARY_*`  | Optional — enables image uploads in the admin studio           |

The admin role is assigned automatically to whoever signs up (or signs in via
Google) with `ADMIN_EMAIL`.

## 📜 Scripts

| Command          | Description                              |
| ---------------- | ---------------------------------------- |
| `npm run dev`    | Start the dev server                     |
| `npm run build`  | Production build                         |
| `npm start`      | Run the production build                 |
| `npm run lint`   | ESLint                                   |
| `npm run typecheck` | Type-check without emitting           |
| `npm run seed`   | Seed sample content (idempotent)         |

## 🗂️ Project structure

```
src/
├── app/
│   ├── (public pages)        # home, poems, collections, poem detail
│   ├── login, signup         # auth screens
│   ├── profile/              # reader profile + favorites
│   ├── admin/                # admin studio (poems, collections, analytics)
│   ├── api/                  # auth + admin upload route handlers
│   ├── actions/              # server actions (engagement, auth, admin, profile)
│   └── rss.xml/              # RSS feed
├── components/               # UI kit (shadcn) + feature components
├── lib/                      # db, auth, data layer, utilities
├── models/                   # Mongoose schemas
└── types/                    # shared serializable types
```

## ⏰ Scheduled publishing

Poems with status `scheduled` are promoted to `published` automatically the
next time an admin loads the studio (`publishDuePoems`). For hands-off
publishing, hit that logic from a cron job (e.g. a Vercel Cron calling a small
route handler).

## 📦 Deployment

The app deploys cleanly to any Next.js host (Vercel recommended). Set the
environment variables from `.env.example` in your host's dashboard. `.env*`
files are git-ignored — never commit real secrets.

## 📄 License

MIT
