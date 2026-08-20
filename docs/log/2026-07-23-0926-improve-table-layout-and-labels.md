# Log: Fixed Table Layout Clipping and Resolved Confusing Labels

**Trigger**: UI layout issues, text clipping, and confusing active labels
**Date**: 2026-07-23 09:26 WIB
**Affected files**:
- `src/app/(dashboard)/agents/columns.tsx`
- `src/lib/actions/agents.ts`

## Solutions Implemented

1. **Table Width Optimization**: Adjusted column widths to sum up to exactly 100% when all 8 columns (including data size for Superadmin) are rendered:
   - `UUID / Serial`: `12%` (was 16%)
   - `Label`: `18%` (was 24%)
   - `Provisioned`: `10%` (was 12%)
   - `Activated`: `10%` (was 12%)
   - `Traffic Status`: `20%` (was 18%)
   - `Historical Uptime`: `10%` (was 12%)
   - `Data Size`: `10%` (was 12%)
   - `Actions`: `10%` (was 13%)
   This resolves table width overflow and clipping issues.
2. **Hover Tooltips for Truncated Text**: Added the `title` attribute to the `Label` buttons so that users can hover over any truncated name to read the full value.
3. **Labels Deconflicting**: Renamed `Active Traffic` / `No Active Traffic` to `Flows Detected` / `No Flows Detected` inside `src/lib/actions/agents.ts` and `src/app/(dashboard)/agents/columns.tsx`. This avoids confusion with the `Activated` column header.
4. **Manual Provisioning Direction**: Documented that manual provisioning is accessed via the blue `+ Provision Agent` button on the top right.
5. **Technical Glossary**: Explained the technical significance of the term `Provisioned` in platform architectures.
