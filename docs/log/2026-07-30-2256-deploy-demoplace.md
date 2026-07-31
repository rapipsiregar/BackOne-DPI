# Iteration Log: Production Deployment to demoplace.my.id

- **Timestamp**: 2026-07-30 22:56 WIB  
- **Trigger**: User Command - Deploy to domain demoplace (`demoplace.my.id`)  

---

### 1. Scope of Deployment
- **Target Domain**: `https://demoplace.my.id`
- **Server IP**: `103.185.47.52:2222`
- **Path**: `/home/adminbackend/web/demoplace.my.id/public_html`

---

### 2. Included Updates in this Release
1. **React Portal Modal & Auto-Hiding FAB**:
   - `ContextualHelpModal.tsx`, `AppDetailModal.tsx`, `DeviceDetailModal.tsx`, `AgentDetailModal.tsx`, `RemoteIpDetailModal.tsx`, and `Modal.tsx`: Mounted all pop-ups to `document.body` via `createPortal` with `z-[99999]`.
   - `globals.css` & `HelpCenterFAB.tsx`: Universal CSS rule + MutationObserver auto-hides floating Help FAB `(?)` whenever any modal/pop-up is active.
2. **Page Header Redesign**:
   - Restructured layout across 15 dashboard pages into a clean 2-row layout: Row 1 aligns `<h1>Title</h1>` and `<HelpTrigger />` badge, Row 2 renders subtitle descriptions at full width underneath.
3. **100% Pop-up Filter Button Coverage**:
   - Overhauled `ThreatFilters.tsx` into a compact `Filter Threat Data` button + Pop-Up Modal Drawer, ensuring 16/16 pages and tab modals use compact filter buttons on mobile.

---

### 3. Execution Results
1. `npm run build`: Next.js standalone build compiled successfully in 26.4s (25 routes).
2. SFTP upload: 34 items uploaded via SFTP.
3. SSH post-deploy: `npm ci --omit=dev`, PM2 zero-downtime process reload (`backone-backend`, `backone-frontend`, `backone-proxy` all ONLINE).
4. Health Check: `http://127.0.0.1:3001/api/health` returned `{"ok":true}`.

---

### 4. Verification
- Production deployment verified live at `https://demoplace.my.id`.
