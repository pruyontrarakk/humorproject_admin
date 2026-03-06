# Humor Project Admin

This is a small Next.js admin console for your Supabase-backed humor project. It connects to your existing database and lets you:

- **See interesting stats** about users, images, and captions
- **Read users/profiles**
- **Create, read, update, and delete images**
- **Read captions**

The UI is intentionally simple, dark, and keyboard-friendly so it is comfortable to use for day‑to‑day operations.

## Running the app

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a local env file**

   In the project root, create `.env.local` and paste:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   # Required for auth callback (checks profiles.is_superadmin). From Supabase Dashboard → Project Settings → API → service_role
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   **Google Auth:** In the Supabase Dashboard, enable the Google provider under **Authentication → Providers**. Add your app URL (e.g. `http://localhost:3000`) to **Redirect URLs** and use `http://localhost:3000/auth/callback` as the callback path.

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   Then open `http://localhost:3000` in your browser.

## Data model assumptions

This admin UI is designed to work with a typical Supabase schema for a humor/meme project. It makes a few **lightweight assumptions**:

- **Profiles/users** live in a table called `profiles`. The `profiles` table must have an `is_superadmin` boolean column; only users with `is_superadmin = true` can sign in to this admin app. Ensure `profiles.id` matches `auth.users.id` (e.g. via a trigger that inserts a row into `profiles` on sign-up).
- **Images** live in a table called `images`
- **Captions** live in a table called `captions`
- Each table has an `id` column (usually a UUID)

If your table names are different, you can update the `from("…")` calls in:

- `src/components/StatsGrid.tsx`
- `src/components/UsersPanel.tsx`
- `src/components/ImagesPanel.tsx`
- `src/components/CaptionsPanel.tsx`

The **images panel** works with **arbitrary columns** by letting you edit raw JSON for a row. As long as the table has an `id` column, you can create, update, and delete any shape of data.

## Features

### Dashboard statistics

The **Stats** tab shows:

- **Total humans**: number of rows in `profiles`
- **Images in play**: number of rows in `images` and average images per user
- **Punchlines written**: number of rows in `captions` and average captions per image
- **Caption coverage**: how many images have at least one caption (based on `captions.image_id`)
- **Most talkative profile**: the user with the most captions (with image uploads as a tiebreaker)

All of this is computed client-side from Supabase queries so you can easily tweak the logic.

### Users / profiles

- Read‑only table backed by the `profiles` table
- Search across username, display name, full name, email, and id
- Shows a compact list with join time and truncated ids

### Images (full CRUD)

- Lists recent rows from the `images` table
- Lets you **create**, **edit**, and **delete** rows using a **JSON editor**
- Works with any column set as long as there is an `id` column
- Handy for quickly correcting bad URLs or assigning images to different users

### Captions (read‑only)

- Lists recent rows from the `captions` table
- Filters by `image_id` and `user_id`
- Truncates long caption text for a comfortable overview

## Tech stack

- **Next.js (App Router, TypeScript)**
- **Tailwind CSS** for layout and styling
- **@supabase/supabase-js** for database access from the browser

### Authentication (Google, superadmin-only)

- Sign-in uses **Google OAuth** via Supabase Auth.
- After the OAuth callback, the app checks the `profiles` table: only users with `is_superadmin = true` are allowed to stay logged in; others are signed out and redirected to the login page with an "unauthorized" message.
- Protected routes (e.g. the dashboard) redirect unauthenticated users to `/login`. Logged-in superadmins see their email and a **Sign out** button in the header.

