# Handover Briefing: Transition to Source 2 (Isolated Clone)

Dokumen ini adalah panduan lengkap (context handover) bagi agen AI baru untuk memahami kondisi project terkini dan melanjutkan migrasi ke **Source 2** dengan strategi **Full Isolated Clone**.

**Instruksi untuk agen AI baru**: Baca seluruh dokumen ini dari awal hingga akhir sebelum menulis satu baris kode pun. Pahami arsitektur, status fitur, dan ikuti step-by-step di Section 4 secara berurutan tanpa skip. Setelah membaca dokumen ini, baca juga `AGENTS.md` dan `SKILLS.md` di root folder project.

---

## 1. Arsitektur Stack & Status Project Saat Ini (Source 1 — Production)

### Stack Teknologi

| Layer | Teknologi | Entry Point |
|-------|-----------|-------------|
| Frontend | Next.js 16 (React 19) | `npm run dev` - port 3000 |
| Backend API | Express.js | `node backend/server.js` - port 3002 (dev) / 3001 (prod) |
| Proxy Ingestor | Node.js + node-cron | `node proxy/index.js` - port 4000 |
| Database | MongoDB | database: `backone_dpi` (remote production) |
| Data Source | API Informatics Source 1 | `https://informatics.netify.ai/api/v1` |
| Domain Produksi | — | `https://demoplace.my.id` |

### Cara Menjalankan di Lokal

```bash
# Satu perintah untuk semua service sekaligus:
npm run dev

# Atau jalankan masing-masing secara terpisah:
npm run dev:next      # Frontend Next.js (port 3000)
npm run dev:backend   # Backend Express (port 3002)
npm run dev:proxy     # Proxy ingestor (port 4000)
```

### Alur Data (Data Pipeline)

```
API Informatics (Source 1 atau Source 2)
        |
  proxy/index.js  (ingest & simpan setiap 5-10 menit via cron)
        |
    MongoDB
        |
  backend/server.js  (REST API untuk dashboard)
        |
  Next.js Frontend  (dashboard realtime)
```

---

## 2. Fitur-Fitur yang Sudah Selesai Diimplementasi

### Fallback Aggregation (API Backend)
- API `/summary`, `/apps`, `/protocols`, `/countries` memiliki sistem fallback tangguh.
- Jika tabel ringkasan (`Summary`, `AppStat`, `DeviceStat`, `CountryStat`) kosong akibat data gap dari sensor, backend otomatis kalkulasi langsung dari koleksi raw `Flow` dan `AppCategoryStat`.

### Branding Multi-Tenant (SIAB & Nexus)
- Tenant **SIAB**: boleh menggunakan logo BackOne, nama "BackOne", dan "PT. Data Bisnis Solusi".
- Tenant **Nexus** (dan tenant lain): wajib menggunakan logo dan nama perusahaan masing-masing — dilarang tampilkan BackOne.
- Sudah di-build dan di-deploy ke `https://demoplace.my.id`.

### Device Labeling (`/device-labeling`)
- Halaman Asset Management untuk memetakan MAC Address ke nama pemilik perangkat kustom.
- **File utama**: `src/app/(dashboard)/device-labeling/page.tsx`, `columns.tsx`, `EditOwnerModal.tsx`
- **Kolom tabel**: `#`, MAC Address (klikable), Custom Owner Label, Default System Label, Network Agent, Last IP Address, Action (Edit Owner).
- Klik MAC Address membuka modal `DeviceMacDetailsModal` yang menampilkan riwayat IP perangkat.
- Agent UUID otomatis diterjemahkan ke nama label sensor aslinya via koleksi `agent_registry` di MongoDB.
- Edit label disimpan ke API endpoint `/api/dashboard/devices/labeling`.
- Role `EXECUTIVE` mendapat mode View Only — tombol Edit disembunyikan.
- Data diambil dari `/api/dashboard/devices/labeling?timeRange=...` dengan time filter aktif.

### User Accounts (`/user-accounts`)
- Halaman manajemen akun tenant perusahaan (client/customer).
- **File utama**: `src/app/(dashboard)/user-accounts/page.tsx`, `columns.tsx`, `CompanyCard.tsx`
- Menampilkan akun bertipe `COMPANY_ADMIN`, `COMPANY_OPERATOR`, `COMPANY_VIEWER` — dikelompokkan per perusahaan via komponen `CompanyCard`.
- Batas **5 akun per perusahaan** dengan indikator visual (badge merah jika penuh).
- Fitur **View-As mode**: SUPER_ADMIN dan COMPANY_ADMIN bisa masuk ke perspektif akun COMPANY_OPERATOR/VIEWER.
- Add/Edit user via modal `ExternalAccountModal`.
- Akses halaman dibatasi: hanya `SUPER_ADMIN`, `EXECUTIVE`, dan `COMPANY_ADMIN`.

