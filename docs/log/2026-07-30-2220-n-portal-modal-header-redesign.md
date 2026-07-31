# Iteration Log: 2026-07-30 22:20 - React Portal Modal Mount, FAB Auto-Hiding & Page Header Layout Redesign

- **Requested**:
  1. FAB `?` icon was still visible over pop-up modal buttons due to CSS stacking contexts.
  2. `HelpTrigger` (`[📖 Learn]`) button was pushed into the right margin of 4-line description paragraphs (e.g. App Lookup page, Gambar 2), looking unaligned and cramped.
- **Architectural Implementation**:
  - `ContextualHelpModal.tsx`: Wrapped modal in `createPortal(..., document.body)` so modal mounts to root DOM (`document.body`), breaking out of all parent stacking contexts.
  - `HelpCenterFAB.tsx`: Added MutationObserver on `document.body.style.overflow`. Whenever any modal is open (`overflow === "hidden"`), `HelpCenterFAB` automatically hides (`if (isModalActive) return null`).
  - Page Headers (`src/app/(dashboard)/**/page.tsx` & `ThreatsContent.tsx`): Redesigned header layouts into a clean 2-row layout:
    - Row 1: `<h1>Title</h1>` on left, `<HelpTrigger />` badge on right (`flex items-center justify-between gap-3`).
    - Row 2: Subtitle paragraph spans full width underneath without pushing or squishing buttons.
- **Outcome**: SUCCESS. All issues resolved and verified with `npx tsc --noEmit` (0 compilation errors).
- **Log File**: `docs/log/2026-07-30-2220-n-portal-modal-header-redesign.md`
- **Updated Feature List**: `docs/feature-list.md`
