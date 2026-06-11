# Kava Wallet

Personal finance web app for tracking accounts, transactions, budgets, goals, loans, investments, recurring rules, and documents.

## Stack

- **Next.js 15** (App Router) + React 18 + TypeScript
- **Prisma** + PostgreSQL
- **TanStack Query** + **Zustand** for state
- **Zod** for validation
- **Tailwind CSS** + shadcn/ui
- **Cloudflare R2** for document uploads (presigned URLs)

## Getting started

```sh
npm install
cp .env.example .env
# Set POSTGRES_URL and R2 credentials in .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.example`](.env.example):

| Variable               | Description                        |
| ---------------------- | ---------------------------------- |
| `POSTGRES_URL`         | PostgreSQL connection string       |
| `R2_ACCOUNT_ID`        | Cloudflare account ID              |
| `R2_ACCESS_KEY_ID`     | R2 API key                         |
| `R2_SECRET_ACCESS_KEY` | R2 API secret                      |
| `R2_BUCKET_NAME`       | R2 bucket name                     |
| `R2_PUBLIC_URL`        | Public base URL for uploaded files |

## Project structure

```
src/
├── app/
│   ├── (branding)/     # Landing (/) and auth (/auth)
│   ├── app/            # Authenticated app (/app/*)
│   └── api/            # API routes
├── components/         # Atomic design (atoms/molecules/organisms)
├── store/              # Zustand stores (ui, filters)
├── lib/                # Utils, validation, money engine
├── services/           # API clients + Prisma repositories
└── hooks/
```

## Scripts

| Command                  | Description             |
| ------------------------ | ----------------------- |
| `npm run dev`            | Start dev server        |
| `npm run build`          | Production build        |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio`  | Open Prisma Studio      |