### Sistem Autentikasi & Session
- Session timeout 1 jam dengan Tab-Aware detection via Page Visibility API.
- Cookie autentikasi bersifat session-only dan secure.
- Middleware Next.js (`src/middleware.ts`) melindungi semua route dashboard.

---

## 3. Tujuan Migrasi ke Source 2

- **Alasan**: Atasan memberikan API baru (Source 2) dengan infrastruktur terpisah yang setara fungsinya.
- **Tujuan**: Deploy dashboard yang identik ke domain baru `dev.demoplace.my.id`, menarik data dari Source 2, tanpa mengganggu Source 1 yang sudah berjalan di `demoplace.my.id`.
- **Strategi**: Full Isolated Clone — isolasi total 100% pada level kode, database, port, dan domain.

### Peta Isolasi: Source 1 vs Source 2

| Komponen | Source 1 (JANGAN disentuh) | Source 2 (yang akan dibuat) |
|----------|----------------------------|------------------------------|
| Folder | `DPI-Source API Netify/` | `DPI-Source API Netify - Source 2/` |
| Domain | `https://demoplace.my.id` | `https://dev.demoplace.my.id` |
| Frontend port | 3000 | **3010** |
| Backend port | 3001 (prod) / 3002 (dev) | **3011** |
| Proxy port | 4000 | **4010** |
| MongoDB database | `backone_dpi` | `backone_inspect_0` |
| MongoDB host | Remote Source 1 | `mongodb-netify` (remote Source 2) |
| API Informatics | `informatics.netify.ai` | `api0.dev.backone.cloud` |
| PM2 app name | `backone-proxy`, `backone-backend`, `backone-frontend` | `source2-proxy`, `source2-backend`, `source2-frontend` |

> Port 3010, 3011, 4010 dipilih khusus agar tidak bentrok dengan Source 1 (yang memakai 3000, 3001, 3002, 4000) baik saat keduanya berjalan bersamaan di lokal maupun di server produksi yang sama.

---

## 4. Step-by-Step Implementasi Source 2 (Panduan untuk Agen AI Baru)

> **WAJIB DIPATUHI**: Semua langkah di bawah dilakukan di folder project BARU (kloning). Jangan pernah mengubah file di folder `DPI-Source API Netify` (Source 1) selama proses ini.

---

### STEP 1 — Duplikat Folder Project dengan Robocopy

> ⚠️ **JANGAN gunakan copy-paste manual di Windows Explorer.** Folder ini mengandung `node_modules` dengan 59.000+ file kecil yang membutuhkan waktu lebih dari sehari untuk disalin. Gunakan Robocopy di bawah ini — eksklusikan `node_modules` dan install ulang via `npm` (jauh lebih cepat, hanya 3–10 menit).

Buka PowerShell dan jalankan perintah berikut:

```powershell
robocopy "c:\Z_Siregar\Magang DBS\BackOne-DPI\DPI-Source API Netify" "c:\Z_Siregar\Magang DBS\BackOne-DPI\DPI-Source API Netify - Source 2" /E /XD node_modules .next .git scratch /XF *.log *.tsbuildinfo *.db *.db-shm *.db-wal
```

Perintah ini akan menyalin seluruh source code (~600 file) dalam hitungan detik, tanpa `node_modules`, `.next` (build cache), dan `.git`.

Setelah selesai, verifikasi folder baru sudah terbuat:
```powershell
Get-ChildItem "c:\Z_Siregar\Magang DBS\BackOne-DPI\DPI-Source API Netify - Source 2" | Select-Object Name
```

---

### STEP 2 — Install Dependencies di Folder Source 2

Buka terminal di folder baru:

```bash
cd "c:\Z_Siregar\Magang DBS\BackOne-DPI\DPI-Source API Netify - Source 2"
npm run install:all
```

Perintah `install:all` setara dengan menjalankan `npm install` di root, `backend/`, dan `proxy/` sekaligus. Estimasi waktu: **3–10 menit** tergantung koneksi internet.

---

### STEP 3 — Konfigurasi `.env.local` (Root Project)

Buat atau timpa file `.env.local` di root folder Source 2 dengan isi berikut:

