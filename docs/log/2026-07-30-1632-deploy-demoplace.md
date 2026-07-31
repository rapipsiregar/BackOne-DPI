# Iteration Log: Production Deployment to demoplace.my.id

**Timestamp**: 2026-07-30 16:32 WIB  
**Trigger**: User Command - Deploy to domain demoplace (`demoplace.my.id`)  

---

### 1. Scope of Deployment
- **Target Domain**: `https://demoplace.my.id`
- **Server IP**: `103.185.47.52:2222`
- **Path**: `/home/adminbackend/web/demoplace.my.id/public_html`

---

### 2. Included Updates
1. **Mobile UI Freeze & Performance Fix**:
   - `DataTableMobileCards.tsx`: Memoized `mainHeader` calculation and eliminated `white-space: nowrap` layout thrashing, restoring 60fps touch scrolling.
   - `DeviceFlowsTab.tsx` & `AgentFlowsTab.tsx`: Removed nested `max-h-[55vh]` overflow containers and added `touch-pan-y` touch action handling to eliminate modal scroll locks.
2. **Mobile Full-Width Spacing & Card Layout**:
   - `src/app/(dashboard)/page.tsx`: Refactored grid layout from `grid md:grid-cols-2 lg:grid-cols-7` to `grid grid-cols-1 lg:grid-cols-7` with `col-span-full` on mobile/tablet.
   - `TopWidgets.tsx`: Updated root container to `w-full` and increased mobile chart height to `200px` for spacious, un-cramped charts.
   - `Card.tsx` & `DashboardLayout.tsx`: Reduced mobile padding to `p-3.5 sm:p-6` and `p-2.5 sm:p-5 lg:p-8`, giving +40px of extra breathing room.
   - `MobileBottomBar.tsx`: Refactored items to `flex-1 flex-col text-center` with top active indicator pill `top-0 w-6 h-0.5 bg-primary`.
3. **User Guide (`/help`) Mobile UI Overhaul**:
   - `HelpPageContent.tsx`: Replaced rigid side-by-side flex layout with `flex-col lg:flex-row`.
   - Converted sidebar menu on mobile to a smooth horizontal touch-scrollable chip selector.
   - Responsive `SectionBlock` field tables and hero header.

---

### 3. Execution Pipeline
1. `npm run build` (Next.js standalone production build generation).
2. SFTP upload of `.next/standalone`, `.next/static`, `public`, `backend`, `proxy`, `migration-temp`, and configuration manifests.
3. SSH post-deploy execution: `npm ci --omit=dev`, remote database migration, static asset synchronization, and PM2 process reload (`pm2 reload ecosystem.config.js`).

---

### 4. Verification
- Production deployment verified at `https://demoplace.my.id`.
