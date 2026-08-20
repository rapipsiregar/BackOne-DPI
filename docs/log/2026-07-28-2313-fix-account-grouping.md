# Iteration Log — Fix: Pemisahan Akun Agents vs User Accounts
**Date:** 2026-07-28 23:13 WIB
**Trigger:** User klarifikasi pengelompokan akun

---

## Pengelompokan Akun yang Benar

### Tab Halaman Agents — Akun Teknikal/Operasional
- SUPER_ADMIN, EXECUTIVE (global, tanpa site spesifik)
- TENANT_ADMIN, SOC_ANALYST, ENGINEER (per site: SIAB / Nexus)
- AGENT_VIEWER (per agent, akun probe teknikal)
- Dikelompokkan: Global / SIAB Tenant / Nexus Tenant

### Tab Halaman User Accounts — Akun Customer/Client
- COMPANY_ADMIN
- COMPANY_OPERATOR
- COMPANY_VIEWER
- Dikelompokkan per perusahaan (company_name)

---

## Files Changed

| File | Perubahan |
|------|-----------|
| `src/app/(dashboard)/agents/page.tsx` | Filter `externalUsers` exclude COMPANY_* roles saja |
| `src/app/(dashboard)/agents/ExternalAccountsSection.tsx` | Revert judul section ke original |
| `src/app/(dashboard)/user-accounts/page.tsx` | Filter `companyUsers` hanya include COMPANY_* roles |

---

## TypeScript: ✅ Zero errors
