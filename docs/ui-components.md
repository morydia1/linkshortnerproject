# UI Components (shadcn/ui)

Read this file before building or changing any UI: pages, layouts, forms, dialogs, tables, buttons, anything a user sees.

## Non-negotiable rules

1. **Every UI element uses shadcn/ui.** Buttons, inputs, forms, cards, dialogs, dropdowns, tables, badges, toasts, tabs, skeletons, alerts, navigation — if shadcn has a component for it, use it.
2. **Do not create custom components.** No hand-written reusable UI components, no wrappers around shadcn components, no "app-specific" component files, no custom re-implementations of a shadcn primitive. Compose screens directly from shadcn components inside the route files (`page.tsx`, `layout.tsx`, etc.).
3. **Missing component? Add it from shadcn — never write it.** Install it with the CLI (`npx shadcn@latest add <component>`), then use it. Check the CLI (`npx shadcn@latest --help`, e.g. `search`) when unsure whether a component exists. Only if shadcn genuinely has no equivalent, stop and ask the user before writing anything custom.
4. **Don't hand-edit generated files in `components/ui/`.** Customize through the component's `variant`/`size` props, `className`, and theme tokens in `app/globals.css`. Re-run the CLI to update a component.

## Project configuration

- `components.json`: style `base-nova`, RSC enabled, Tailwind 4 (CSS config at `app/globals.css`), base color `neutral`, CSS variables on, icon library `lucide`.
- Aliases: `@/components/ui` (components), `@/lib/utils` (utils), `@/hooks`.
- This style is built on **Base UI** (`@base-ui/react`), not Radix. **There is no `asChild` prop.** To render a shadcn component as another element (e.g. a link), use the `render` prop: `<Button render={<Link href="/dashboard" />}>Dashboard</Button>`. Read the installed file in `components/ui/` to confirm a component's actual props before using it.
- Installed components so far: `button`, `card`, `skeleton`. Everything else must be added via the CLI first.

## Usage rules

- **Import path:** `import { Button } from "@/components/ui/button"`.
- **Layout and spacing:** use Tailwind utility classes on plain semantic elements (`div`, `main`, `section`, `header`, `nav`) for structure. Those are layout, not components. Use `gap-*`, `flex`, `grid`; don't invent a layout component.
- **Class composition:** `cn()` from `@/lib/utils` when merging conditional classes onto shadcn components.
- **Variants:** use the built-in `variant` and `size` props (`default`, `outline`, `secondary`, `ghost`, `destructive`, `link`) rather than restyling with long class strings.
- **Theming:** semantic tokens only (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, …). No hard-coded colors, no inline `style`, no new CSS files. Support dark mode.
- **Icons:** `lucide-react` only, rendered inside shadcn components (e.g. inside `Button`).
- **Forms:** shadcn form primitives (`Input`, `Label`, `Textarea`, `Select`, `Checkbox`, `Field`/`Form` as provided by the installed registry). Never a raw `<input>`, `<button>`, `<select>`, `<textarea>`, or `<table>` styled by hand.
- **Feedback:** shadcn toast/sonner, `Alert`, `Skeleton` (for `loading.tsx`), `Dialog`/`AlertDialog` for confirmations.
- **Typography and links:** plain `h1`–`h6`, `p`, `ul` with Tailwind classes are fine. Internal links use `next/link`; use the `render` prop when a link should look like a shadcn `Button`.
- **Client boundaries:** many shadcn components are interactive. Keep `"use client"` at the smallest leaf; a Server Component page can still render shadcn components directly.
- **Accessibility:** keep the labels, `aria-*` attributes, and keyboard behavior shadcn provides; add `aria-label` to icon-only buttons.

## Third-party exceptions

- **Clerk components** (`SignInButton`, `SignUpButton`, `UserButton`, `<Show>`) are allowed, since auth UI comes from Clerk (see [authentication.md](./authentication.md)). Wrap a shadcn `Button` as the trigger: `<SignInButton mode="modal"><Button>Sign in</Button></SignInButton>`. Clerk styling comes from the `shadcn` theme in `ClerkProvider`.
- Next.js built-ins (`next/image`, `next/link`, `next/font`) are fine.
- Nothing else. Do not add another UI library (MUI, Chakra, Mantine, Headless UI, Ant, etc.) or install ad-hoc component packages.

## Allowed vs. not allowed

| Allowed | Not allowed |
| --- | --- |
| `<Button variant="outline" size="sm">` from `@/components/ui/button` | `<button className="rounded bg-blue-500 …">` |
| `npx shadcn@latest add card`, then `<Card>` in `page.tsx` | New `components/link-card.tsx` wrapping `Card` |
| `<Button render={<Link href="/x" />}>` | `<Button asChild>` (Radix-only) or `<a>` styled as a button |
| Layout with `div` + `flex gap-4` in a page | `components/page-container.tsx` layout wrapper |
| Tweaking tokens in `app/globals.css` | Editing `components/ui/button.tsx` by hand |

## Checklist before finishing a UI change

- [ ] Every interactive/visual element is a shadcn component (or a Clerk/Next.js exception above).
- [ ] No new custom component files; nothing added to `components/` outside `components/ui/` and CLI output.
- [ ] Any new shadcn component was installed via the CLI.
- [ ] Only semantic theme tokens; dark mode and mobile layouts work.
- [ ] `npm run lint` and `npm run build` pass.
