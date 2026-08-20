# Iteration Log — Fix: Site Switcher Tidak Bisa Pindah ke Nexus
**Date:** 2026-07-28 22:50 WIB
**Trigger:** User report — "ketika login sebagai superadmin, default site SIAB. kenapa tidak bisa berpindah ke site nexus?"

---

## Masalah

SUPER_ADMIN memilih site Nexus dari dropdown SiteSelector → halaman reload → site kembali ke SIAB.
User tidak bisa bertahan di Nexus site.

---

## Root Cause Analysis

### Bug: Sidebar.tsx baris 33-36 — localStorage Overwrite

Setiap kali Sidebar di-mount, ia fetch `/api/auth/me` dan:
```js
if (data.user.site_uuid) {
  localStorage.setItem('backone_site_uuid', data.user.site_uuid);  // OVERWRITE!
  setSelectedSite(data.user.site_uuid);
}
```

Pengguna `admin` (SUPER_ADMIN) memiliki `site_uuid: '6681452d_...'` (SIAB) tersimpan di DB.
Setiap page load, Sidebar **selalu overwrite** localStorage dengan SIAB.

**Flow yang rusak:**
```
User pilih Nexus → localStorage="Nexus" → handleSiteSelect → window.location.reload()
→ Sidebar mount → fetch /api/auth/me → user.site_uuid="SIAB" → localStorage.setItem("SIAB") ← BUG!
→ tampil SIAB lagi
```

### Tambahan: site_uuid SUPER_ADMIN di DB

User `admin` punya `site_uuid: '6681452d_...'` tersimpan di DB.
Untuk SUPER_ADMIN, field ini seharusnya tidak membatasi — backend sudah benar
(`getBaseFilter` pakai `requestedSiteUuid` dari header, bukan `user.site_uuid`).
Masalahnya ada di frontend yang overwrite localStorage.

---

## Fix

**File:** `src/components/layout/Sidebar.tsx`

Logic baru: role-aware site UUID preservation:
- **Global roles** (SUPER_ADMIN, EXECUTIVE, SOC_ANALYST, ENGINEER):
  Prioritaskan pilihan tersimpan di localStorage. Hanya set dari DB jika belum ada.
- **Restricted roles** (TENANT_ADMIN, AGENT_VIEWER, COMPANY_*):
  Selalu pakai site_uuid dari DB (mereka tidak bisa switch site).

**Flow yang benar setelah fix:**
```
User pilih Nexus → localStorage="Nexus" → reload
→ Sidebar mount → fetch /api/auth/me → isGlobalRole=true
→ storedSiteUuid="Nexus" exists → siteToUse="Nexus" ← PRESERVED ✅
→ tampil Nexus dengan benar
```

---

## Validation

- Build: ✅ PASS (25/25 pages)
- Logic: Site switch sekarang persisten untuk SUPER_ADMIN
- Tidak ada breaking changes untuk restricted roles

---

## Files Changed
- `src/components/layout/Sidebar.tsx` — Fix localStorage overwrite bug
