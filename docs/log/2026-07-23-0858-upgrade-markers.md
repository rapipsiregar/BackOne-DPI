# Visual Enhancement: Agent Map Markers Upgraded

**Trigger**: Ad-hoc visual quality enhancement (marker nya kok masih jelek)
**Date**: 2026-07-23 08:58 WIB
**Affected files**:
- `src/components/admin/AgentLocationMap.tsx`
- `src/components/dashboard/IndonesiaAgentMap.tsx`

## Improvement Done

The previous teardrop SVGs were flat, basic, and looked like generic pins. We replaced them with custom premium circular neon status beacons:
1. **Outer Pulsing Ring**: A glowing HTML circle that pings outwards using GPU-accelerated CSS keyframe animations.
2. **Glassmorphic Disk**: A dark semi-transparent glass circle with custom box-shadow and border colors based on status (emerald for online, ruby for offline), mimicking premium high-end operations dashboards (like Vercel/Stripe).
3. **Neon Glow Core**: A vibrant center core status dot.
4. **Consistency**: Applied the exact same visual identity to both map components across the app.

## Verification

- Verified no `buildMarkerSvg` remains in the codebase.
- TypeScript checked with zero errors.
- Dev compilation succeeded cleanly.
