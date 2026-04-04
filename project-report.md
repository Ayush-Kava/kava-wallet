# Project Report

## Overview
- **Project**: Kava Wallet – personal finance web app (accounts, transactions, budgets, loans, credit cards, investments, goals, recurring rules, documents, analytics, settings).
- **Framework**: Next.js 15 (App Router) with TypeScript and React 18.
- **UI**: Tailwind CSS, Radix UI primitives, shadcn-style patterns, lucide/remix icons.
- **Data/State**: Prisma ORM, @tanstack/react-query, React Hook Form, Zod.
- **Auxiliary**: bcrypt for auth hashing, next-themes for theming, recharts for visualization.

## Architecture & Structure
- **App Router pages** under `src/app` with feature-specific routes (auth, dashboard, accounts, transactions, budgets, credit-cards, loans, goals, investments, recurring, documents, analytics, settings).
- **API routes** in `src/app/api` for server-side handlers.
- **Components** follow Atomic Design: atoms/molecules/organisms, with feature modules under `components/organisms/modules/*`.
- **Lib/Services**: shared utilities in `src/lib`, typed API services in `src/services/api`, React contexts in `src/contexts`, hooks in `src/hooks`, shared types in `src/types`.
- **Database**: Prisma schema and migrations in `prisma/`; migrations `20260126000000_init` and `20260126092909_initial_db` present.
- **Styling**: Tailwind config in `tailwind.config.ts`, global styles in `src/index.css` and `src/app/globals.css`.

## Key Implementations
- **Documents Module (Document Vault)**
  - DB tables: documents, document_links, document_reminders (with RLS/indices/soft-archive per Supabase guidance).
  - API layer: CRUD for documents, link/unlink entities, reminder CRUD at `src/services/api/documents.ts`.
  - Hooks: React Query queries/mutations in `src/hooks/useDocuments.ts`.
  - UI: upload form, document card, reminder form, link dialog under `src/components/organisms/modules/documents`.
  - Pages: listing `src/app/documents/page.tsx`, detail `src/app/documents/[id]/page.tsx`.
  - Storage helpers: Supabase upload/delete in `src/lib/document-upload-utils.ts`.

## Supporting Features
- **Auth**: Context in `src/contexts/AuthContext.tsx`; auth page at `src/app/auth/page.tsx`.
- **Financial Domains**: Page shells and routes exist for accounts, transactions, budgets, loans, credit cards, goals, investments, recurring rules, dashboard, analytics, settings.
- **UI Utilities**: Dropdowns, buttons, layout components in `src/components/atoms` and `src/components/organisms/layout`.

## Tooling & Standards
- **Scripts**: `dev`, `build`, `start`, `lint`, `prisma:generate`, `prisma:format`, `prisma:migrate` (see `package.json`).
- **Linting/TS**: ESLint (next config), TypeScript 5.8, strict typing practices.
- **Styling**: Tailwind with typography plugin, tailwind-merge, tailwindcss-animate.
- **Conventions**: Coding and structure guidelines in `docs/CODING_STANDARDS.md` and `docs/PROJECT-STRUCTURE.md` (atomic components, kebab-case files, 2-space indentation, single quotes, 100-char lines).

## Achievements & Solved Work
- Delivered end-to-end Documents Vault: database schema, API services, React Query hooks, UI flows, storage integration, and reminders.
- Established consistent project structure and coding standards across TS/React/Tailwind code.
- Set up multi-feature routing skeleton for core finance domains to support future builds.

## Risks / Follow-Ups
- README currently references Vite; update to reflect Next.js/App Router stack.
- Confirm Supabase storage bucket and RLS policies are applied for documents.
- Add tests for critical utilities and hooks (currently not enumerated).

## How to Run
1. Install deps: `npm install`
2. Dev server: `npm run dev`
3. Lint: `npm run lint`
4. Prisma: `npm run prisma:generate` after schema changes; `npm run prisma:migrate` for DB migrations.
