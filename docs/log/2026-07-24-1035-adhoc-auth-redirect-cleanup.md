# Iteration Log - 2026-07-24-1035 - Authentication Redirect Robustness (Ad-hoc)

## Request
The user reported that upon entering credentials on the login page and hitting enter, the screen still crashed with "This page couldn't load".

## Steps Taken
1. **Root Cause Analysis**:
   - Verified backend logs: No active errors or uncaught exceptions on the Node API server.
   - Verified frontend logs: No server-rendering crashes or dynamic errors.
   - Confirmed via remote curl and integration tests that fetching `/` directly with a logged-in cookie returns `200 OK` and renders HTML cleanly.
   - Identified that the crash occurs entirely on the client-side: when the user clicks login, the client-side code in `src/app/login/page.tsx` used Next.js `router.push('/')` for client-side navigation.
   - Because a new deployment was just made, the client's open browser session was holding onto old JavaScript compiler chunk hashes. Navigating via client-side routing fetched chunks that no longer existed on the server, causing a chunk load error and triggering the "This page couldn't load" screen.
2. **Implementation**:
   - Refactored [page.tsx](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/src/app/login/page.tsx) to use standard `window.location.href = "/"` instead of client-side `router.push("/")`. This forces a clean, full document reload from the server, fetching the updated chunk hashes.
   - Refactored [SidebarProfile.tsx](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/src/components/layout/SidebarProfile.tsx) to use `window.location.href = "/login"` instead of `router.push("/login")` during logout for consistency and safety.
3. **Verification**:
   - Compiled the project locally (`npm run build`) successfully with zero warnings/errors.
   - Deployed code to the production server via `node scripts/deploy-sftp.js` and reloaded PM2.
   - Ran [fetch-remote-dashboard.js](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/test/fetch-remote-dashboard.js) with `nexus` tenant credentials, confirming successful authentication and home page fetch with `200 OK`.

## Current State
- Next.js routing is fully protected and operating via standard `middleware.ts`.
- Sign-in and sign-out actions force a clean window reload, completely bypassing Next.js client-side chunk mismatch issues.

## Considerations for Next Time
- In production Next.js standalone environments with high update frequencies, client-side routing across major auth state boundaries (login/logout) should always use full document reloads (`window.location.href`) to ensure client caches match the server.
