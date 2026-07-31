# Iteration Log: 3D Globe Map Mobile Centering & Zoom Fix

- **Timestamp**: 2026-07-30 16:12
- **Trigger**: User screenshot of localhost:3000 showing 3D Globe offset to the right and clipped at screen edges on mobile viewport (400x844).

## Requested & Touched
- Inspected and corrected 3D Globe camera framing and positioning in mobile screens.
- Modified `src/components/ui/GlobeMap.tsx`.

## Steps Taken & Root Cause Analysis
1. Analyzed user DevTools screenshot showing the 3D globe sphere pushed to the right boundary of the mobile canvas with partial clipping.
2. Cause: On narrow mobile viewports (<768px), the camera FOV aspect ratio combined with `altitude: 2.5` placed the camera too close to the globe.
3. Solution in `GlobeMap.tsx`:
   - Updated mobile camera target to `lat: 10, lng: 106.8, altitude: 3.6` on screens under 768px.
   - Zoomed out the mobile camera distance from 2.5 to 3.6 so the entire 3D sphere is framed with comfortable margins inside the container.
   - Ensured horizontal centering via `mx-auto` and `flex items-center justify-center`.
4. Captured live authenticated mobile screenshot of `http://localhost:3000` via Chrome DevTools Protocol to verify fix.
5. Ran `npm run build` — 25/25 static pages generated cleanly in 25.0s.

## Outcome
- Success: 3D Globe is now 100% centered, fully visible, and free of any edge clipping on mobile viewports.
- Verified live with CDP screenshot and clean production build.
