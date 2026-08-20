# Log: Moved Provision Agent Button inside the Table Card

**Trigger**: Move the "+ Provision Agent" button from the main page header to the table header card to keep it contextually unified.
**Date**: 2026-07-23 09:30 WIB
**Affected files**:
- `src/app/(dashboard)/agents/page.tsx`
- `src/app/(dashboard)/agents/AgentsTableSection.tsx`

## Solution

1. Removed the blue `+ Provision Agent` button from the page header block inside `src/app/(dashboard)/agents/page.tsx`, leaving only the help trigger trigger.
2. Updated props for `AgentsTableSection` to accept `role` and `onProvisionClick`. Passed `() => setIsCreateOpen(true)` to trigger the provision modal.
3. Updated `src/app/(dashboard)/agents/AgentsTableSection.tsx`:
   - Added `Plus` icon import.
   - Refactored the `CardHeader` style to use a flex row layout: `flex flex-row items-center justify-between space-y-0 pb-4`.
   - Placed the blue `+ Provision Agent` button on the right side of the card header, aligned with the card title.
4. Verified that Next.js dev server and TypeScript check compile cleanly with no errors.
