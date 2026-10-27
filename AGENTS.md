# Agent Instructions — Link Shortener

Coding standards for LLM agents working in this repository. If a `/docs` file conflicts with this file, the `/docs` file wins for its layer.

> ## 🚨 MANDATORY — READ `/docs` BEFORE GENERATING ANY CODE 🚨
>
> **It is incredibly important that you ALWAYS read the relevant instruction file(s) in [`/docs`](./docs) BEFORE generating, editing, or suggesting ANY code. This is non-negotiable.**
>
> 1. Read this file first.
> 2. Identify every file in the [`/docs` table](#detailed-instruction-files-docs) that applies to the task (e.g. UI work → `docs/ui-components.md`; auth/Clerk/`proxy.ts`/user scoping → `docs/authentication.md`). When in doubt, read it.
> 3. Read each applicable file **in full** before writing a single line of code.
> 4. Only then write code — and follow those instructions exactly.
>
> Do NOT rely on memory, assumptions, or general framework knowledge in place of these docs. Skipping this step produces code that violates project standards and will be rejected. If a task spans several layers, read ALL the matching docs.

## Project Overview

A URL shortener web app: authenticated users create short links, and visitors following a short link are redirected to the original URL.

## Tech Stack (pinned in `package.json`)

| Concern | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Turbopack) with `cacheComponents` and `partialPrefetching` enabled |
| Language | TypeScript 5, `strict` mode |
| Auth | Clerk (`@clerk/nextjs`, `@clerk/ui`) |
| Database | Neon Postgres via `@neondatabase/serverless` |
| ORM / migrations | Drizzle ORM + drizzle-kit (`drizzle-orm@1.0` RC) |
| Styling | Tailwind CSS 4, `tw-animate-css` |
| UI components | shadcn/ui (style `base-nova`, built on `@base-ui/react`), `lucide-react` icons |
| Linting | ESLint 9 with `eslint-config-next` (core-web-vitals + typescript) |

## Commands

| Task | Command |
| --- | --- |
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Lint | `npm run lint` |
| Add shadcn component | `npx shadcn@latest add <component>` |
| Generate / apply migrations | `npx drizzle-kit generate` / `npx drizzle-kit migrate` |

There is no test runner configured. Before finishing any change, run `npm run lint` and `npm run build` (the build also type-checks).

## Project Structure

```text
app/            Routes, layouts, pages (App Router). Auth is Clerk modals only — no sign-in/sign-up routes
components/     components/ui/ holds shadcn components only (added via the shadcn CLI) — no custom components
db/             Drizzle client (index.ts) and schema
lib/            Shared helpers (e.g. cn() in utils.ts)
docs/           Detailed per-layer agent instructions
proxy.ts        Clerk middleware (Next.js 16 "proxy" convention — replaces middleware.ts)
```

Path alias: `@/*` maps to the repo root. Always import with `@/...` (e.g. `@/db`, `@/lib/utils`, `@/components/ui/button`), never deep relative paths like `../../`.

## Critical Rules

