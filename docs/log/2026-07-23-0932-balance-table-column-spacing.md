# Log: Balanced Table Column Spacing and Alignment

**Trigger**: Irregular table column gutters and values touching adjacent cells due to text header lengths breaking fixed table layout.
**Date**: 2026-07-23 09:32 WIB
**Affected files**:
- `src/app/(dashboard)/agents/columns.tsx`

## Solution

1. Renamed column header `Historical Uptime` (17 chars) to `Avg Uptime` (10 chars). This shortens the minimum width constraints.
2. Balanced the column widths proportionally:
   - `UUID / Serial`: `12%` (gives clean spacing for UUID text + chevron)
   - `Label`: `15%`
   - `Provisioned`: Increased to `11%` (ensures the header text `Provisioned` fits completely without squeezing)
   - `Activated`: Increased to `11%` (ensures the header text `Activated` fits completely without squeezing)
   - `Traffic Status`: Adjusted to `15%` (fits header `Traffic Status` and row values perfectly)
   - `Avg Uptime`: `10%`
   - `Data Size`: `10%`
   - `Actions`: Adjusted to `16%`
   Sum is exactly `100%`.
3. Tightened action button paddings to `p-1` and container gap to `gap-1`, decreasing button sizes and centering the action buttons block with precision inside the `16%` width cell.
4. Next.js and TypeScript check both passed cleanly.
