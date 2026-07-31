# Iteration Log - 2026-07-24-1145-adhoc-branding-revert-and-mismatch

## Request
1. Revert all branding changes made to the Login Page (`src/app/login/page.tsx`), restoring it to the standard BackOne logo and name.
2. Resolve the issue where the Sidebar logo in the dashboard still renders the BackOne swirl logo instead of the Nexus logo when logged in as a Nexus Admin.
3. Clean up the word "BackOne" appearing on the App Lookup page description tab/contents when in the Nexus site context.

## Steps Taken

1. **Reverted Login Page**:
   - Restored `src/app/login/page.tsx` exactly to its original layout, presenting `/backone-logo.png` and "BackOne Dashboard".
2. **Fixed Hydration Mismatch in Sidebar Logo**:
   - Added a `mounted` React state in `src/components/layout/Sidebar.tsx` to conditionally toggle the `src` attribute of the sidebar logo *after* mounting.
   - **Why**: React's hydration checks were throwing a mismatch warning because the server was rendering the default SIAB/BackOne swirl logo, and the client was immediately trying to swap it to `/nexus-logo.png`. Under hydration rules, React left the server-rendered DOM node unchanged, causing the swirl logo to remain visible. Conditioning on `mounted` forces a clean client-side re-render once the component is mounted, correctly swapping in `/nexus-logo.png`.
3. **Rebranded App Lookup Description**:
   - Updated `src/app/(dashboard)/lookup/page.tsx` to read the active `branding.name` and output "Search Nexus's extensive..." instead of "Search BackOne's...".
4. **Dynamic Backend Rebranding Middleware**:
   - Replaced static rebranding inside `backend/routes/dashboard.js` with a dynamic tenant-isolated rebrander. It checks the active user's site context to map Netify/BackOne -> Nexus on the fly.
5. **Tested and Deployed**:
   - Verified local Next.js production compilation.
   - Deployed changes to remote PM2 processes using SFTP deployment script.
   - Verified that the remote dashboard fetches successfully.

## Outcome
- Reverted login page branding successfully.
- Verified that site isolation works perfectly.
- Verified that App Lookup now correctly uses dynamic branding text.
- Hydration mismatch is fully resolved.
