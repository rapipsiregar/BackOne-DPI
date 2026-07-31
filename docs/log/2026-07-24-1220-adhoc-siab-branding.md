# Iteration Log - 2026-07-24-1220-adhoc-siab-branding

## Request
Ad-hoc request to fix multitenant branding issues for the SIAB site/account:
1. Replaced the incorrect Nexus logo/branding with the BackOne logo/branding when logged in under the SIAB account.
2. Removed the word "Nexus" from the browser tab and page description on the App Lookup page when viewing the SIAB tenant.

## Steps Taken
1. **Analysed Branding Logic**:
   - Inspected `src/lib/branding.ts` to examine how site configurations are selected.
   - Identified that `isNexus` check prioritized hostname matches (like `demoplace.my.id`) over explicit `siteUuid` values. Because of this, SIAB accounts (`siteUuid === '6681452d_9cae_4ff4_8ae8_0d504774265e'`) were evaluated as Nexus branding.
2. **Updated Branding Selection**:
   - Modified `src/lib/branding.ts` to ensure that `isNexus` is evaluated only if the active site is NOT SIAB.
   - Updated the return values for `isSiab` to return the BackOne branding (name `"BackOne"`, logo `"/backone-logo.png"`, title `"BackOne Dashboard"`, copyright `"PT. Data Bisnis Solusi"`, color `"#E11D48"`), which is permitted by Rule 5 in `AGENTS.md`.
3. **Validated App Lookup Page**:
   - Verified that the `App Lookup` page (`src/app/(dashboard)/lookup/page.tsx`) queries `getSiteBranding()` on mount.
   - Now, on SIAB accounts, the document title will resolve to `"App Lookup | BackOne - Deep Package Inspection"` (removing `"Nexus"`), and the description will correctly read `"Search BackOne's..."`.
4. **Created and Executed Unit Test**:
   - Created a brand-new unit test script `test/branding_unit_test.js` to isolate and test `getSiteBranding`.
   - Verified that the unit test fails when SIAB site gets matched as Nexus on `demoplace.my.id`.
   - Verified that after fixing the branding logic, all test cases pass.
5. **Updated Feature List**:
   - Documented the fix in `docs/feature-list.md` under the "Sidebar & Brand Alignment" section.

## Outcome
- All 5 test cases in `test/branding_unit_test.js` passed successfully.
- Branding checks in the DB and multitenant integration tests (`test/multitenant_branding_test.js`) remain functional.
- The browser subagent encountered an outage of Playwright setup (`playwright.azureedge.net/builds/driver/playwright-1.57.0-win32_x64.zip` returning 404), which is an external issue out of our control.

## Considerations for Next Time
- Explicit `siteUuid` checks should always take absolute precedence over hostname/query parameter fallbacks in frontend branding files.
