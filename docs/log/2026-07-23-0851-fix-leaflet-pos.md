# Fix: `Cannot read properties of undefined (reading '_leaflet_pos')`

**Trigger**: Ad-hoc bug fix request (goal fix error)
**Date**: 2026-07-23 08:51 WIB
**Affected file**: `src/components/admin/AgentLocationMap.tsx`

## Root Cause

Leaflet's zoom/fade animations are async. They read `_leaflet_pos` from DOM pane elements during a transitionend callback. When React StrictMode double-invokes effects or HMR triggers a remount, the container is removed while Leaflet's animation callback is still scheduled, causing the crash.

IndonesiaAgentMap.tsx (dashboard) already had `zoomAnimation: false` as a documented fix.
AgentLocationMap.tsx (admin/agents page) did NOT have these flags - that was the bug.

## Fix Applied

- Added `zoomAnimation: false`, `fadeAnimation: false`, `markerZoomAnimation: false` to L.map() options
- Added `animate: false` to fitBounds() during initial render and in resetView()
- Wrapped cleanup remove() in try/catch for extra safety

## Outcome

Fix applied via HMR to already-running dev server (port 3000). No TypeScript errors.

## Notes for Next Time

- All new Leaflet map components must include these three animation flags
- This is a Leaflet 1.x + React StrictMode incompatibility
