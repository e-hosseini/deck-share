# Deck Share

Organize files into **decks** and share them via public links. Upload and manage files, build decks from files or folders, create shareable links with optional password and expiry, and track visitor analytics.

## Quick start

### With Docker Compose (app + PostgreSQL)

```bash
git clone https://github.com/e-hosseini/deck-share.git
cd deck-share
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
docker compose up -d
# Run migrations once:
docker compose exec app npx prisma migrate deploy
```

Open http://localhost:3000. Default login is created on first run (see [GitHub README](https://github.com/e-hosseini/deck-share) for seed).

### Using this image with your own database

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret-min-32-chars" \
  -e UPLOAD_DIR="/app/uploads" \
  -v deck-share-uploads:/app/uploads \
  your-dockerhub-username/deck-share:latest
```

## Required environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Full URL of the app (e.g. `https://deck.example.com`) |
| `NEXTAUTH_SECRET` | Secret for NextAuth (min 32 characters) |
| `UPLOAD_DIR` | Path for file uploads (default `/app/uploads`; use a volume for persistence) |

## Tags

- **`latest`** – latest build from main
- **`0.1.0`** – version from [package.json](https://github.com/e-hosseini/deck-share/blob/main/package.json) (e.g. `0.1.0`, `0.1`)

## Documentation

Full docs, features, and setup: [GitHub – deck-share](https://github.com/e-hosseini/deck-share)

## License

MIT
