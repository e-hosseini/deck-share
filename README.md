# Deck Share

Deck Share is a web application for organizing files into **decks** and sharing them via public links. Admins upload and organize files, build decks from files or whole folders, and create shareable links. Visitors open a link to browse and view content in-app; all visits and actions are tracked for analytics.

> **Disclaimer:** We do not guarantee the security of files or data stored or served by this application. Use this project at your own risk.

---

## Goal

- **For admins:** Upload and organize files in a folder tree, create decks (collections of files and/or folders), and publish shares with a unique URL. Configure each share with title, description, audience, expiry, optional password, and optional single-use access.
- **For visitors:** Open a share link, browse the deck (files and folders), preview supported documents in the browser, download files, and optionally follow a call-to-action (CTA).
- **Analytics:** Track unique visitors, first/last open, and per-visitor actions (page view, file open, file download, directory open, navigation). Optional PostHog integration for richer analytics.

---

## Supported Files

The following file types are accepted for upload and can be previewed in-app (in both the admin file manager and the public share view).

| Category   | Extensions        | MIME types / notes |
|-----------|-------------------|--------------------|
| **PDF**   | `.pdf`            | `application/pdf` |
| **Images**| `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` | `image/jpeg`, `image/png`, `image/gif`, `image/webp` |
| **Video** | `.mp4`, `.webm`, `.mov` | `video/mp4`, `video/webm`, `video/quicktime` |
| **Word**  | `.doc`, `.docx`   | `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` — rendered as HTML in-app |
| **Excel** | `.xls`, `.xlsx`   | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` — rendered as HTML tables in-app |
| **PowerPoint** | `.ppt`, `.pptx` | `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` — rendered with slide viewer in-app |

Unsupported types can still be uploaded if added to the allow-list; they will show a “Preview not available, use Download” message. Download is available for all stored files.

---

## Features

### Authentication

- Email/password login (NextAuth).
- Change password from Settings.
- Session-based access to the dashboard.

### Files

- **Upload** files (multipart or chunked) into a root folder or any directory.
- **Directory tree:** Create nested folders and organize files.
- **File manager UI:** Browse folders, preview supported types (PDF, images, video, DOCX, XLSX, PPTX), download.
- **Storage:** Files stored on disk (configurable `UPLOAD_DIR`); paths stored in PostgreSQL via Prisma.

### Decks

- **Create decks** with name and optional description.
- **Add content:** Add individual files or entire folders from your file library (folders expand to their contents in the deck).
- **Order:** Deck items can be reordered; history of add/remove/reorder is recorded.
- **Edit:** Rename, update description, add/remove items, deactivate.

### Shares

- **Create a share** from a deck. Each share has:
  - **Slug:** Short unique URL path (e.g. `/share/abc123`).
  - **Title, description** (rich text), **audience name**.
  - **Expiry date.**
  - **Optional:** target link, contact email, password protection, single-use link.
- **Public share page:** Visitors open `/share/[slug]`. If password is set, they must enter it once. Single-use links invalidate after first successful load.
- **Share content view:** Browse deck (files and folders), open files in-app preview or download. Optional global CTA (e.g. “Sign up” or “Contact us”) can be shown in a modal or banner.

### Visitor tracking and analytics

- **Visitor identity:** Fingerprint (UA, language, screen, timezone) hashed; same fingerprint on same share = same visitor.
- **Stored per visitor:** First/last seen, IP, user agent, country, region, referrer (when available).
- **Actions:** `page_view`, `file_open`, `file_download`, `directory_open`, `navigation`.
- **Share analytics dashboard:** List of visitors, first/last opened, unique visitor count.
- **Visitor detail page:** Per-visitor timeline of actions (which files opened, downloads, etc.).
- **Optional:** PostHog project key and host in Settings for external product analytics.

### Settings

- **Account:** Change password.
- **Global CTA:** Title, description, link, and button label shown to visitors (e.g. on share page).
- **Site:** Website title, footer copyright, footer links (label + URL), custom logo (upload).
- **Analytics:** PostHog project key and host (optional).

---

## Tech stack

- **Runtime:** Node.js 20+
- **Framework:** Next.js 16, React 19
- **Database:** PostgreSQL, Prisma
- **Auth:** NextAuth 5
- **UI:** Tailwind CSS 4, Radix UI, shadcn-style components
- **Documents:** react-pdf (PDF), mammoth (DOCX→HTML), xlsx (XLSX→HTML), pptxviewjs (PPTX slides)
- **Other:** Zod, react-hook-form, TipTap (rich text), Chart.js, PostHog (optional), JSZip

---

## Prerequisites

- Node.js 20+
- PostgreSQL 16 (or use Docker)
- npm / yarn / pnpm

---

## Environment

Copy the example env and set at least `DATABASE_URL` and `NEXTAUTH_SECRET`:

```bash
cp .env.example .env
```

Edit `.env`:

- `DATABASE_URL` – Postgres connection string (see below for Docker).
- `NEXTAUTH_SECRET` – e.g. `openssl rand -base64 32`.
- `NEXTAUTH_URL` – app URL (e.g. `http://localhost:3000` for dev).
- `UPLOAD_DIR` – directory for uploads (default `./uploads`).