```env
# --- DATABASE & PORTS (BERBEDA dari Source 1 untuk menghindari konflik) ---
MONGODB_URI=mongodb://backone_inspect:backone_inspect@mongodb-netify:27017/backone_inspect_0
PROXY_PORT=4010
BACKEND_PORT=3011
JWT_SECRET=super-secret-backone-key-source2
ALLOWED_ORIGINS=http://localhost:3010,http://127.0.0.1:3010,http://localhost:3011,http://127.0.0.1:3011,https://dev.demoplace.my.id,http://dev.demoplace.my.id
NEXT_PUBLIC_API_URL=http://127.0.0.1:3011
PROXY_URL=http://localhost:4010

# --- SOURCE 2 API ---
NETIFY_INFORMATICS_BASE_URL=https://api0.dev.backone.cloud/api/v1
NETIFY_API_KEY=aklshdalshkd29374923749lad

# --- ORGANIZATION & SITE CONFIGURATIONS ---
NETIFY_ORGANIZATION_UUID=dfe1b1b4_9e14_4ced_a5cf_2b47d0435d91

# Site UUID aktif yang digunakan saat ini (Source 2)
NETIFY_SITE_UUID=6681452d_9cae_4ff4_8ae8_0d504774265e

# Semua site UUID untuk Source 2 (dua site)
NETIFY_SITE_UUIDS=6681452d_9cae_4ff4_8ae8_0d504774265e,1959bb55_045b_47c7_bbdd_f33b7db197b9

# --- DATA COLLECTION SETTINGS ---
PROXY_FLOW_LIMIT=10000
PROXY_COLLECT_MODE=all
PROXY_AGENT_UUID=
PROXY_AGENT_UUIDS=
PROXY_AGENT_DELAY_MS=5000
PROXY_CRON_SCHEDULE=*/10 * * * *
```

---

### STEP 4 — Konfigurasi `proxy/.env`

Buat atau timpa file `proxy/.env` di dalam folder `proxy/` dengan isi berikut:

```env
NETIFY_TOKEN=aklshdalshkd29374923749lad
NETIFY_API_KEY=aklshdalshkd29374923749lad
NETIFY_ORG_UUID=dfe1b1b4_9e14_4ced_a5cf_2b47d0435d91
NETIFY_SITE_UUIDS=6681452d_9cae_4ff4_8ae8_0d504774265e,1959bb55_045b_47c7_bbdd_f33b7db197b9
NETIFY_INFORMATICS_BASE_URL=https://api0.dev.backone.cloud/api/v1
PROXY_FLOW_LIMIT=10000
PROXY_COLLECT_MODE=all
PROXY_AGENT_UUID=
PROXY_AGENT_UUIDS=
PROXY_AGENT_DELAY_MS=5000
PROXY_CRON_SCHEDULE=*/10 * * * *
PROXY_PORT=4010
MONGODB_URI=mongodb://backone_inspect:backone_inspect@mongodb-netify:27017/backone_inspect_0
BACKEND_PORT=3011
JWT_SECRET=super-secret-backone-key-source2
ALLOWED_ORIGINS=http://localhost:3010,http://127.0.0.1:3010,https://dev.demoplace.my.id,http://dev.demoplace.my.id
NEXT_PUBLIC_API_URL=http://127.0.0.1:3011
```

---

### STEP 5 — Konfigurasi `backend/.env`

Buat atau timpa file `backend/.env` di dalam folder `backend/` dengan isi berikut:

```env
NETIFY_TOKEN=aklshdalshkd29374923749lad
NETIFY_API_KEY=aklshdalshkd29374923749lad
NETIFY_ORG_UUID=dfe1b1b4_9e14_4ced_a5cf_2b47d0435d91
NETIFY_SITE_UUID=6681452d_9cae_4ff4_8ae8_0d504774265e
```

---

### STEP 6 — Konfigurasi `.env.production` (untuk Deploy ke dev.demoplace.my.id)

Buat atau timpa file `.env.production` di root folder Source 2 dengan isi berikut:

