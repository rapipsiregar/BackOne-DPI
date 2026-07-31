# Iteration Log: Mobile Header Notification Bell & Dropdown Truncation Fix & Production Deployment

- **Timestamp**: 2026-07-30-2315
- **Requested By**: User (`notif nya kenapa kepotong? lalu tombol notif yang ada di header kanan atas kenapa ga fungsional? harusnya kan ketika di klik, muncul notif nya, ini malah ketika aku klik icon notif itu, yang kebuka malah sidebar nya`)
- **Modules Touched**: `src/components/layout/MobileTopBar.tsx`, `src/components/layout/SidebarNotifications.tsx`

---

## Steps Taken & Root Cause Analysis
1. **Identified Issues**:
   - `MobileTopBar.tsx` (top mobile header for viewports `< lg`) rendered a standalone Bell icon button wired to `onClick={onOpenMenu}`, which incorrectly opened the mobile drawer navigation sidebar instead of notifications.
   - `SidebarNotifications.tsx` used hardcoded `absolute bottom-0 left-full ml-4 w-96` relative positioning. When opened from mobile elements (e.g. sidebar or mobile header), it was positioned at `left-full + 16px`, forcing the 384px popover off the right edge of the screen and causing extreme horizontal clipping.

2. **Refactoring & Solution**:
   - **`SidebarNotifications.tsx`**:
     - Converted to use `createPortal(..., document.body)` with `z-[99999]` to break free from overflow-hidden parent containers.
     - Introduced `placement?: "sidebar" | "topbar"` prop.
     - For `topbar`: Added responsive fixed positioning `fixed top-14 right-3 sm:right-6 w-[calc(100vw-24px)] max-w-sm` so the popover fits perfectly within the viewport on mobile devices without any horizontal scrolling or clipping.
     - Added an explicit header close `(X)` button, live unread notification badge (`9+`), and clear English labels ("Notifications", "Mark all as read", "No new notifications").
   - **`MobileTopBar.tsx`**:
     - Replaced raw Bell `<button>` with `<SidebarNotifications placement="topbar" />`. Tapping the bell icon now toggles the notification popover smoothly at the top right of the viewport.

3. **Build Integrity Verification**:
   - Executed `npm run build`: Next.js Turbopack build passed cleanly with 0 TypeScript compilation errors.
   - Executed production deployment via SFTP script (`node scripts/deploy-sftp.js`).
   - Verified live PM2 process restart (`backone-backend`, `backone-frontend`, `backone-proxy` all active and online).
   - Validated server health check `http://127.0.0.1:3001/api/health` returned `{"ok":true}`.

---

## Current State & Outcome
- **Outcome**: Success. The top header notification bell is fully functional, showing unread badge count and opening a portal-rendered responsive dropdown panel that is centered/aligned within screen bounds with 0 clipping.
- **Production URL**: `https://demoplace.my.id`