---

## Development

### 1. Start the database

With Docker:

```bash
docker compose -f docker-compose.dev.yml up -d postgres
```

Then set in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/deck_share?schema=public"
```

Or use any existing Postgres 16 instance and set `DATABASE_URL` accordingly.

### 2. Install dependencies and generate Prisma client

```bash
npm install
npx prisma generate
```

### 3. Run migrations

```bash
npx prisma migrate deploy
```

(Or `npx prisma migrate dev` to create new migrations while developing.)

### 4. Seed an admin user (optional)

```bash
npm run db:seed
```

Creates `admin@example.com` / `admin123`. Change or remove in production.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Log in, then use **Files**, **Decks**, **Shares**, and **Settings**.

### Build (dev / CI)

To verify the app builds:

```bash
npm run build
```

---

## Production

### Build

```bash
npm install
npx prisma generate
npm run build
```

### Run

Set production env vars (e.g. in `.env.production` or your host), then:

```bash
npm run start
```

Runs the app in production mode (port 3000 by default).

### Migrations

Run once per deploy (or when schema changes):

```bash
npx prisma migrate deploy
```

---

## Docker (production)

### Option A: Run with pre-built image from Docker Hub

Use the image published by the [GitHub Actions workflow](.github/workflows/docker-publish.yml) (on push to `main` or tags `v*`). Replace `YOUR_DOCKERHUB_USERNAME` with your Docker Hub username (or the org that publishes the image). The repository name is your GitHub repo name (e.g. `deck-share` or `animations`).

1. Create a directory and add a `.env` file with at least:

   ```env
   NEXTAUTH_SECRET=your-secret-from-openssl-rand-base64-32
   NEXTAUTH_URL=https://your-domain.com
   ```

2. Save as `docker-compose.yml`:

   ```yaml
   services:
     postgres:
       image: postgres:16-alpine
       container_name: deck-share-db
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
         POSTGRES_DB: deck_share
       volumes:
         - postgres_data:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U postgres"]
         interval: 5s
         timeout: 5s
         retries: 5

     app:
       image: YOUR_DOCKERHUB_USERNAME/deck-share:latest
       container_name: deck-share-app
       ports:
         - "3000:3000"
       environment:
         DATABASE_URL: postgresql://postgres:postgres@postgres:5432/deck_share?schema=public
         NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
         NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
         UPLOAD_DIR: /app/uploads
       volumes:
         - uploads_data:/app/uploads
       depends_on:
         postgres:
           condition: service_healthy()

   volumes:
     postgres_data:
     uploads_data:
   ```

3. Start the stack:

   ```bash
   docker compose up -d
   ```

4. Run migrations once. From the host (same machine as the running stack):

   ```bash
   docker compose exec app npx prisma migrate deploy
   ```

5. Create an admin user (e.g. seed):

   ```bash
   docker compose exec app npm run db:seed
   ```

6. Open the app at [http://localhost:3000](http://localhost:3000) (or your `NEXTAUTH_URL`).

To use a specific tag (e.g. `v1.0.0` or `main`), set the `app` image to e.g. `YOUR_DOCKERHUB_USERNAME/deck-share:v1.0.0` or `YOUR_DOCKERHUB_USERNAME/deck-share:main`.

### Option B: Build and run locally

Build and run app + Postgres with Docker Compose from source:

```bash
# Set NEXTAUTH_SECRET (and optionally NEXTAUTH_URL) in .env
docker compose up -d --build
```

- App: [http://localhost:3000](http://localhost:3000).
- Postgres and uploads use named volumes.

Apply migrations after first deploy (from host with `DATABASE_URL` pointing at the Postgres container):

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/deck_share?schema=public"
npx prisma migrate deploy
```

Then create an admin user (e.g. run the seed script against that DB or create a user via your own process).

---

## Scripts

| Script           | Description                          |
|------------------|--------------------------------------|
| `npm run dev`    | Start dev server (hot reload)        |
| `npm run build`  | Build for production                 |
| `npm run start`  | Start production server              |
| `npm run db:seed`| Seed admin user (dev)                |
| `npm run db:migrate`  | Run migrations (`prisma migrate dev`) |
| `npm run db:generate` | Regenerate Prisma client           |