```env
NODE_ENV=production

# --- Source 2 API Credentials ---
NETIFY_API_KEY=aklshdalshkd29374923749lad
NETIFY_ORG_UUID=dfe1b1b4_9e14_4ced_a5cf_2b47d0435d91
NETIFY_SITE_UUIDS=6681452d_9cae_4ff4_8ae8_0d504774265e,1959bb55_045b_47c7_bbdd_f33b7db197b9
NETIFY_INFORMATICS_BASE_URL=https://api0.dev.backone.cloud/api/v1

# --- Proxy Settings ---
PROXY_COLLECT_MODE=all
PROXY_CRON_SCHEDULE=*/10 * * * *
PROXY_PORT=4010
PROXY_AGENT_DELAY_MS=5000

# --- Production MongoDB Source 2 ---
MONGODB_URI=mongodb://backone_inspect:backone_inspect@mongodb-netify:27017/backone_inspect_0

# --- Backend Port (BERBEDA dari Source 1 yang memakai 3001) ---
BACKEND_PORT=3011

# --- JWT Secret (buat yang baru, berbeda dari Source 1) ---
JWT_SECRET=GANTI-DENGAN-SECRET-BARU-YANG-KUAT-UNTUK-SOURCE2

# --- CORS (domain baru Source 2) ---
ALLOWED_ORIGINS=https://dev.demoplace.my.id,http://dev.demoplace.my.id

# --- Next.js Frontend ---
NEXT_PUBLIC_API_URL=http://127.0.0.1:3011
```

---

### STEP 7 — Update `ecosystem.config.js` untuk Source 2

Timpa file `ecosystem.config.js` di root folder Source 2 dengan konfigurasi PM2 yang sudah disesuaikan (port berbeda, nama PM2 berbeda agar tidak tabrakan di server yang sama):

```js
// ecosystem.config.js — PM2 Configuration for Source 2 (dev.demoplace.my.id)
module.exports = {
  apps: [
    {
      name: 'source2-proxy',
      script: './proxy/index.js',
      cwd: '/home/adminbackend/web/dev.demoplace.my.id/public_html',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      node_args: '--max-old-space-size=1024',
      max_memory_restart: '1200M',
      restart_delay: 5000,
      max_restarts: 10,
      env_file: '.env.production',
      env: { NODE_ENV: 'production' },
      error_file: './logs/proxy-error.log',
      out_file: './logs/proxy-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'source2-backend',
      script: './backend/server.js',
      cwd: '/home/adminbackend/web/dev.demoplace.my.id/public_html',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      node_args: '--max-old-space-size=256',
      max_memory_restart: '400M',
      restart_delay: 3000,
      max_restarts: 10,
      env_file: '.env.production',
      env: { NODE_ENV: 'production' },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'source2-frontend',
      script: 'start-with-env.js',
      cwd: '/home/adminbackend/web/dev.demoplace.my.id/public_html',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      node_args: '--max-old-space-size=512',
      max_memory_restart: '700M',
      restart_delay: 3000,
      max_restarts: 10,
      env_file: '.env.production',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
        HOSTNAME: '127.0.0.1',
        NEXT_TELEMETRY_DISABLED: '1',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
```

---

### STEP 8 — Verifikasi Koneksi ke Database Source 2

Jalankan script diagnostik dari root folder project baru:

```bash
node check-mongo.js
```

Hasil yang diharapkan: koneksi berhasil ke `backone_inspect_0`.

Jika error, cek:
- Apakah host `mongodb-netify` dapat dijangkau (mungkin perlu VPN/SSH tunnel jika di jaringan internal).
- Apakah kredensial `backone_inspect:backone_inspect` sudah benar.
- Tanyakan kepada atasan jika koneksi tidak berhasil.

---

### STEP 9 — Jalankan Proxy Ingestor (Test Ingest Perdana)

```bash
npm run dev:proxy
# atau:
node proxy/index.js
```

Amati log output. Tanda ingest berhasil:
- `Connected to MongoDB` — koneksi DB berhasil
- `Fetching data for site: ...` — proxy berhasil memanggil Source 2 API
- `Inserted X flows` atau `Upserted X records` — data masuk ke MongoDB

Jika muncul error `401 Unauthorized` atau `403 Forbidden`, hubungi atasan untuk verifikasi API key.

---

### STEP 10 — Jalankan Full Stack Lokal

```bash
npm run dev
```

Buka browser ke `http://localhost:3010` dan verifikasi:
- Dashboard menampilkan data realtime dari Source 2.
- Tidak ada error `500` atau `404` di console browser maupun terminal.
- Semua halaman utama dapat diakses tanpa error.

---

### STEP 11 — QA Pass Fungsionalitas

| Halaman | Yang Diverifikasi |
|---------|-------------------|
| `/` (Overview) | KPI cards terisi data realtime, chart bandwidth tampil |
| `/agents` | Daftar agent dari Source 2 muncul, peta koordinat berfungsi |
| `/flows` | Tabel flows menampilkan data, pagination 50 item/halaman berjalan |
| `/apps` | Statistik aplikasi terisi, tidak ada fallback error |
| `/threats` | Data threats/events muncul |
| `/device-labeling` | Tabel device muncul, edit label berfungsi, modal detail berjalan |
| `/user-accounts` | Daftar akun company tampil, View-As mode berfungsi |
| Login | Autentikasi berhasil, session timeout berjalan |

