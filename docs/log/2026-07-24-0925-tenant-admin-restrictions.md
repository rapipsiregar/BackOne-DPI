# Iteration Log - 2026-07-24 09:25 - Tenant Admin Fixes

**Requests**:
1. Mengapa Tenant Admin dapat melihat histori "View As" dari Super Admin?
2. Mengapa tab halaman Agents tidak tampil untuk Tenant Admin?

**Affected files**:
- `backend/routes/auth/viewAs.js`
- `src/components/layout/Sidebar.tsx`

## Solutions

1. **Filtering View As History for Tenant Admin**:
   - Modifikasi [viewAs.js](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/backend/routes/auth/viewAs.js) pada endpoint `GET /api/auth/admin/view-as/logs`.
   - Menambahkan filter query untuk `TENANT_ADMIN` agar log yang diambil hanya untuk agen yang berada pada site mereka (`site_uuid` dicocokkan dengan list `agent_uuid` dari koleksi `Summary`).
   - Menyaring keluar entri milik Super Admin (`SUPER_ADMIN` dan username `admin`) agar tidak terlihat oleh Tenant Admin.

2. **Menampilkan Link Agents untuk Tenant Admin**:
   - Modifikasi [Sidebar.tsx](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/src/components/layout/Sidebar.tsx) pada penyaringan item menu `/agents`.
   - Mengubah kondisi pengecekan hak akses link `/agents` dari `user?.role === "SUPER_ADMIN"` menjadi `user?.role === "SUPER_ADMIN" || user?.role === "TENANT_ADMIN"`.

3. **Deployment**:
   - Menjalankan kompilasi Next.js (`npm run build`) dengan sukses tanpa error.
   - Mendeploy pembaruan ke server menggunakan script SFTP deployment (`node scripts/deploy-sftp.js`) dan reload service PM2 pada server `https://demoplace.my.id`.
