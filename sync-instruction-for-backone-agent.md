# INSTRUKSI SYNC FITUR DASHBOARD (Dari Netify ke BackOne)

**UNTUK AGENT AI DI REPOSITORI: DPI-Source API BackOne (dev.demoplace.my.id)**

Dokumen ini berisi panduan langkah-demi-langkah dan instruksi implementasi untuk menyelaraskan seluruh fitur dashboard, desain mobile, keamanan, dan optimasi performa dari repositori **DPI-Source API Netify** ke repositori **DPI-Source API BackOne**.

---

## 🚨 ATURAN KRITIS (WAJIB DIPATUHI)

1. **JANGAN PERNAH MENGGANTI/MENGGANGGU SOURCE API PROXY BACKONE**:
   * Repositori BackOne menggunakan endpoint custom cloud BackOne (`api0.dev.backone.cloud`). Seluruh berkas di bawah folder `proxy/` bertema `backone*` (seperti `backoneClient.js`, `backoneClientCore.js`, `backoneClientStats.js`, `backoneTelemetry.js`, `backoneAgentFetcher.js`) **TIDAK BOLEH** diganti/diubah menjadi `netify*`.
   * Variabel lingkungan di `.env` (seperti `BACKONE_TOKEN`, `BACKONE_DPI_API_KEY`, `BACKONE_INFORMATICS_BASE_URL`) harus tetap dipertahankan. Jangan mengubahnya ke `NETIFY_*`.
2. **JANGAN MENGGANGGU KONFIGURASI INFRASTRUKTUR & PORT**:
   * Port backend (`3011`), port proxy (`4010`), target database MongoDB (`backone_inspect_0`), serta allowed origins (`dev.demoplace.my.id`) di file `.env` repositori BackOne **TIDAK BOLEH** diubah ke konfigurasi produksi Netify.
3. **KEPATUHAN BATAS BARIS FILE (RULE 3)**:
   * Setiap file baru atau hasil modifikasi yang Anda buat/sentuh **TIDAK BOLEH melebihi 256 baris kode**. Jika melebihi batas tersebut, Anda harus memecahnya menjadi file modular yang lebih kecil.

---

## Bagian 1: Daftar Fitur Baru yang Harus Diimplementasikan

### 1. Dashboard Mobile Modern (App-Native UX)
* **Bottom Navigation (5-Tab)**: Tambahkan menu navigasi melayang di bawah layar mobile dengan tab `Overview`, `Devices`, `Flows`, `Threats`, dan `Menu ☰`.
* **MobileTopBar**: Header minimalis di atas layar mobile menampilkan logo instansi, status site, dan bell notifikasi.
* **Laci Filter Melayang (Modal Drawer)**: Pindahkan semua input filter (Universal Filters dan Threat Filters) ke panel modal laci bawah layar smartphone agar tidak memakan ruang konten utama.
* **DataTable Mobile Cards**: Konversi tampilan tabel data lebar menjadi kartu list vertikal yang rapi di layar mobile.
* **Pure CSS/Tailwind Styling**: Hapus file `ViewportScaler.tsx` sepenuhnya. Semua responsivitas layout harus menggunakan Tailwind CSS murni.

### 2. Sesi, Otentikasi & Keamanan (Security)
* **Lockout Login**: Batasi kegagalan login salah password maksimal 3 kali sebelum akun dikunci selama 15 menit, lengkap dengan timer hitung mundur interaktif di login page.
* **Unlock Akun Manual**: Tambahkan tombol aksi `Unlock 🔓` di tabel `/user-accounts` yang hanya bisa diakses oleh admin/superadmin untuk melepas status lockout secara instan.
* **Inactivity Timeout (Tab-Aware)**: Pasang timeout ketidakaktifan pengguna selama 1 jam menggunakan Page Visibility API (resets otomatis jika tab aktif, memberikan warning hanya di 2 menit terakhir).
* **Session Cookie**: Atur token JWT auth sebagai session cookie saja (tanpa parameter `maxAge`) agar langsung terhapus saat tab browser ditutup.

### 3. Ekspor Laporan PDF (Custom Labeling)
* **Integrasi Label Pemilik**: Tampilkan label nama pemilik kustom perangkat (*Owner / Custom Label*) di setiap file PDF ekspor (PDF riwayat MAC Address, PDF detail perangkat, PDF daftar aset, dll).
* **Cetak PDF Tambahan**: Buat dokumen cetak PDF khusus untuk direktori aset perangkat dan modal riwayat detail MAC perangkat.

### 4. Mode Impersonasi ("View-As")
* **View-As Banner**: Tampilkan banner status melayang di bagian atas dashboard saat admin sedang mensimulasikan login sebagai pengguna lain.
* **Audit & Isolasi**: Amankan kueri backend View-As agar data yang diakses 100% terisolasi sesuai profil target user dan simpan log aktivitasnya ke collection `ViewAsLog`.

