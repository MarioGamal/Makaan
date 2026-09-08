# Frontend architecture

How the buyer-facing interface is built: the design system, where files go, how
search state is held, and what renders on the server.

Stack: Next.js 16 **Pages Router**, React 19, Tailwind CSS 3, SWR 2, TypeScript.
Types shared with the backend come from `@makaan/shared`.

---

## 1. Design system

### Colour is a role, not a shade

Every colour lives in `src/styles/globals.css` as a CSS custom property holding
**space-separated sRGB channels**:

```css
--color-primary: 18 92 78;
```

`tailwind.config.ts` wraps each one as `rgb(var(--color-x) / <alpha-value>)`.
Two consequences, both deliberate:

- Opacity modifiers work — `bg-primary/10`, `text-ink/70`, `border-border/50`.
  A hex-valued custom property silently ignores the modifier and renders opaque,
  which is the bug this shape avoids.
- A component asks for a **role** (`surface`, `ink-muted`, `border-strong`) and
  the active theme supplies the value, so the dark theme is a second block of
  the same names rather than a second set of components.

| Role | Use |
| --- | --- |
| `canvas` | Page background |
| `surface`, `surface-raised`, `surface-muted`, `surface-sunken` | Panels, cards, wells |
| `ink`, `ink-muted`, `ink-subtle` | Text in descending emphasis |
| `border`, `border-strong` | Hairlines; hover/active hairlines |
| `primary`, `primary-strong`, `primary-soft` | Brand green: text, hover, tint |
| `accent`, `success`, `warning`, `danger` (+ `-soft`) | Terracotta and status |
| `scrim` | Modal and drawer overlays |

### Text green and surface green are different colours

On a light theme, one green works for a label and for a filled button. On a dark
theme it cannot: a green readable against a near-black canvas is far too light
to carry white text.

So the background role points at its own token:

```ts
backgroundColor: {
  primary: token('primary-surface'), // filled green, always pairs with white
  ink:     token('ink-surface'),     // inverts on dark
}
colors: {
  primary: token('primary'),         // readable-on-canvas green: text, icons, borders
}
```

`bg-primary text-white` therefore stays legible in both themes with no
`dark:` variant anywhere in the codebase, and `text-primary` stays readable on
whichever canvas is active. The one rule this creates: **`bg-ink` pairs with
`text-on-ink`, never `text-white`** — `ink` inverts between themes.

### Theme switching

Three states — light, dark, and match-the-device — stored in the
`makaan_theme` cookie:

1. `_document` reads the cookie during SSR and puts `class="dark"` on `<html>`
   when the preference is explicit. The correct theme is in the first byte of
   HTML.
2. A small inline script in `<head>` settles the `system` case before first
   paint, so there is no flash.
3. `ThemeProvider` owns the preference at runtime and follows
   `prefers-color-scheme` live while the preference is `system`.

A cookie rather than `localStorage` precisely because the server renders the
page: `localStorage` is only readable after hydration, which is what produces
the white flash on a dark-themed site.

### Type, radii, shadow, motion

- **Type**: `IBM Plex Sans Arabic` first, `Inter Tight` after it. Arabic is the
  default language, and one family covering both scripts keeps a bilingual page
  visually consistent. Plex Arabic ships 400/500/600, so `semibold`/`bold` are
  remapped to 500/600 to stop the browser synthesising a heavier face.
  Headings carry `-0.025em` tracking in Latin and **none** in Arabic
  (`[dir='rtl']` resets it) because Arabic letterforms connect.
- **Radii**: `xs → ui → panel → card → pill → hero`. Controls use `ui`, panels
  `panel`, property cards `card`, buttons and chips `pill`.
- **Shadow**: `xs → ui → panel → float`, plus `glow` for the brand mark. Dark
  shadows are darker and larger rather than the same shadow on a dark ground.
- **Motion**: `ease-soft` for entrances, `ease-spring` for controls that
  respond to a press. Everything collapses under
  `prefers-reduced-motion: reduce`.
- **Glass**: `.glass` and `.glass-strong` — a blurred, tinted pane that borrows
  what is behind it. Used on the header once scrolled, on badges over
  photography, and on the hero search panel.

### RTL

Arabic is the default. Nothing may use `left`/`right` spacing:

- `ps-*`/`pe-*`, `ms-*`/`me-*`, `start-*`/`end-*`.
- Directional glyphs use `.flip-inline`, which mirrors under `[dir='rtl']`.
- Controls whose motion has a fixed direction — the language pill — set
  `dir="ltr"` on the container so the moving indicator does not jump sides.

