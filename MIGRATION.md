# TypeScript & Tailwind v4 Migration Log

This document records the migration of the flight-dashboard project from plain JavaScript (Next.js, Tailwind v3) to TypeScript with Tailwind v4. It covers major changes, bugs found and fixed along the way, and loose ground rules for extending the codebase going forward.

---

## 1. Scope of the migration

### Files converted

| Original | New | Type |
|---|---|---|
| `BoardStatusWidget.js` | `BoardStatusWidget.tsx` | Component |
| `SensorReadingWidget.js` | `SensorReadingWidget.tsx` | Component |
| `Dashboard.js` | `Dashboard.tsx` | Component |
| `Three.js` | `Three.tsx` | Component |
| `layout.js` | `layout.tsx` | Next.js root layout |
| `page.js` | `page.tsx` | Next.js page |
| `useBackendConnection.js` | `useBackendConnection.ts` | Hook |
| `useBoardConnection.js` | `useBoardConnection.ts` | Hook |
| `useMockData.js` | `useMockData.ts` | Hook |
| `useSensorData.js` | `useSensorData.ts` | Hook |
| `api.js` | `api.ts` | Util |
| `mock.js` | `mock.ts` | Util |
| `globals.css` | `globals.css` | Styles, upgraded to Tailwind v4 syntax |


## 2. Type architecture: where types live

To avoid duplicated/divergent interfaces across files, types follow an "owned by the producer" rule:

- **`BoardInfo`, `BoardSummary`, `WirelessBoardInfo`** are defined and exported from `BoardStatusWidget.tsx` (the consumer that defines the contract), and imported everywhere else that needs them (`Dashboard.tsx`, `useBoardConnection.ts`, `useMockData.ts`).
- **`SensorData`** is defined and exported from `SensorReadingWidget.tsx`, imported by `Dashboard.tsx` and `useSensorData.ts`.
- **`RawSensorPacket`, `ConnectBoardPacket`, `WirelessInfoResponse`, `ComPortsMap`** are defined and exported from `api.ts`, since these represent the *wire format* coming from the backend, as distinct from the UI-shaped types above.
- **Hook return types** (`UseBackendConnectionResult`, `UseBoardConnectionResult`, `UseMockDataResult`) are defined directly above each hook and exported, then reused in `Dashboard.tsx` as the cast target.

### Outstanding cleanup (not yet applied)

**Rule going forward:** never define a duplicate interface for a shape that already has a canonical definition elsewhere. If a hook needs the shape `api.ts` already describes, import it.

---

## 3. Bug fixes

These are functional changes, not just type annotations. Each one represents behavior that was actually different before and after.

### Mock CSV refetched on every poll tick
`mock.js`'s `fetchCSV()` re-fetched and re-parsed the entire CSV file from the network on every call — and `useSensorData` polls every 40ms, meaning ~25 fetches per second of a file that never changes.

**Fix:** `mock.ts` caches the parsed text in a module-level variable after the first fetch.

### Mock CSV reader only captured the first stream chunk
The original used `response.body.getReader()` and a single `reader.read()` call, which only grabs the first chunk of a streamed response.

**Fix:** Replaced with `response.text()`, which correctly drains the full body.

### Broken null/array swap in sensor data parsing
The original had: `result.length == undefined ? oldResult = result : result = oldResult`, intended to discard malformed array-shaped mock rows. The assignment directions were backwards, so `oldResult` (always `null`) routinely got passed into `parseSensorData`, meaning most ticks silently no-opped instead of updating state.

**Fix:** Replaced with an explicit guard — if the incoming packet looks malformed (has a `.length` property), skip the update and keep previous state.

### Stale closure in backend status polling
`useBackendConnection.js`'s `checkBoardStatus` called `setReset(!reset)`, capturing `reset` from the enclosing render rather than using a functional update. This mostly worked by accident because the polling interval restarts whenever `connected` changes, but it's fragile.

**Fix:** Changed to `setReset(prev => !prev)`, consistent with the pattern already used elsewhere in the same file.

### Missing animation-frame cleanup in `Three.tsx`
The original render loop (`requestAnimationFrame` recursive call) had no corresponding `cancelAnimationFrame` in the effect's cleanup function, so unmounting the component would leave the loop running against a detached canvas.

**Fix:** Track the frame ID and cancel it on cleanup.

### Dark mode never actually applied
`globals.css` defined all theme colors inside `@media (prefers-color-scheme: dark)`, but `Dashboard.tsx` toggles dark mode by adding/removing a `.dark` class on `<html>` — these are two unconnected systems. The in-app toggle button changed which Tailwind `dark:` utility classes were active, but the underlying CSS variables (`--base-700`, `--highlight`, etc.) never changed, because they were gated on OS preference, not the class.

**Fix:** Color variables are now defined in `:root` (light mode) and `.dark` (dark mode), and Tailwind v4's dark variant is rebound to the class selector (see Section 4).

