# Iteration Log: 2026-07-30-1015-adhoc-viewas-agent-scope-fix

- **Trigger**: Ad-hoc Bug Fix & View-As Scoping Alignment
- **Request**: Perbaiki tampilan mode View-As Agent (`Viewing as Agent Fazza BSD`), di mana sebelumnya seluruh agent inventory (`Fazza JKT` dan `Fazza BSD`), tombol `+ Provision Agent`, tombol aksi admin (view-as berulang, delete, edit), serta section `Superadmin (BackOne) External Accounts` masih tampil di halaman Agents.
- **Root Causes**:
  1. `useAgentsData.ts` tidak memeriksa status `viewAsStatus.active` saat fetching `loadAgents()`, sehingga seluruh daftar agent di site tetap ditampilkan di tabel.
  2. Komponen `AgentsTableSection.tsx` dan `columns.tsx` tidak menonaktifkan/menyembunyikan tombol-tombol aksi admin (`Provision Agent`, `Delete Agent`, `Edit Location`, `Create/Edit Agent Account`, dan `View-As` berulang) saat sesi sedang berjalan dalam mode View-As.
  3. `ExternalAccountsSection.tsx` meng-hardcode string `Superadmin (BackOne) External Accounts`, melanggar Rule 5 (White-Labeling & Branding) ketika dibuka pada site `Nexus`.
- **Steps Taken**:
  1. Membuat TDD test suite `test/view_as_agent_scope_test.js` untuk memvalidasi:
     - Isolasi data agent saat View-As aktif (hanya menampilkan target agent `agent_uuid`).
     - Penyembunyian `ExternalAccountsSection` saat View-As mode aktif.
     - Penyembunyian tombol `+ Provision Agent` dan tombol aksi admin di tabel `columns.tsx`.
     - Penggunaan dynamic site branding `getSiteBranding()` di `ExternalAccountsSection.tsx` tanpa hardcoding `(BackOne)`.
  2. Menjalankan test (RED phase — gagal sesuai ekspektasi).
  3. Memperbarui `useAgentsData.ts`:
     - Memanggil `getViewAsStatusSync()`.
     - Menyaring `agents` sehingga HANYA menampilkan agent yang di-view (`agent_uuid === currentViewAs.agent_uuid`).
     - Mengekspor `isViewAsActive` dan `isViewAsMode`.
  4. Memperbarui `src/app/(dashboard)/agents/page.tsx`:
     - Meneruskan `isViewAsActive` ke `getAgentColumns` dan `AgentsTableSection`.
     - Menyembunyikan `ExternalAccountsSection` jika `isViewAsActive` bernilai `true`.
  5. Memperbarui `AgentsTableSection.tsx`:
     - Menyembunyikan tombol `+ Provision Agent` jika `isViewAsActive` bernilai `true`.
  6. Memperbarui `columns.tsx`:
     - Menyembunyikan tombol `UserCog`, `MapPin`, `Eye` (View-As), dan `Trash2` (Delete) jika `isViewAsActive` bernilai `true`.
  7. Memperbarui `ExternalAccountsSection.tsx`:
     - Menggunakan `getSiteBranding()` sehingga menampilkan `Superadmin (${branding.name}) External Accounts` secara dinamis sesuai site aktif (`Nexus` vs `BackOne/SIAB`).
  8. Menjalankan `test/view_as_agent_scope_test.js` dan `test/view_as_cleanup_test.js` (GREEN phase — 100% PASS).
- **Outcome**:
  - Tampilan mode `View-As Agent` kini 100% akurat dan terisolasi: hanya menampilkan agent target (`Fazza BSD`) tanpa membocorkan agent lain, tanpa tombol pengelola/superadmin yang membingungkan, dan tanpa melanggar white-labeling Rule 5 pada site Nexus.
