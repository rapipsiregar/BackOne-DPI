# Iteration Log: Production Deployment to demoplace.my.id

- **Timestamp**: 2026-07-31 08:30 WIB  
- **Trigger**: User Command - Deploy to domain demoplace (`https://demoplace.my.id`)  

---

### 1. Scope of Deployment
- **Target Domain**: `https://demoplace.my.id`
- **Server IP**: `103.185.47.52:2222`
- **Path**: `/home/adminbackend/web/demoplace.my.id/public_html`

---

### 2. Included Updates in this Release
1. **Mobile Pop-Up Modal Spacing & Layout Overhaul**:
   - Converted stacked 1-column Total Download & Upload stat cards into compact 2-column side-by-side cards (`grid-cols-2`, `p-3.5 sm:p-6`, `text-xl sm:text-4xl`) inside `DeviceDetailModal.tsx` and `RemoteIpDetailModal.tsx`, reducing vertical modal height by 50%+.
   - Optimized responsive modal padding (`p-2.5 sm:p-4`), header paddings (`px-3.5 py-3 sm:px-6 sm:py-5`), horizontal scrollable tab navigation (`px-2.5 py-1.5`), and identity metadata card spacing (`p-3.5 sm:p-6`, `gap-3 sm:gap-6`).
2. **Associated IP Addresses Table Alignment & Overlap Fix**:
   - Fixed overlapping text in `DeviceMacDetailsModal.tsx` by removing invalid `display: flex` on `<td>` elements, formatting timestamps into 2-line date/time cells (`DateCell`), adding truncation with `title` hover tooltips for IP addresses, and setting `min-w-[520px]` table width with smooth horizontal scrolling.
3. **Custom MAC Owner Label PDF Export Integration**:
   - Updated `DevicePdfDocument.tsx` to display `Owner / Custom Label` in the Device Identification section.
   - Updated `AgentPdfDocument.tsx` to include `Owner / Device Label` column in the Monitored Devices summary table.
   - Created `DeviceLabelingPdfDocument.tsx` and enabled PDF Export on the `/device-labeling` page to export the full Device Asset Directory with custom owner labels.
   - Created `DeviceMacPdfDocument.tsx` and added an `Export PDF` button to `DeviceMacDetailsModal.tsx` to export individual MAC details and Associated IP Address history.

---

### 3. Execution Results
1. `npm run build`: Next.js standalone build compiled successfully in 14.0s (25/25 routes prerendered).
2. SFTP upload: 34 items uploaded/verified.
3. SSH post-deploy: `npm ci --omit=dev`, PM2 zero-downtime process reload (`backone-backend`, `backone-frontend`, `backone-proxy` all ONLINE).
4. Health Check: `http://127.0.0.1:3001/api/health` returned `{"ok":true}`.

---

### 4. Verification
- Production deployment verified live at `https://demoplace.my.id`.