---

### STEP 12 — Build & Deploy ke dev.demoplace.my.id

Setelah semua QA pass di lokal:

```bash
# 1. Build production bundle
npm run build

# 2. Upload ke server via SFTP ke folder:
#    /home/adminbackend/web/dev.demoplace.my.id/public_html/

# 3. Di server, jalankan PM2 dengan config Source 2:
pm2 start ecosystem.config.js --env production

# 4. Verifikasi semua 3 process berjalan:
pm2 list
# Harus tampil: source2-proxy, source2-backend, source2-frontend
```

> Nginx di server perlu dikonfigurasi untuk mengarahkan `dev.demoplace.my.id` ke port 3010 (frontend Source 2), analogis seperti `demoplace.my.id` yang mengarah ke port 3000 (Source 1).

---

## 5. Aturan Wajib untuk Agen AI Baru

1. **Jangan ubah Source 1**: Folder `Deep Package Inspection` dan database `backone_dpi` tidak boleh disentuh sama sekali.
2. **Port wajib berbeda**: Source 2 menggunakan port 3010 (frontend), 3011 (backend), 4010 (proxy). Jangan pakai port 3000, 3001, 3002, atau 4000.
3. **PM2 app name wajib berbeda**: Gunakan prefix `source2-` agar tidak menimpa proses PM2 Source 1 di server.
4. **Data hanya dari MongoDB**: Tidak ada dummy/mock data — semua dari `backone_inspect_0`.
5. **Bahasa UI**: Seluruh teks yang tampil di frontend wajib dalam Bahasa Inggris.
6. **No arbitrary limits**: Query limit harus maksimal — jangan hardcode nilai kecil.
7. **File lebih dari 256 baris wajib dipecah**: Berlaku untuk semua file yang disentuh.
8. **Branding Source 2**: Konfirmasi ke user tenant mana yang digunakan sebelum menetapkan logo.
9. **White-labeling**: Jangan tampilkan nama vendor atau API eksternal di UI.
10. **Semua pengujian lokal dulu**: Tidak ada yang di-deploy sebelum QA pass lokal selesai.
11. **Baca AGENTS.md dan SKILLS.md terlebih dahulu** sebelum memulai pengerjaan apapun.
12. **Iteration log wajib**: Setiap sesi pengerjaan wajib diakhiri dengan membuat log di `docs/log/` sesuai `AGENTS.md` Section 2b.

---

## 6. Referensi File Kunci

| File | Fungsi |
|------|--------|
| `proxy/index.js` | Entry point proxy ingestor, setup cron dan server |
| `proxy/netifyClient.js` | HTTP client utama untuk memanggil Source 2 API |
| `proxy/netifyClientCore.js` | Penanganan autentikasi JWT dan API Key |
| `proxy/netifyClientStats.js` | Fungsi penarikan statistik (bandwidth, top apps, devices) |
| `proxy/netifyTelemetry.js` | Penarikan data telemetry pendukung |
| `proxy/collector.js` | Orkestrator pengumpulan dan penyimpanan data ke MongoDB |
| `backend/server.js` | Entry point backend Express API |
| `backend/database.js` | Semua query dan logika database MongoDB |
| `src/app/(dashboard)/` | Semua halaman dashboard Next.js |
| `.env.local` | Konfigurasi environment lokal |
| `.env.production` | Konfigurasi environment production (dev.demoplace.my.id) |
| `proxy/.env` | Konfigurasi environment proxy server |
| `backend/.env` | Konfigurasi environment backend |
| `ecosystem.config.js` | Konfigurasi PM2 production (nama: source2-*) |
| `AGENTS.md` | Rules dan workflow wajib untuk semua agen AI |
| `SKILLS.md` | Deskripsi 5 peran agen (Architect, Backend, Frontend, QA, Hardware) |
| `plans/next-enhancements.md` | Backlog fitur dengan status TODO/DONE |
| `docs/feature-list.md` | Dokumentasi lengkap semua fitur yang sudah diimplementasi |

---

*(Dokumen ini terakhir diperbarui: 2026-07-29. Selama pengerjaan Source 2, semua pengujian wajib dilakukan secara lokal terlebih dahulu tanpa menyentuh server produksi Source 1 di demoplace.my.id.)*
