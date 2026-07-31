# Log: Renamed Online/Offline Status to Traffic Status

**Trigger**: Rename online/offline status to prevent confusion with connection status
**Date**: 2026-07-23 09:20 WIB
**Affected files**:
- `src/lib/actions/agents.ts`
- `src/app/(dashboard)/agents/columns.tsx`

## Changes Done

1. Changed `statusHuman` calculation in `src/lib/actions/agents.ts`:
   - `isOnline` (having flows in 12 hours) now outputs `'Active Traffic'`.
   - Lacking flows in 12 hours now outputs `'No Active Traffic (Last seen: ... WIB)'` (or just `'No Active Traffic'` if last seen date is missing).
2. Changed agent inventory table columns in `src/app/(dashboard)/agents/columns.tsx`:
   - Renamed column header from `"Status"` to `"Traffic Status"`.
   - Updated accessor styling to display a pulsing green dot for `"Active Traffic"` and a professional gray-slate text representation for `"No Active Traffic"`.
3. Removed duplicate `getExternalAccountColumns` definition at the bottom of `columns.tsx`, successfully bringing the file size down to 182 lines (under the 256-line threshold limit).
4. Checked that compilation is clean and builds successfully.
