# Iteration Log - 2026-08-03-0955-adhoc-deploy-labeling-bugfix

## Request & Context
* **Requested**: Fix the access failure of the "Device Labeling" page on the domain `demoplace.my.id` and localhost.
* **Scope**: `/device-labeling` frontend page and backend API routing for device labeling.

## Steps Taken
1. **React Hooks Bug Fix**:
   * Moved the `isExportingPdf` state hook in [page.tsx](file:///c:/z_Siregar/Magang%20DBS/1.%20BackOne-DPI/DPI-Source%20API%20Netify/src/app/%28dashboard%29/device-labeling/page.tsx) above the `if (!mounted) return null;` conditional return guard to comply with the Rules of Hooks and prevent runtime hydration crash in production.
2. **Backend Modularization & RBAC Fix (Rule 3 Compliance)**:
   * To adhere to the 256-line file limit, refactored [deviceLabeling.js](file:///c:/z_Siregar/Magang%20DBS/1.%20BackOne-DPI/DPI-Source%20API%20Netify/backend/routes/dashboard/deviceLabeling.js) (268 lines originally) by splitting its handlers into modular files:
     * [updateLabel.js](file:///c:/z_Siregar/Magang%20DBS/1.%20BackOne-DPI/DPI-Source%20API%20Netify/backend/routes/dashboard/deviceLabeling/updateLabel.js)
     * [getLabeling.js](file:///c:/z_Siregar/Magang%20DBS/1.%20BackOne-DPI/DPI-Source%20API%20Netify/backend/routes/dashboard/deviceLabeling/getLabeling.js)
     * [getMacDetails.js](file:///c:/z_Siregar/Magang%20DBS/1.%20BackOne-DPI/DPI-Source%20API%20Netify/backend/routes/dashboard/deviceLabeling/getMacDetails.js)
   * Shrank the main router [deviceLabeling.js](file:///c:/z_Siregar/Magang%20DBS/1.%20BackOne-DPI/DPI-Source%20API%20Netify/backend/routes/dashboard/deviceLabeling.js) to just 23 lines.
   * Fixed import path issues in the modular handlers (corrected `../../models/Schemas` to `../../../models/Schemas`) which initially caused `MODULE_NOT_FOUND` error and crash on `backone-backend`.
   * Aligned RBAC in all three handlers to allow access for both `COMPANY_ADMIN` and `COMPANY_OPERATOR` roles.
3. **Static Folder Nesting Bug Fix**:
   * Fixed a Linux command bug in [deploy-sftp.js](file:///c:/z_Siregar/Magang%20DBS/1.%20BackOne-DPI/DPI-Source%20API%20Netify/scripts/deploy-sftp.js) where `cp -r` would nest folders into `.next/standalone/.next/static/static/` if the target directory already existed.
   * Cleaned up the nested layout, ensured the fresh build chunks are directly under `.next/standalone/.next/static/`, and restarted `backone-frontend`.
4. **Build & Deployment**:
   * Executed `npm run build` locally to verify build integrity (Compiled successfully, TS checks passed).
   * Increased `readyTimeout` in [deploy-sftp.js](file:///c:/z_Siregar/Magang%20DBS/1.%20BackOne-DPI/DPI-Source%20API%20Netify/scripts/deploy-sftp.js) to `90000ms` for robust network connections on slow remote routes.
   * Run the production deployment script `deploy-sftp.js` to transfer build assets and restart PM2 services.
   * Confirmed backend is fully healthy with verification output `{"ok":true,"message":"BackOne Backend berjalan..."}`.

## Outcome
* **Localhost**: Verified 100% operational with correct page layout rendering.
* **Production**: SFTP upload successfully transferred 33 items, PM2 reloaded all apps (`backone-proxy`, `backone-backend`, `backone-frontend`) cleanly. 

## Considerations for Next Time
* Always put Next.js state hooks strictly at the top of functional components.
* Ensure any file modifications do not cross the 256-line mark without modularization.
