<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# fixapp — OpenCode instructions

## Stack
- **Framework**: Next.js 16.2.6 + React 19.2.4 (App Router)
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"`, not v3 directives; custom tokens via `@theme inline {}`)
- **Language**: TypeScript strict
- **Linting**: ESLint v9 flat config (`eslint.config.mjs`)

## Commands
| Action | Command |
|---|---|
| Dev server | `npm run dev` (port 3000) |
| Build | `npm run build` |
| Start prod | `npm start` |
| Lint | `npm run lint` |
| Unit test | `npm test` (vitest watch) |
| Unit test (CI) | `npm run test:run` |

## Config
- `cacheComponents: true` enables Partial Prerender (◐); client providers with dynamic APIs need `<Suspense>`
- `optimizePackageImports` for barrel libs (lucide-react, date-fns) in `experimental` block

## Database
- **ORM**: Prisma 7 with SQLite (dev) / PostgreSQL (prod)
- Client: `import prisma from "@/lib/prisma"` — singleton with hot-reload safety
- Migration: `npx prisma migrate dev --name <name>` to create a new migration
- Studio: `npx prisma studio` to browse data
- Switch to PostgreSQL: change `provider` to `"postgresql"` in `prisma/schema.prisma`, set `DATABASE_URL` to Postgres URL, run `npx prisma migrate dev`
- Prisma v7 requires a driver adapter (currently `@prisma/adapter-better-sqlite3`)

## UI & Libraries
- **shadcn/ui** components in `components/ui/` (Button, Input, Dialog, Table, Card, Badge, Select, Separator)
- **lucide-react** for icons
- **framer-motion** for animations
- **react-hook-form** + **zod** for form handling and validation
- **@tanstack/react-query** for server state management
- **next-auth** v5 beta for authentication (Credentials provider, route at `/api/auth/[...nextauth]`)
- **date-fns** for date manipulation
- All providers (Query, Auth) are wrapped in `app/layout.tsx`

## UI Standards
- **Card tiers**: Primary `rounded-xl bg-card p-5 shadow-sm`, Secondary `rounded-xl bg-muted/10 p-5`, List `divide-y divide-border/60 rounded-xl bg-card` — no border, no decorative orange
- **Input**: `rounded-lg border border-border bg-input px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/25 focus:border-primary/50`
- **Label**: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
- **Alert**: `rounded-lg border px-4 py-3 text-sm animate-in fade-in` with `*-destructive*` (error) or `*-accents-green*` (success)
- **Badge mapping**: `diterima→outline`, `menunggu_part→secondary`, `dikerjakan→default`, `selesai/LUNAS→default` + `bg-accents-green text-white`, `BELUM_LUNAS→destructive`, `DP→secondary`
- **Theme**: dark (bg `#141413`, card `#1a1a19`, fg `#faf9f5`), primary `#d97757` (terracotta), accents: blue/green/orange(#c9956b)/warm
- **Custom utilities**: `card-hover`, `focus-ring`, `gradient-card`, `glass-card`, `radial-ambient`, `shimmer`

## Conventions
- Path alias: `@/*` → project root (e.g. `@/app/page`)
- Money: stored as integer sen (Rupiah × 100), format with `formatHarga()` from `@/lib/constants`
- Server Actions: return `{ error: string }` or `{ success: boolean, error?: string }`, use `useActionState`
- Data fetching: server components call `lib/data/*` directly; mutations via server actions
- Dashboard streaming: multiple async sub-components calling the same `React.cache()`-wrapped function (dedup per request)
- Prisma enum validation: use `z.nativeEnum()` not `z.enum([...])`
- No CI pipeline yet

## Test
- **Vitest** for unit/integration tests in `app/__tests__/` or `lib/__tests__/`
- Vitest: `npm test` (watch) or `npm run test:run` (single run)

## Gotchas
- Tailwind v4: use `@import "tailwindcss"` in CSS, NOT `@tailwind base/components/utilities`
- Next.js 16 docs available locally at `node_modules/next/dist/docs/`
- Prisma v7: constructor requires `{ adapter }` — not zero-arg like v5/v6
- Prisma v7: `npx prisma db push` works when `npx prisma migrate dev` fails (exit 130)
- Google Fonts (Geist) build fetch fails intermittently — retry `npm run build`
- Print/invoice: use `window.open()` + HTML string build, NOT `@media print` CSS
- Service number format `SRV-YYMMDD-NNN` stored in `noService String @unique` on ServiceOrder
- Keyboard: `Ctrl+K` / `/` focus search, `n` new service (from services list)
- Delete cascade: ServicePart `onDelete: Cascade` — deleting order cleans up all parts
- `'use cache'` + `cacheLife()` + `cacheTag()` utk data jarang berubah; `updateTag()` utk read-your-writes invalidation
- Build output ◐ = Partial Prerender (static HTML shell + dynamic streaming via Suspense)
