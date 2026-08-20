# Iteration Log — Fix: Role Salah Tampil di Halaman Agents
**Date:** 2026-07-28 23:00 WIB
**Trigger:** User report — "kenapa role yang seharusnya ada di tab halaman user account, malah ditampilkan juga di tab halaman agents?"

---

## Masalah

Screenshot menunjukkan section "External Accounts" di halaman `/agents` menampilkan:
- SOC ANALYST (sulist)
- EXECUTIVE (murphi)  
- COMPANY ADMIN (faza)
- COMPANY OPERATOR (faze)
- COMPANY VIEWER (fazu)

Semua role ini seharusnya **tidak ada** di halaman Agents. Halaman Agents hanya
untuk akun operasional/teknikal (`AGENT_VIEWER`) yang terikat langsung ke satu probe agent.
Role lainnya sudah ada di halaman User Accounts.

---

## Root Cause Analysis

### Bug 1: `agents/page.tsx` baris 93 — Filter yang Salah Arah

```js
// SALAH (sebelumnya):
const externalUsers = managedUsers.filter(u => u.role !== 'AGENT_VIEWER');
// → mengambil semua role KECUALI AGENT_VIEWER
// → SOC_ANALYST, EXECUTIVE, COMPANY_* semua masuk
```

Filter ini terbalik — seharusnya HANYA mengambil AGENT_VIEWER, bukan sebaliknya.

### Bug 2: Grouping `superadminUsers` / `siabUsers` / `nexusUsers` ikut salah

Karena `externalUsers` berisi semua role non-AGENT_VIEWER:
```js
const superadminUsers = externalUsers.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'EXECUTIVE' || !u.site_uuid);
// → EXECUTIVE, SOC_ANALYST (no site_uuid) masuk ke bucket ini
const siabUsers = externalUsers.filter(u => u.site_uuid === 'SIAB_UUID' && u.role !== 'EXECUTIVE');
// → COMPANY_ADMIN, COMPANY_OPERATOR, COMPANY_VIEWER masuk
```

### Root: Backend `/api/auth/admin/users` Kembalikan Semua User untuk SUPER_ADMIN

Backend mengembalikan **semua user** tanpa filter role untuk SUPER_ADMIN.
Fix di frontend sudah cukup — filter setelah data diterima.

---

## Fix

**File: `src/app/(dashboard)/agents/page.tsx`**

```js
// BENAR (sesudah fix):
const agentViewerUsers = managedUsers.filter(u => u.role === 'AGENT_VIEWER');
// Grouping berdasarkan site — semuanya sudah pasti AGENT_VIEWER
const superadminUsers = agentViewerUsers.filter(u => !u.site_uuid || u.site_uuid === 'default');
const siabUsers = agentViewerUsers.filter(u => u.site_uuid === 'SIAB_UUID');
const nexusUsers = agentViewerUsers.filter(u => u.site_uuid === 'NEXUS_UUID');
```

**File: `src/app/(dashboard)/agents/ExternalAccountsSection.tsx`**

- Rename judul section dari "External Accounts" → "Agent Viewer Accounts"
- Label lebih spesifik: "Agent Viewer Accounts — SIAB", "Agent Viewer Accounts — Nexus", dll

---

## Hasil

| Section | Sebelum | Sesudah |
|---------|---------|---------|
| Agents: External Accounts | SOC_ANALYST, EXECUTIVE, COMPANY_*, AGENT_VIEWER | ✅ HANYA AGENT_VIEWER |
| User Accounts | COMPANY_*, SOC_ANALYST, EXECUTIVE | ✅ Tidak berubah |
| Section title | "External Accounts" (ambigu) | ✅ "Agent Viewer Accounts" (jelas) |

---

## Validation

- TypeScript check: ✅ Zero errors
- Dev server: ✅ Compiled successfully