### 5. Multi-Tier Role Perusahaan & Kuota
* **3 Tier Role Perusahaan**: Implementasikan isolasi peran kueri database untuk `COMPANY_ADMIN`, `COMPANY_OPERATOR`, dan `COMPANY_VIEWER`.
* **Kuota Akun**: Batasi maksimal 5 akun pengguna per perusahaan lengkap dengan *Quota Tracker* visual.

---

## Bagian 2: Panduan Sinkronisasi File-by-File

### A. Salin/Buat File Baru dari Netify ke BackOne
Berikut adalah file baru di Netify yang harus Anda buat dan tempatkan di lokasi yang sama di folder BackOne:

1. **Komponen Mobile & Layout**:
   * `src/components/layout/MobileBottomBar.tsx` (Navigasi bawah mobile)
   * `src/components/layout/MobileTopBar.tsx` (Header top mobile)
   * `src/components/layout/SessionTimeoutModal.tsx` (Pop-up timeout aktivitas)
   * `src/components/layout/ViewAsBanner.tsx` (Banner mode impersonasi)
   * `src/components/ui/DataTableDesktopView.tsx` (Pecahan tabel desktop untuk Rule 3)
   * `src/components/ui/DataTableMobileCards.tsx` (Pecahan tabel kartu mobile)
2. **Ekspor Dokumen PDF**:
   * `src/components/admin/DeviceLabelingPdfDocument.tsx` (Template cetak PDF direktori aset)
   * `src/components/admin/DeviceMacPdfDocument.tsx` (Template cetak PDF detail MAC)
3. **Backend Kueri Labeling Modular (Rule 3)**:
   * `backend/routes/dashboard/deviceLabeling/getLabeling.js` (Mengambil list labeling)
   * `backend/routes/dashboard/deviceLabeling/getMacDetails.js` (Mengambil detail MAC)
   * `backend/routes/dashboard/deviceLabeling/updateLabel.js` (Memperbarui label)
   * `backend/scripts/seed_device_labels.js` (Script generator random seeder)
4. **Pembantu Kueri Terpisah**:
   * `src/app/(dashboard)/flows/flowColumns.tsx` (Ekstraksi kolom flow untuk Rule 3)
   * `src/lib/actions/agentsMongo.ts` (Ekstraksi query database agen untuk Rule 3)

### B. Modifikasi / Timpa (Overwrite) File yang Berbeda
Timpa isi kode file berikut di folder BackOne menggunakan kode dari Netify, **tetapi pastikan untuk tidak mengubah parameter port/database dev BackOne** di konfigurasi lingkungan:

1. **Gaya CSS & Tata Letak (Hard-Lock Dark Theme & Spacing)**:
   * `src/app/globals.css`, `src/app/variables.css` (Menghapus selector tema light, hard-lock dark mode)
   * `src/app/layout.tsx` (Pemasangan Viewport meta murni dan routing modal)
   * `src/components/layout/DashboardLayout.tsx` (Menghubungkan Bottom Navigation mobile dan Topbar)
2. **Filter & Pencarian (Drawer Filters)**:
   * `src/components/ui/UniversalFilters.tsx` (Mengubah filter inline menjadi Pop-up Drawer Modal)
   * `src/components/threats/ThreatFilters.tsx` (Mengubah filter ancaman menjadi Pop-up Modal)
3. **Komponen Tabel & Halaman**:
   * `src/components/ui/DataTable.tsx` (Menghubungkan view desktop & mobile cards modular)
   * `src/app/(dashboard)/user-accounts/page.tsx` & `columns.tsx` (Menyertakan quota tracker dan tombol Unlock)
   * `src/app/(dashboard)/device-labeling/page.tsx` (Perbaikan hidrasi React Hooks dan tombol ekspor PDF)
   * `src/components/admin/DeviceMacDetailsModal.tsx` (Menampilkan asosiasi IP Address, formatting date-time, dan tombol PDF)
4. **Backend Router & Middleware (RBAC & Keamanan)**:
   * `backend/routes/dashboard/deviceLabeling.js` (Harus diganti menjadi versi modular 24 baris yang mengimpor handler dari subfolder `deviceLabeling/`)
   * `backend/middleware/auth.js` (Sinkronisasi validasi session timeout dan enkripsi role)
   * `backend/routes/auth/viewAs.js` (Aktivasi pencatatan log impersonasi)
   * `src/lib/actions/agents.ts` (Sinkronisasi pemanggilan `agentsMongo.ts` untuk performa loading cepat)

---

## Bagian 3: Instruksi QA & Uji Integritas Build
Setelah melakukan seluruh pemindahan dan penggabungan kode di atas:
1. **Jalankan Uji Kompilasi**: Jalankan `npm run build` lokal di folder BackOne untuk memverifikasi tidak ada kesalahan tipe TypeScript (0 errors).
2. **Uji Fungsional**:
   * Buka dashboard di browser, perkecil resolusi layar ke ukuran smartphone, pastikan Bottom Navigation Bar muncul dan form filter berubah menjadi tombol Drawer.
   * Uji coba login salah password 3 kali dan pastikan countdown timer berjalan.
   * Uji mode View-As dan pastikan banner merah impersonasi muncul di atas layar.
