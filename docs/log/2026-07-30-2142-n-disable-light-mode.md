# Iteration Log: 2026-07-30 21:42 - Disable Light Mode & Hard-Lock Pure Dark Mode Architecture

- **Requested**: User reported that when accessing the web dashboard from a device with OS/browser default set to Light Mode, card elements (e.g., Device Identity & Metadata card) fell back to light gray background (`bg-slate-50/50`), breaking the dark theme aesthetic. User requested `/goal` with TDD workflow to completely disable all Light Mode features, functions, and styles.
- **Architectural Strategy**: Selected Option 1 — Total theme architecture cleanup. Remove all `.light` selectors and `@media (prefers-color-scheme: light)` rules from CSS, enforce `color-scheme: dark` at `:root`, and refactor all dual Tailwind classes (e.g. `bg-slate-50/50 dark:bg-white/[0.02]`) across components into single solid Dark Mode classes.
- **Steps Taken**:
  1. Refactored `variables.css`: Removed all `.light { ... }` variable overrides and added `color-scheme: dark;` to `:root`.
  2. Refactored `globals.css`: Removed `.light body::before`, `.light body::after`, `.light { --ambient... }`, and `.light` custom scrollbars. Set a single dark background layer.
  3. Refactored `IndonesiaAgentMapHelpers.ts`: Removed `@media (prefers-color-scheme: light)` rule for Leaflet popup tips.
  4. Refactored component classes: Removed dual `bg-slate-50/50 dark:bg-white/[0.02]`, `bg-slate-50/50 dark:bg-white/[0.03]`, and `hover:bg-slate-100/50 dark:hover:bg-white/[0.05]` in favor of pure dark classes (`bg-white/[0.02]`, `bg-white/[0.03]`, `hover:bg-white/[0.05]`) across:
     - `DeviceIdentityCard.tsx`
     - `DeviceOverviewTab.tsx`
     - `DeviceAppsTab.tsx`
     - `DeviceDomainsTab.tsx`
     - `DeviceFlowsTab.tsx`
     - `DeviceProtocolsTab.tsx`
     - `RemoteIpDetailModal.tsx`
     - `RemoteIpLocalDevicesTab.tsx`
     - `DeviceDetailModal.tsx`
  5. Refactored `layout.tsx`: Added `style={{ colorScheme: "dark" }}` on `<html>` element to ensure native browser controls default to dark mode.
  6. Verified build & code integrity using `npx tsc --noEmit` (0 errors).
- **Outcome**: SUCCESS. The dashboard is now 100% hard-locked to Dark Mode architecture. Even if a user device operates in Light Mode, the application renders with pure dark theme aesthetics without any light gray card fallbacks.
- **Log File**: `docs/log/2026-07-30-2142-n-disable-light-mode.md`
- **Updated Feature List**: `docs/feature-list.md`