---

## 2. Folder structure

```text
frontend/
├─ public/images/              Static assets served as-is
├─ src/
│  ├─ pages/                   Pages Router: one route per file
│  │  ├─ _app.tsx              Providers: SWR → theme → locale → shell
│  │  ├─ _document.tsx         <html lang/dir/class>, pre-paint theme script
│  │  ├─ index.tsx             Landing (SSR: featured homes)
│  │  ├─ browse.tsx            Search results (SSR: first page)
│  │  ├─ saved.tsx             Saved homes (client, anonymous cookie)
│  │  ├─ listings/[id].tsx     Detail (SSR)
│  │  ├─ seller/…, admin/…     Authenticated areas
│  ├─ components/
│  │  ├─ ui/                   Primitives: Button, Card, Badge, Input, Select,
│  │  │                        SegmentedControl, Skeleton, Modal, Drawer, icons
│  │  ├─ layout/               AppShell, SiteHeader, SiteFooter, providers,
│  │  │                        LocaleSwitcher, ThemeToggle
│  │  ├─ home/                 Landing-only sections (HeroSection)
│  │  ├─ search/               AreaSearchBar, PropertySearchBar
│  │  ├─ filters/              FilterPanel
│  │  ├─ listing/              PublicListingCard, SaveToggle, SaveButton,
│  │  │                        ContactButtons
│  │  ├─ map/                  SchematicMap
│  │  └─ assistant/            AssistantWidget
│  ├─ hooks/                   usePropertiesSearch, useListings,
│  │                           useSavedListings, useAuth, useAdminAuth
│  ├─ lib/                     Framework-free helpers (geo.ts)
│  ├─ services/                fetch wrappers, one per API area
│  ├─ i18n/                    Catalogues and formatters
│  ├─ styles/                  globals.css — the token layer
│  └─ utils/                   Cookie-level concerns (locale, theme)
└─ tailwind.config.ts
```

Rules of thumb:

- `components/ui` knows nothing about property listings. Anything that mentions
  a listing lives in a domain folder.
- Only `services/` calls `fetch`. Components and hooks call services.
- `lib/` is pure and testable without React.

### Importing from `shared/`

`@makaan/shared` is an npm workspace, not a relative path:

```ts
import type { PublicListingCard } from '@makaan/shared/types/marketplace';
import { PropertyType } from '@makaan/shared/constants/enums';
```

`next.config.ts` lists it in `transpilePackages`, so it is compiled with the
app. Never reach into `../../shared` directly — that bypasses the package entry
and breaks the build.

---

## 3. Search state: `usePropertiesSearch`

`src/hooks/usePropertiesSearch.ts` holds filters, paging and map area for the
public marketplace. Two design problems it exists to solve:

**A dragged map must not re-render the results.** A map emits a move event per
animation frame. Those land in a ref and are collapsed by
`requestAnimationFrame` into at most one state change — a single boolean saying
the map has moved away from the searched area. The grid, and every memoised
card in it, renders zero times during a drag.

**Adjusting a filter must not blank the page.** The SWR key is passed through
`useDeferredValue`, so a burst of changes coalesces into one request, and
`keepPreviousData` keeps the previous results on screen, dimmed, while the new
ones arrive.

Supporting details:

- Public setters read from refs, so their identity never changes for the life of
  the component. A memoised child never re-renders because a callback was
  rebuilt.
- The request key is a **sorted** JSON projection, so two equal searches share
  one cache entry regardless of the order the filters were set.
- `PropertyFilters` mirrors `GET /listings` exactly. The UI cannot express a
  search the public contract does not allow.

### Map areas: bbox and radius

The API filters on a PostGIS envelope (`bbox=west,south,east,north`) and rejects
anything outside Cairo. `src/lib/geo.ts` owns that arithmetic:

- `clampToCairo` — a map dragged past the city edge narrows the search instead
  of returning `400`. It also guarantees a non-degenerate box, which the server
  requires.
- `boundingBoxFromRadius` — a centre and a radius become the envelope containing
  that circle; the corners are then culled in the browser with `withinRadius`,
  so a radius search reports what is genuinely inside it.
- `boundingBoxesEqual` — an ~11 m tolerance, far below the 100–500 m
  obfuscation applied to public locations, so it can never change which homes
  match. Without it every animation frame would be a new cache key.

