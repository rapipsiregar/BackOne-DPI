# Iteration Log - 2026-07-24-1052 - Deployment Static Assets Omission Fix (Ad-hoc)

## Request
The user reported that the dashboard overview screen still could not be opened and crashed immediately on entering credentials.

## Steps Taken
1. **Systematic Asset Check**:
   - Developed a TDD test [test-all-assets.js](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/test/test-all-assets.js) to programmatically scan and download all preloaded dynamic stylesheets and JavaScript chunks fetched by `/login` on the production server.
   - Discovered that chunk file `/_next/static/chunks/2p64h4x46qcn0.js` returned a **`404 Not Found`** on the server, although it existed locally.
2. **Deployment Bug Found**:
   - Examined [deploy-sftp.js](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/scripts/deploy-sftp.js) and realized that neither `.next/static` (which holds all JS and CSS chunks) nor `public` (which holds assets like images, icons, and fonts) was included in the `UPLOAD_MANIFEST`.
   - The server was running on obsolete static assets, mismatching the newly built server bundles, causing direct chunk loading failures.
3. **TDD Setup & Fix**:
   - Created [sftp_manifest_test.js](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/test/sftp_manifest_test.js) asserting that `scripts/deploy-sftp.js` includes `.next/static` in its upload list.
   - Confirmed the test failed initially.
   - Appended `{ local: '.next/static', remote: '.next/static', type: 'dir' }` and `{ local: 'public', remote: 'public', type: 'dir' }` to the `UPLOAD_MANIFEST` array in `scripts/deploy-sftp.js`.
   - Re-ran `node test/sftp_manifest_test.js` which successfully passed.
4. **Build and Deployment**:
   - Compiled Next.js locally (`npm run build`).
   - Ran `node scripts/deploy-sftp.js` which successfully uploaded 33 groups of files (including the entire `.next/static` folder) and reloaded PM2.
5. **Validation**:
   - Re-ran the automated asset verification test `node test/test-all-assets.js`.
   - **Result**: `=== Verification Complete: 14 passed, 0 failed ===`. The previously missing chunk `2p64h4x46qcn0.js` resolved successfully with `200 OK` (6358 bytes).
   - Ran `node test/fetch-remote-dashboard.js` verifying successful login and load of the overview page `/` with `200 OK`.

## Current State
- The deployment process has been fixed and now uploads all static chunk resources and public assets correctly.
- All dynamic JS chunks resolve on the production server with `200 OK`.
- The dashboard is 100% accessible.

## Considerations for Next Time
- Deployments of Next.js standalone applications must always couple `.next/standalone` server builds with `.next/static` static files to prevent runtime chunk load failures.
