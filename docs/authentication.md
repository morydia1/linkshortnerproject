# Authentication (Clerk)

Read this file before touching anything related to sign-in, sign-up, sessions, `proxy.ts`, route protection, or user-scoped data.

## Non-negotiable rules

1. **Clerk is the only authentication system.** Never add, suggest, or hand-roll another method: no NextAuth/Auth.js, Lucia, Supabase Auth, Firebase Auth, custom JWTs/sessions/cookies, password tables, or API-key logins for users.
2. **`/dashboard` is protected.** A signed-out visitor must never see it.
3. **Signed-in users never see the homepage (`/`).** They are redirected to `/dashboard`.
4. **Sign-in and sign-up always open as a Clerk modal.** Never link to or render a full-page `<SignIn />`/`<SignUp />` as the primary flow.
5. **Load the matching Clerk skill first.** Before writing any auth code, read the relevant skill in `.agents/skills/` (mirrored in `.claude/skills/`):

| Task | Skill |
| --- | --- |
| Route protection, `auth()`, Server Actions, API routes, caching with auth, `<Show>` | `clerk-nextjs-patterns` |
| Appearance/theme (shadcn theme), custom flows, `<Show>` details | `clerk-custom-ui` |
| Install/config/env/provider setup | `clerk-setup` |
| Webhooks / syncing Clerk users to the database | `clerk-webhooks` |
| Organizations, roles, permissions | `clerk-orgs` |
| E2E tests for auth flows | `clerk-testing` |
| Backend REST API / CLI tasks | `clerk-backend-api`, `clerk-cli` |

Version in use: `@clerk/nextjs` 7.x (Core 3). Follow the "current SDK" guidance in the skills and ignore "Core 2 ONLY" callouts.

## Setup (already in place — don't duplicate)

- `<ClerkProvider appearance={{ theme: shadcn }} signInUrl="/" signUpUrl="/">` wraps the app in `app/layout.tsx`; the `shadcn` theme and `@clerk/ui/themes/shadcn.css` stay in place so Clerk UI (including the modal) matches shadcn. The `signInUrl`/`signUpUrl` props point at `/` (the homepage with the modal buttons) and override any `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`SIGN_UP_URL` env values. There are no `/sign-in` or `/sign-up` routes.
- `proxy.ts` exports a bare `clerkMiddleware()` with the standard matcher (keep the `/(api|trpc)(.*)` entry so `auth()` works in API routes). The file is `proxy.ts`, not `middleware.ts`.
- Env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (server only). Never print or commit them.
- Do not use `createRouteMatcher` (deprecated in `@clerk/nextjs` 7).

## Sign-in / sign-up: always a modal

Use Clerk's buttons with `mode="modal"`, and send users to the dashboard afterwards:

```tsx
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Suspense } from "react";

<Suspense>
  <Show when="signed-out">
    <SignInButton mode="modal" forceRedirectUrl="/dashboard">
      <Button variant="outline">Sign in</Button>
    </SignInButton>
    <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
      <Button>Sign up</Button>
    </SignUpButton>
  </Show>
  <Show when="signed-in">
    <UserButton />
  </Show>
</Suspense>
```

- Every sign-in/sign-up trigger anywhere in the app (header, hero, call-to-action buttons, "login required" prompts) must be a `SignInButton`/`SignUpButton` with `mode="modal"`. To use shadcn styling, wrap a `Button` as the child: `<SignInButton mode="modal"><Button>Sign in</Button></SignInButton>`.
- Never use `<Link href="/sign-in">`, `redirectToSignIn()`, or `<SignIn />`/`<SignUp />` as the way users authenticate.
- Server-rendered `<Show>` reads the session, so it must be inside `<Suspense>` (the app uses `cacheComponents`).
- Do not recreate `app/sign-in` or `app/sign-up` routes (they were removed). Clerk's sign-in/sign-up URLs point at `/` via `ClerkProvider`, so any Clerk-initiated redirect lands on the homepage, where the modal buttons are, rather than on a full-page form.

## `/dashboard` protection

Protect the resource itself — `proxy.ts` stays bare. Every page, Server Action, and Route Handler under `/dashboard` (and any user-owned data) calls `auth.protect()`:

```tsx
// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth.protect();
  // load data scoped to userId
}
```

```tsx
// app/dashboard/loading.tsx — required: auth.protect() reads the request, and cacheComponents fails the build without a Suspense boundary
export default function Loading() {
  return <p>Loading…</p>;
}
```

- Add a `loading.tsx` next to every page that gates its whole render with `auth.protect()`.
- Every nested dashboard page checks for itself. A check in `app/dashboard/layout.tsx` is an addition, never a substitute (layouts are not always re-rendered).
- Server Actions: call `await auth.protect()` first. Route Handlers: `auth.protect()` (404 when signed out) or check `isAuthenticated` from `await auth()` to return an explicit `401`; use `403` for signed-in-but-not-allowed.
- Because `/dashboard` must not push signed-out users to a full-page sign-in, if `auth.protect()` would redirect to a non-modal sign-in page, instead check `const { userId } = await auth()` and `redirect("/")` when it is null. The homepage then offers the modal sign-in.

## Homepage redirect for signed-in users

Redirect in `proxy.ts` (a real 307 before rendering) **and** keep a page-level guard as a fallback:

```ts
// proxy.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname === "/") {
    const { userId } = await auth();
    if (userId) return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});
```

```tsx
// app/page.tsx — fallback guard, inside Suspense (cacheComponents)
async function RedirectIfSignedIn() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return null;
}
// render <Suspense><RedirectIfSignedIn /></Suspense> in the page; keep the page itself synchronous
```

This redirect is a navigation convenience only. It is not what secures `/dashboard`; `auth.protect()` in the page is.

## User data

- Get the user id only from the server session (`await auth()`), never from request bodies, params, or search params.
- Scope every query on user-owned rows by that `userId` (`where(eq(links.userId, userId))`). A resource owned by someone else is "not found".
- Never call `auth()` inside a `"use cache"` function. Read `userId` outside and pass it in as an argument so it is part of the cache key.
- Store the Clerk `userId` (string) as the foreign key/owner column; don't copy emails or profile data unless synced via the `clerk-webhooks` skill.

## Checklist before finishing an auth-related change

- [ ] No non-Clerk auth code introduced.
- [ ] Sign-in/sign-up triggers use `mode="modal"`.
- [ ] `/dashboard` pages, actions, and handlers each call `auth.protect()`; `loading.tsx` exists.
- [ ] Signed-in users on `/` end up on `/dashboard`.
- [ ] Server-read auth UI is inside `<Suspense>`; `npm run build` passes.
- [ ] All user-owned queries are scoped by the session `userId`.
