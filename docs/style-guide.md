# YouTubeFetcher UI Style Guide

This project uses Tailwind (v4) plus a small set of CSS tokens (CSS variables) defined in `src/app/globals.css`.

## Design Tokens

Tokens are CSS variables under `:root` and are consumed via `rgb(var(--token))`.

**Core**
- `--bg`: app background
- `--fg`: primary text
- `--muted`, `--muted-2`: secondary/tertiary text
- `--card`: card surface background
- `--border`: hairline borders
- `--primary`, `--primary-fg`: primary action colors
- `--ring`: focus ring color
- `--success`, `--danger`: semantic accents
- `--radius`: base corner radius

## Typography

**Rules**
- Use `font-semibold` for headings and key values.
- Use `text-[rgb(var(--muted))]` for supporting text.
- Prefer `text-sm` for controls and meta text.

**Recommended scale**
- Page title: `text-3xl font-semibold tracking-[-0.02em]`
- Section title: `text-base font-semibold tracking-[-0.01em]`
- Body/meta: `text-sm text-[rgb(var(--muted))]`

## Spacing

Keep spacing consistent so the UI feels “snapped” into a grid.

- Tight group gaps: `gap-2`
- Control stacks: `gap-3` / `gap-4`
- Layout gutters: `gap-6`
- Page padding: `px-4 py-8` (upgrade to `sm:px-6`)

## Component Library

Components live in `src/components/ui/*` and are designed to be composable and accessible by default.

### Button

File: `src/components/ui/Button.tsx`

```tsx
import { Button } from "@/components/ui/Button";

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
<Button disabled>Disabled</Button>
```

### Input

File: `src/components/ui/Input.tsx`

```tsx
import { Input } from "@/components/ui/Input";

<label className="text-sm font-medium" htmlFor="q">Channel</label>
<Input id="q" placeholder="https://www.youtube.com/@…" />
```

### Select

File: `src/components/ui/Select.tsx`

```tsx
import { Select } from "@/components/ui/Select";

<Select defaultValue="20">
  <option value="10">10</option>
  <option value="20">20</option>
  <option value="50">50</option>
</Select>
```

### Card

File: `src/components/ui/Card.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

<Card>
  <CardHeader>
    <CardTitle>Filters</CardTitle>
    <CardDescription>Refine the results.</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
</Card>
```

### Badge

File: `src/components/ui/Badge.tsx`

```tsx
import { Badge } from "@/components/ui/Badge";

<Badge>Neutral</Badge>
<Badge variant="success">Watched</Badge>
<Badge variant="danger">Error</Badge>
```

### Divider

File: `src/components/ui/Divider.tsx`

```tsx
import { Divider } from "@/components/ui/Divider";

<Divider />
```

## Accessibility (WCAG 2.1)

**Keyboard navigation**
- All interactive elements must be reachable with Tab.
- Use `focus-visible:ring-*` utilities for focus indicators (already baked into the component primitives).

**Color contrast**
- Use muted text only for secondary information.
- Avoid using muted colors for critical buttons or status states.

## Layout Patterns

**Responsive grid**
- Use `lg:grid-cols-[360px_1fr]` for the app’s two-column layout.
- Keep cards aligned by using consistent `gap-*` spacing across columns.

## Visual Reference

Visit `/style-guide` in the app for a live preview of tokens and components.