### 1. This is not the Next.js you know
Next.js 16 has breaking changes versus most training data. **Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`** (App Router docs live in `01-app/`) and heed deprecation notices. Specifics to remember:

- `middleware.ts` is now **`proxy.ts`**. Do not create `middleware.ts`.
- `params`, `searchParams`, `cookies()`, and `headers()` are **async** — `await` them.
- Use the global typed helpers (`PageProps<"/route">`, `LayoutProps<"/route">`) as in `app/layout.tsx`.
- `cacheComponents: true` is on: data fetching is **dynamic by default**; opt in to caching with `"use cache"`. Anything reading request-time data (session, cookies, headers, `searchParams`) must render inside a `<Suspense>` boundary or it will fail the build/validation. See `01-app/02-guides/authentication-with-cache-components.md`.
- Do not edit `next.config.ts` flags, `next-env.d.ts`, or `.next/` unless the task requires it.

### 2. Server Components by default
Every component is a Server Component unless it needs state, effects, event handlers, or browser APIs. Add `"use client"` only at the smallest leaf component that needs it; never at a page or layout level just for convenience. Never import `db`, server-only helpers, or secrets into a client component.

### 3. Authentication & authorization (Clerk)
Full rules: [`docs/authentication.md`](./docs/authentication.md). **Before writing any auth code, load the matching Clerk skill from `.agents/skills/` (or `.claude/skills/`)** — e.g. `clerk-nextjs-patterns`, `clerk-custom-ui`, `clerk-setup`.

- **Clerk is the only auth method.** Never add or suggest any other (NextAuth, custom sessions/JWTs, etc.).
- `/dashboard` is protected: call `await auth.protect()` in every dashboard page, Server Action, and Route Handler (plus a `loading.tsx` per page). `proxy.ts` stays a bare `clerkMiddleware()` and does not protect routes by itself.
- Signed-in users who visit `/` are redirected to `/dashboard`.
- Sign-in and sign-up **always open as a Clerk modal** (`<SignInButton mode="modal">`, `<SignUpButton mode="modal">`). Don't link to or build full-page sign-in/sign-up flows.
- Server-side: `import { auth } from "@clerk/nextjs/server"` and `const { userId } = await auth()`. Conditional UI: `<Show when="signed-in" | "signed-out">` wrapped in `<Suspense>`.
- **Every database query for user-owned data must be scoped by the authenticated `userId`** (e.g. `where(eq(links.userId, userId))`). Never trust a user id sent from the client.

### 4. Database (Drizzle + Neon)
- Import the single shared client: `import db from "@/db"`. Do not create new clients.
- All schema lives in `db/` and is defined with `drizzle-orm/pg-core`. Schema changes require a generated migration via drizzle-kit — never hand-edit generated SQL or the database directly.
- Use Drizzle's query builder and operators (`eq`, `and`, …). **No string-concatenated SQL**; use the `sql` template tag with parameters if raw SQL is unavoidable.
- Keep data access in server-only modules (e.g. `db/queries/*` or `lib/*` with `import "server-only"`), not inline in components.
- Naming: tables are plural `snake_case` in SQL, `camelCase` in TypeScript; every table has a primary key and `createdAt`/`updatedAt` timestamps where applicable.

### 5. Mutations
Use Server Actions (`"use server"`) for mutations from the UI and Route Handlers (`app/**/route.ts`) for the public redirect endpoint and external consumers. For every mutation:

1. Authenticate (`auth()`).
2. Validate and sanitize input on the server (never rely on client validation); destination URLs must be well-formed `http`/`https`.
3. Perform the `userId`-scoped DB write.
4. Revalidate affected paths/tags (`revalidatePath` / `revalidateTag`).
5. Return a typed result or throw a handled error — never leak internal errors or stack traces to the client.

### 6. Security
- Secrets come from environment variables only; never hard-code, log, or commit them. `.env` is git-ignored — do not print or commit its contents.
- Only `NEXT_PUBLIC_*` variables may reach client code. Required server vars: `DATABASE_URL`, `CLERK_SECRET_KEY`.
- Reject non-`http(s)` destination URLs (`javascript:`, `data:`, etc.) to prevent XSS/open-redirect abuse when redirecting.
- Do not disable lint rules, type checks, or auth checks to make code compile.

## Code Style

### TypeScript
- `strict` is on. No `any` (use `unknown` and narrow); no `@ts-ignore`/`@ts-expect-error` without a one-line justification.
- Use `import type` for type-only imports. Infer DB types from the schema (`typeof links.$inferSelect` / `$inferInsert`) rather than hand-writing them.
- Avoid non-null assertions (`!`) except for the existing env access in `db/index.ts` and `drizzle.config.ts`.
- Named exports for components, helpers, and types; default exports only where Next.js requires them (pages, layouts, route files) and the existing `db` client.

### React / Next.js
- Function components only for route files (`page.tsx`, `layout.tsx`, …), typed props via a local `type Props`. Do not create custom reusable UI components (see Styling & UI).
- Next.js special files keep their reserved names (`page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`).
- Use `next/image`, `next/link`, and `next/font` rather than raw `<img>`, `<a>` for internal links, or `<link>` fonts.
- Provide `loading.tsx`/`<Suspense>` fallbacks for streamed content and `error.tsx`/`not-found.tsx` where routes can fail.
- Set meaningful per-route `metadata`.

### Styling & UI
Full rules: [`docs/ui-components.md`](./docs/ui-components.md).

- **ALL UI elements use shadcn/ui. Do NOT create custom components** — no hand-written or wrapper components; compose screens directly from shadcn components in route files. Missing component? Install it with `npx shadcn@latest add <component>`; never write it by hand. (Clerk components and `next/*` built-ins are the only exceptions.)
- The `base-nova` style uses Base UI: no `asChild`; use the `render` prop (e.g. `<Button render={<Link href="/x" />}>`).
- Don't hand-edit files in `components/ui/`; customize via `variant`/`size` props, `className`, and theme tokens.
- Tailwind utility classes only; theme values via the CSS variables in `app/globals.css` (`bg-background`, `text-foreground`, `bg-primary`, …). No inline `style` props, no hard-coded hex colors, no new CSS files.
- Compose class names with `cn()` from `@/lib/utils`.
- Icons: `lucide-react` only.
- Support dark mode (`dark:` variant is configured) and responsive layouts (mobile first).
- Accessibility: semantic HTML, labelled controls, alt text, keyboard-operable interactions.

### General
- Small, single-purpose functions and components; early returns over deep nesting.
- Comment only non-obvious intent ("why"), not what the code does.
- No dead code, `console.log`, or commented-out blocks.
- Match surrounding formatting (2-space indent, double quotes, semicolons). Don't reformat unrelated code.
- Don't add dependencies unless needed; prefer what's already installed.

## Known Issues to Be Aware Of

- `db/schema.ts` exists but is empty: no tables (e.g. `links`) are defined yet and no migrations have been generated. Define the schema, then run `npx drizzle-kit generate` / `migrate`.
- `components/ui/*.tsx` import `cn` from the `cn` npm package. That is what the shadcn registry currently generates (the package is a declared dependency), so leave it; `lib/utils.ts` re-exports it and new code should import `cn` from `@/lib/utils`.
- `/dashboard` is still a placeholder (`<h1>Dashboard</h1>`); link creation/listing, the `links` table, and the public short-link redirect route are not implemented yet.
- There is no `error.tsx` / `not-found.tsx` yet, and `next.config.ts` has `experimental.agentFeedback` enabled (managed by `next dev`; don't remove).

## Detailed Instruction Files (`/docs`)

Task-specific standards live in `/docs`. **You MUST ALWAYS read every file that applies to your task, in full, BEFORE generating any code.** When a new file is added there, register it in this table.

| File | Read it when… | Status |
| --- | --- | --- |
| [`docs/authentication.md`](./docs/authentication.md) | Touching Clerk, sign-in/sign-up, `proxy.ts`, `/dashboard` protection, homepage redirect, or user scoping | Active |
| [`docs/ui-components.md`](./docs/ui-components.md) | Building or changing any UI: pages, forms, dialogs, buttons, layout, theming, adding shadcn components | Active |

## Definition of Done

- The applicable `/docs` file(s) were read **before** any code was written.
- Change follows this file and every applicable `/docs` file.
- `npm run lint` and `npm run build` both pass.
- No secrets, debug output, or unrelated changes included.
- User-owned data access is authenticated and scoped to the current `userId`.
