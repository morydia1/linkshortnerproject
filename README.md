# Link Shortener

A URL shortener web app: authenticated users create short links, and visitors who follow a short link are redirected to the original URL.

Built with Next.js 16 (App Router), Clerk, Neon Postgres + Drizzle ORM, Tailwind CSS 4, and shadcn/ui.

## Getting started

1. Install dependencies: `npm install`
2. Create a `.env` file with `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY`.
3. Start the dev server: `npm run dev` and open [http://localhost:3000](http://localhost:3000).

## Scripts

| Task | Command |
| --- | --- |
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Lint | `npm run lint` |
| Generate / apply migrations | `npx drizzle-kit generate` / `npx drizzle-kit migrate` |

## Contributing

Coding standards for contributors and AI agents are in [AGENTS.md](./AGENTS.md) and the per-layer guides in [`/docs`](./docs).
