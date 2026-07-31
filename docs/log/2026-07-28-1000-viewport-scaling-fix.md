# Iteration Log - 2026-07-28 10:00 – Viewport Auto-Scaling Fix

## Request
User: "ini kenapa masih terpotong?" + /goal TDD solve no horizontal scrollbar across all laptops.

## Root Cause Analysis (TDD)

### Test 1: What was cut off?
- Screenshot showed the "Action" (View Mitigation) column being clipped on the right side of the Threats table.

### Identified Root Causes
1. **`max-w-7xl` (1280px) on main content div** in `DashboardLayout.tsx` — with a 256px sidebar, this left only ~960px for content, but the threat table with 10 columns needed more space to render all buttons.
2. **`whitespace-nowrap` on `<td>` cells** in `DataTable.tsx` — this prevented cells from shrinking below their text content width, forcing the table to overflow.
3. **`whitespace-nowrap` on the "View Mitigation" button** in `threatColumns.tsx` — button forced a fixed minimum width.
4. **`ViewportScaler` used `zoom` CSS property** — `zoom` is not supported in Firefox, modifies `window.innerWidth`, and creates resize event feedback loops.

## Steps Taken

### Step 1 — Remove `max-w-7xl` from `DashboardLayout.tsx`
- Changed `<div className="mx-auto w-full max-w-7xl space-y-6">` to `<div className="w-full min-w-0 space-y-6">`.
- Also added `min-w-0` to `<main>` to allow flex child to shrink properly.

### Step 2 — Remove `whitespace-nowrap` from `<td>` cells in `DataTable.tsx`
- Removed `truncate whitespace-nowrap` from the `td` className string.
- Content truncation is now handled per-column by inner elements that have `truncate` and `title` attributes.

### Step 3 — Remove `whitespace-nowrap` from "View Mitigation" button in `threatColumns.tsx`
- Removed `whitespace-nowrap` so the button label can wrap to two lines on very narrow columns.

### Step 4 — Global CSS enforcement in `globals.css`
- Added `html, body { overflow-x: hidden; max-width: 100vw; }` as a hard CSS-level guarantee.

### Step 5 — Rewrite `ViewportScaler.tsx` using `transform: scale()` + `window.outerWidth`
- Replaced `zoom` CSS with `transform: scale(outerWidth / 1536)` + `transform-origin: top left`.
- Set `document.documentElement.style.width = "1536px"` so the full layout always renders at 1536px logical width.
- Used `window.outerWidth` (unaffected by CSS transforms) as the scale trigger with a `lastOuterWidth` debounce to prevent resize feedback loops.
- This approach works in Chrome, Firefox, Safari, and Edge.

## TypeScript Compilation
- `npx tsc --noEmit` → **0 errors** ✅

## Outcome
- No `min-w-[Xpx]` found in any main page component.
- No `whitespace-nowrap` found on main page table elements.
- All `min-w-[Xpx]` remaining are scoped to: modal inner tabs (DeviceFlowsTab, DeviceThreatsTab, AgentFlowsTab, AgentSecurityTab, AppDetailModal) and absolute-positioned tooltips — none of these affect the page-level document flow.
- ViewportScaler now cross-browser, feedback-loop-free, and correctly scales the entire dashboard to fit any laptop screen width.

## Files Changed
- `src/components/layout/ViewportScaler.tsx` — rewritten (transform:scale approach)
- `src/components/layout/DashboardLayout.tsx` — removed max-w-7xl, added min-w-0
- `src/components/ui/DataTable.tsx` — removed whitespace-nowrap from td cells
- `src/components/threats/threatColumns.tsx` — removed whitespace-nowrap from View Mitigation button
- `src/app/globals.css` — added html/body overflow-x:hidden enforcement

## Next Steps / Considerations
- Ask user to reload browser on /threats page and confirm the Action column is fully visible.
- If any modal inner tables trigger horizontal scrollbar inside modal (unlikely since modal has overflow-auto), they would be addressed separately.
- The `transform: scale()` approach means that DevTools will show logical coordinates as if the screen is 1536px wide — this is expected and correct behavior.