`mapSearchMode` chooses between `manual` (a "search this area" button, the
default — results never move under the cursor) and `live` (search when the map
settles).

---

## 4. Rendering strategy

| Route | Strategy | Why |
| --- | --- | --- |
| `/` | `getServerSideProps` for the featured row | The landing page is the crawlable entry point; cards are in the HTML. Seeded into SWR as `fallbackData`, so the client revalidates instead of refetching from empty. |
| `/browse` | `getServerSideProps` for page 1 of the current query | Results must be shareable and indexable per query, and inventory changes constantly, so nothing may be cached at build time. Subsequent filtering is client-side through SWR. |
| `/listings/[id]` | `getServerSideProps` | Availability, price and status change; a stale price is worse than a slower page. Also gives the crawler a full page per listing. |
| `/saved`, assistant | Client only | Both depend on the anonymous cookie and are per-visitor. `/saved` is `noindex`. |

Why not `getStaticProps` with ISR: every public row is subject to eight
publication conditions — approved, available, unexpired, seller eligible.
A page built minutes ago can be advertising a home that is no longer publishable.

Why not React Server Components: this is the Pages Router, deliberately. The
whole app, including the seller and moderator areas, uses it, and mixing routers
for one section would fragment providers, session handling and layout.

**The pattern that ties both halves together** — the server renders a query, and
the same query seeds the client cache:

```tsx
const results = await searchListings(params);        // getServerSideProps
…
usePropertiesSearch({ …, fallbackData: initialResults });  // client
```

The fallback is scoped to the key it was rendered for, so the first paint is
server HTML and the first interaction is a normal SWR fetch.

### Other performance decisions

- **Images**: the hero uses `next/image` with `priority` — it is the largest
  paint. Listing photographs come from an arbitrary media provider host, so they
  use `<img>` with intrinsic `width`/`height` (no layout shift), `loading="lazy"`
  below the fold and `fetchPriority="high"` for the first row.
- **Saved state**: one shared SWR cache. Previously every card asked the API
  whether it was saved, so twenty cards opened twenty identical requests.
- **The map** is `next/dynamic` with `ssr: false`; the tile library never
  reaches the server bundle, and the schematic fallback keeps discovery working
  when no map provider is configured.
- **Fonts** are self-hosted through `@fontsource`, so there is no third-party
  connection on the critical path.

---

## 5. Accessibility

- Every interactive element is at least 44 px tall.
- Focus is a token-driven ring, visible in both themes, never `outline: none`
  without a replacement.
- `AreaSearchBar` implements the ARIA combobox pattern: arrow keys move
  `aria-activedescendant`, Enter selects, Escape closes. A listbox contains only
  options — no `<li>` in between, which is the nesting axe rejects.
- Icon-only controls carry the meaning in `aria-label`, and toggles report
  `aria-pressed`.
- A skip link precedes the header; `#main-content` is on every page's `<main>`.
- Result counts announce through `aria-live="polite"`.

### Tap targets

`globals.css` sets a 44 px floor on every control. The root font size is 15 px,
so rem-based Tailwind steps land under it — `min-h-11` is 41 px — which silently
undercuts the floor. The `tap` spacing token is a literal 44 px:
`min-h-tap`, `size-tap`, `w-tap`. Use it for anything clickable.

The one deliberate exception is map pins, at 30 px: at 44 px the pills of a
dense result set cover each other and the map beneath them.

### Known accessibility limitations

Both only occur on the Mapbox view, which needs a token and is not the default
local configuration; the schematic fallback is clean.

- Mapbox's own attribution control renders `role="list"` around non-list
  children, which axe reports as `aria-required-children`. It is third-party
  markup and removing the role would strip the attribution requirement.
- Overlapping price pins can leave less than 24 px unobstructed, which axe
  reports as `target-size`. Clustering — `supercluster` is already a
  dependency — is the real fix and is not in this change.

## 6. Testing

- `frontend/src/**/*.test.ts` — Vitest. `lib/geo.ts` and the query builders are
  pure and covered directly (envelope clamping, radius culling, URL shape).
- `tests/e2e` — Playwright, including axe. Interactive elements carry stable
  `data-testid` attributes; `listing-card` also carries `data-listing-id`, so a
  test can compare the list and the map by identity rather than by position.

```bash
npm run typecheck      # tsc across the workspaces
npm run lint           # eslint
npm --workspace frontend run test
npm run build
```
