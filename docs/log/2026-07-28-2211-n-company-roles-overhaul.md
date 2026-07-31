# Iteration Log — Company User Roles System Overhaul
**Date:** 2026-07-28 22:11 WIB  
**Trigger:** User request — deep analysis & fix of Company User Role feature  
**Task:** Fix semua bug pada fitur COMPANY_ADMIN, COMPANY_OPERATOR, COMPANY_VIEWER

---

## Request
User melaporkan 4 masalah dari screenshot:
1. Role "Agent Viewer" muncul di profile card (seharusnya "Company Operator/Viewer")
2. Tidak ada cara user mengetahui agent apa yang sedang dipantau
3. Siapa yang seharusnya mendapat tab Agents, dan fitur apa yang ada di sana
4. Analisis mendalam keseluruhan fitur company user

---

## Analisis Root Cause

| # | Bug | Root Cause | Severity |
|---|-----|------------|---------|
| 1 | Role "Agent Viewer" di profile | `ROLE_DISPLAY_NAMES` tidak punya COMPANY_* | CRITICAL |
| 2 | "Standard User" di sidebar bottom | Sama dengan #1 — fallback ke 'Standard User' | CRITICAL |
| 3 | Banner View-As: "Network Agent: faze (COMPANY OPERATOR)" | DashboardLayout tidak bedakan user vs agent view-as | MEDIUM |
| 4 | Agents halaman kosong (0 agents) | `/api/auth/me` tidak return `agent_uuids`; `getAgents()` tidak bisa filter | CRITICAL |
| 5 | Token JWT stale untuk agent_uuids | JWT dibuat saat login, assignment bisa berubah sesudahnya | HIGH |
| 6 | `NEXT_PUBLIC_API_URL` salah (port 3001 vs 3002) | `.env.local` salah konfigurasi → login selalu 500 | HIGH |

---

## Langkah yang Dilakukan

### 1. MongoDB Investigation
- `agent_registry` di localhost: 7 agents (terisi oleh proxy collector setelah collection cycle)
- Confirmed field name: `uuid` ✓
- `faza` agent_uuids: `["1T-5Q-RC-AS","2N-ID-VQ-AL"]` ✓ sudah benar di DB

### 2. Fix SidebarProfile.tsx
- Tambah `COMPANY_ADMIN`, `COMPANY_OPERATOR`, `COMPANY_VIEWER` ke `ROLE_DISPLAY_NAMES`
- Detect view-as mode via `getViewAsStatusSync()`
- Saat view-as aktif: tampilkan amber label "Viewing as: [nama user]" 
- Import `Eye` icon dari lucide-react

### 3. Fix DashboardLayout.tsx
- Banner view-as sekarang cerdas: detect label mengandung "COMPANY_" → "View-As Mode — Viewing dashboard as: [nama]"
- Bukan lagi "You are currently viewing data as Network Agent"

### 4. Fix backend/routes/auth/core.js → /api/auth/me
- **CRITICAL FIX**: Selalu kembalikan role ASLI dari database (bukan `AGENT_VIEWER` ketika view-as)
- Tambah `agent_uuids: user.agent_uuids || []` — dari DB, bukan JWT
- Tambah `company_name: user.company_name || null`
- Tambah `_isViewAsMode`, `_viewAsAgentUuid`, `_viewAsLabel` untuk konteks view-as

### 5. Fix src/lib/actions/agents.ts (Server Action)
- Deklarasi `freshAgentUuids` di scope luar agar bisa digunakan di fallback summaries
- Selalu query DB untuk agent_uuids terbaru (tidak pakai JWT yang bisa stale):
  ```js
  const dbUser = await UserModel.findById(user.id).select('agent_uuids').lean();
  freshAgentUuids = dbUser?.agent_uuids || token.agent_uuids;
  ```
- Filter MongoDB `agent_registry` menggunakan `{ uuid: { $in: freshAgentUuids } }`
- Filter fallback `summaries` menggunakan `{ agent_uuid: { $in: freshAgentUuids } }`
- Jika `freshAgentUuids.length === 0` → return `[]` (secure by default)

### 6. Fix Sidebar.tsx
- Update user state type untuk include `agent_uuids`, `company_name`, `_isViewAsMode`
- Fix `site_uuid` storage: simpan untuk SEMUA role (bukan hanya TENANT_ADMIN)
- Tambah komentar pada filter navigasi untuk kejelasan

### 7. Fix .env.local
- `NEXT_PUBLIC_API_URL=http://127.0.0.1:3001` → `http://127.0.0.1:3002`
- Ini penyebab semua API calls gagal dengan 500 di localhost

### 8. Reset Password untuk Testing
- Semua company users (faza, faze, fazu) di-reset ke `Company123!`

---

## TDD Test Results

```
=== TDD TESTS: Company User Role System ===

TEST 1: faza (COMPANY_ADMIN) — /api/auth/me       17/17 PASSED ✅
TEST 2: faze (COMPANY_OPERATOR) — /api/auth/me    All role checks PASS ✅
TEST 3: fazu (COMPANY_VIEWER) — /api/auth/me      All role checks PASS ✅
TEST 4: fazu tidak bisa akses admin endpoint       403 Forbidden ✅
TEST 5: faza bisa akses /api/auth/admin/users      200 OK, 3 users ✅
TEST 6: faza View-As ke agent 2N-ID-VQ-AL         Token granted ✅
TEST 7: fazu TIDAK bisa View-As                   View-As rejected ✅

RESULTS: 17 PASSED, 0 FAILED ✅
```

---

## State Akhir

| Komponen | Status |
|----------|--------|
| Backend `/api/auth/me` | ✅ Fixed — return role asli + agent_uuids dari DB |
| Frontend SidebarProfile | ✅ Fixed — Company roles terdisplay benar |
| Frontend DashboardLayout | ✅ Fixed — Banner view-as lebih informatif |
| Frontend Sidebar | ✅ Fixed — COMPANY_VIEWER tidak dapat Agents tab |
| Server Action agents.ts | ✅ Fixed — filter agent_uuids dari DB |
| Env local | ✅ Fixed — port 3002 untuk backend |
| Build | ✅ Pass (25/25 halaman) |

---

## Considerations untuk Agent Berikutnya

1. **Password Reset**: Semua company users sekarang password `Company123!` (hanya untuk testing)
2. **Token tidak perlu re-login**: Karena `/api/auth/me` sekarang baca dari DB, tidak ada stale token issue
3. **agent_registry sekarang sudah terisi**: Proxy collector sudah upsert 7 agents ke registry collection
4. **COMPANY_VIEWER di /agents**: Jika COMPANY_VIEWER coba akses `/agents` langsung via URL, mereka diredirect ke `/` (di `useAgentsData.ts` allowed roles check)
5. **Production env**: Di production `.env.production` backend masih di port 3001 — sudah benar untuk production
6. **View-As USER**: Saat ini View-As USER menggunakan agent_uuid PERTAMA dari user target. Idealnya bisa switch-switch agent. Ini deferred improvement.
7. **File yang berlebih**: `check-mongo.js`, `reset-company-passwords.js`, `test-api.js` — scratch files untuk testing, bisa dihapus

---

## Files Changed
- `src/components/layout/SidebarProfile.tsx` — COMPANY roles display
- `src/components/layout/DashboardLayout.tsx` — View-As banner
- `src/components/layout/Sidebar.tsx` — navigation filter
- `backend/routes/auth/core.js` — /api/auth/me critical fix
- `src/lib/actions/agents.ts` — server action filter fix
- `.env.local` — port fix