### Light-mode colors were undefined
Before the fix above, light mode had **no variable definitions at all** — they only existed inside the dark media query. Any session where the OS wasn't in dark mode (or before the bug above is even considered) was rendering with undefined custom properties.

**Fix:** Full light-mode palette added to `:root`.

---

## 4. Tailwind v4 migration specifics

This project has no `tailwind.config.ts`. Tailwind v4 moves theme configuration into CSS itself.

### What changed in `globals.css`

```css
@import "tailwindcss";              /* was: @tailwind base/components/utilities; */

@custom-variant dark (&:where(.dark, .dark *));   /* replaces darkMode: 'class' config option */

@theme inline {
  --color-base: var(--base);
  --color-base-700: var(--base-700);
  /* ...etc for every custom color token */
}
```

- **`@theme inline`** is what makes utility classes like `bg-base-700`, `text-highlight`, `bg-accent-yellow` exist at all. If a color is used as a Tailwind class anywhere in the app but isn't listed here, the class silently does nothing — no error, no warning, just unstyled output.
- **`@custom-variant dark`** replaces the old `darkMode: 'class'` JS config option. If `dark:` utilities ever stop responding to the toggle after a future Tailwind upgrade, this line is the first thing to check.
- The actual *values* of each color (light vs dark) still live in plain `:root` / `.dark` CSS variable blocks, exactly as before — `@theme` just points the Tailwind-generated utilities at those variables rather than redefining the values itself. This split matters: `@theme` values are effectively static at the "what utility classes exist" level, while the `:root`/`.dark` variables are what actually switches at runtime.

### `base-content` is not a real design token

`text-base-content` is used in `Dashboard.tsx` (the dark-mode toggle button), but no `--base-content` variable was ever defined anywhere in the original CSS. It's currently aliased to `--highlight` in `@theme inline` as the closest sensible equivalent. **Decide if this should be its own distinct color** — if icon-on-base-background contrast ever looks wrong, this alias is why.

### Adding a new color token (for future development)

1. Add the raw value to `:root` (light mode value).
2. Add the same variable name to `.dark` (dark mode value).
3. Add a line to `@theme inline`: `--color-my-token: var(--my-token);`
4. Use it as `bg-my-token`, `text-my-token`, etc.


## 5. Ground rules for future development

### TypeScript

- **No implicit `any`.** Every prop, hook return, event handler, and async function should have an explicit type. If `tsconfig.json` doesn't already have `"strict": true`, turn it on — these files were written as if it were on.
- **Don't duplicate interfaces.** If a type already exists for a data shape (UI-facing or wire-format), import it. See Section 2's "owned by the producer" rule: UI-shaped types live with the component that defines the contract; wire-format types live in `api.ts`.
- **Type hook return values as exported interfaces** named `Use<HookName>Result`, declared directly above the hook. This keeps the calling component's destructuring/casting consistent and gives you one place to update if a hook's return shape changes.

### React / Next.js

- **Keys must be stable identifiers, not array indices**, whenever list order can change (e.g. `boards.map(...)` keys off `port`, not `i`).
- **Every interactive `<button>` should have `type="button"`** unless it's intentionally a form submit button, to avoid accidental form submission behavior.
- **Effects that start timers, intervals, or animation frames must clean them up.** This migration added a previously-missing `cancelAnimationFrame` cleanup in `Three.tsx` — treat any new `requestAnimationFrame`/`setInterval`/`setTimeout` call as needing a paired cleanup by default, not as an afterthought.
- **Wrap functions passed as dependencies in `useCallback`** when they're used inside `useEffect` dependency arrays or passed to child hooks, to avoid effect re-runs caused by referential inequality on every render.

### Tailwind v4 / CSS

- New design tokens always go through all three steps in Section 4's recipe — raw variable in `:root`, override in `.dark`, registration in `@theme inline`.
- Don't reach for `@media (prefers-color-scheme: dark)` in this project — dark mode is class-driven (`.dark` on `<html>`), controlled by app state, not OS preference. Mixing the two systems is exactly what caused the original dark-mode bug.

### Networking / data layer

- **Backend response shapes belong in `api.ts`** as named, exported interfaces — never inline `as SomeType` casts scattered across hooks for the same endpoint.
- **Cache static or rarely-changing fetched data** (like the mock CSV) rather than refetching on every poll cycle. If you add new mock or reference data sources, default to caching unless there's a specific reason the data needs to be fresh on every read.
- Treat any "malformed packet" handling (like the sensor data array/null guard) as an explicit, named condition with a comment — not an implicit side effect of a confusing ternary.

### General process for scaling this codebase

- As more widgets/components are added, keep following the "types live with their producer, get imported by consumers" pattern — it's what keeps `Dashboard.tsx` from becoming a dumping ground of redefined interfaces as the dashboard grows.
- When converting any remaining `.js` files (starting with `GoogleMaps.js`), follow the same process used here: convert types first, then look for behavioral bugs the original dynamic typing was masking — several were found this way in this migration (the CSV refetch, the stale closure, the broken null/array swap), and that pattern is likely to repeat in unconverted files.
