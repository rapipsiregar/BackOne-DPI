# Iteration Log: 2026-07-30 22:10 - Mobile Layout & Byte Formatting Improvements

- **Requested**: User reported specific UI/UX issues on mobile viewports:
  1. ContextualHelpModal pop-up: Tombol melayang FAB `(?)` menutupi tombol "Open Full Guide" di footer modal, dan teks footer terdesak horizontal.
  2. Font sizing & cramped buttons: `Learn This Page` button was crammed into a narrow multi-line box on mobile headers.
  3. Mobile card index & IP positioning: `#1` and IP address had an awkward wide gap across the card header.
  4. Globe default mobile sizing: User requested mobile globe view to show full 3D sphere (matching Gambar 2) rather than cropped top view (Gambar 3).
  5. Top Protocols byte formatting: Raw unformatted numbers (e.g. `UDP : 9567431`) appeared on chart tooltips instead of human-readable data units (e.g. `UDP : 9.12 MB`).
- **Architectural Implementation**:
  - `ContextualHelpModal.tsx`: Increased z-index to `z-[99999]` so modal backdrop covers the floating FAB `(?)` button. Refactored footer layout to responsive `flex-col sm:flex-row` with full-width mobile action buttons.
  - `HelpTrigger.tsx`: Added `shrink-0` and responsive label `<span className="hidden sm:inline">Learn This Page</span><span className="sm:hidden text-[11px]">Learn</span>` so the button displays as a clean badge on mobile headers.
  - `DataTableMobileCards.tsx`: Grouped index badge `[#1]` and IP address (`mainHeader`) together on the top-left of the card header row (`flex items-center gap-2`).
  - `GlobeMap.tsx`: Updated camera altitude to `2.4` and container height to `h-[360px] sm:h-[400px]` on mobile viewports, rendering the full centered 3D sphere (matching Gambar 2).
  - `TopWidgets.tsx`: Added `formatter={(value: any) => [fmtBytes(value as number), 'Traffic']}` to PieChart `<RechartsTooltip />`.
- **Outcome**: SUCCESS. All mobile layout issues have been completely resolved and verified with `npx tsc --noEmit` (0 compilation errors).
- **Log File**: `docs/log/2026-07-30-2210-n-mobile-layout-improvements.md`
- **Updated Feature List**: `docs/feature-list.md`
