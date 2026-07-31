# Laporan Lengkap Project BackOne Deep Package Inspection (DPI) & Network Intelligence Dashboard

**Domain Live Production**: [https://demoplace.my.id](https://demoplace.my.id)  
**Dokumentasi Resmi & Spesifikasi Sistem** — *PT. Data Bisnis Solusi (BackOne)*  
**Tanggal Laporan**: 31 Juli 2026

---

## BAB 1: Ringkasan Proyek & Arsitektur Utama

### 1.1 Deskripsi Sistem
**BackOne Deep Package Inspection (DPI) & Network Intelligence Dashboard** adalah platform pemantauan telemetri jaringan tingkat tinggi yang dirancang untuk menganalisis lalu lintas data (*traffic flow*), mengidentifikasi aplikasi, protokol, domain, ancaman keamanan (*cyber threats*), dan mengelola aset perangkat jaringan (*device asset directory*) secara *real-time*.

### 1.2 Pipeline Data Real-Time & Aturan Ingesti
1. **Real-Time Production Data Only**: Seluruh angka, grafik, tabel, dan peta pada dashboard bersumber dari data telemetri produksi asli yang di-ingest dari Netify API melalui Proxy Sensor.
2. **MongoDB Data Retention Limit (30 Hari)**: Database MongoDB memproses pembersihan otomatis (*auto-purge*) untuk setiap dokumen telemetri, flow, dan ringkasan yang berusia lebih dari 30 hari guna menjaga efisiensi performa database.
3. **Kapasitas Query Tanpa Limit Arbitrer**: Seluruh query data dan batas koleksi disetel hingga kapasitas maksimum **1.000.000 (1 juta) rekor**.
4. **Server-Side Pagination**: Tabel berukuran besar (seperti *Network Flows* dan *App Devices*) menerapkan *server-side pagination* dengan ukuran halaman tetap **50 item/halaman** dengan penomoran urut (`#`) bersambung antar halaman.
5. **Standar White-Labeling & Isolasi Site (Rule 5)**:
   - **Situs SIAB**: Menggunakan logo BackOne, nama merk "BackOne", dan entitas legal "PT. Data Bisnis Solusi".
   - **Situs Nexus & Lainnya**: Dilarang keras menampilkan logo atau nama BackOne; menggunakan logo dan nama situs masing-masing.
   - **Pihak Eksternal**: Dilarang menampilkan nama vendor atau pihak ketiga (seperti "Netify", "MongoDB", dll.) di antarmuka pengguna agar dashboard tampil sebagai produk proprietary penuh.

---

## BAB 2: Struktur Hak Akses & Seluruh Akun Sistem Terdaftar

Sistem mendukung struktur kewenangan bertingkat (*Role-Based Access Control*) dan isolasi situs (*Multi-Tenant Isolation*). Berikut adalah daftar seluruh 17 akun terdaftar pada domain production:

### 2.1 Operational Accounts (Global System)
| Role | Username | Password | Scope / Deskripsi Akses |
| :--- | :--- | :--- | :--- |
| **Superadmin** | `admin` | `admin` | System Administrator (Akses penuh ke seluruh situs, agent, dan manajemen akun) |
| **Global SOC Analyst** | `sulist` | `sulist` | Global Security Incident Analyst (Pemantauan keamanan lintas seluruh agent & site) |

### 2.2 Network Agent Accounts (Agent View Mode)
*Akun-akun ini langsung mengunci tampilan dashboard ke satu Agent spesifik:*
| Role | Username | Password | Scope / Network Agent Target |
| :--- | :--- | :--- | :--- |
| **Agent Viewer** | `cibubur` | `cibubur` | Terkunci ke Agent `2F-TF-1D-GK` (JRP Cibubur) |
| **Agent Viewer** | `ifg` | `ifg` | Terkunci ke Agent `8A-V3-PB-85` (IFG LT.18) |
| **Agent Viewer** | `balaraja` | `balaraja` | Terkunci ke Agent `F6-2V-DT-8A` (CPI Balaraja) |
| **Agent Viewer** | `007` | `007` | Terkunci ke Agent `YW-6I-61-LL` (Gateway 007) |
| **Agent Viewer** | `bsd` | `bsd` | Terkunci ke Agent `1T-5Q-RC-AS` (Fazza BSD) |
| **Agent Viewer** | `jkt` | `jkt` | Terkunci ke Agent `2N-ID-VQ-AL` (Fazza JKT) |

### 2.3 User Accounts (Company & Tenant Administrations)
| Role | Username | Password | Scope / Deskripsi Akses |
| :--- | :--- | :--- | :--- |
| **Tenant Admin** | `siab` | `siab` | Administrator Situs SIAB (PT. Data Bisnis Solusi) |
| **Tenant SOC Analyst** | `silis` | `silis` | Analis Keamanan SOC Situs SIAB |
| **Tenant Engineer** | `siner` | `siner` | Network Engineer Situs SIAB |
| **Tenant Admin** | `nexus` | `nexus` | Administrator Situs Nexus |
| **Tenant SOC Analyst** | `nelis` | `nelis` | Analis Keamanan SOC Situs Nexus |
| **Tenant Engineer** | `nener` | `nener` | Network Engineer Situs Nexus |
| **Company Admin** | `faza` | `faza` | Administrator Perusahaan (PT. Fazza) |
| **Company Operator** | `faze` | `faze` | Operator Perusahaan (PT. Fazza) |
| **Company Viewer** | `fazu` | `fazu` | Viewer Perusahaan (PT. Fazza) |

---

## BAB 3: Struktur Halaman Dashboard & Seluruh Tab Modal

Dashboard terdiri dari **16 Halaman Utama** dan berbagai **Tab Modal Details**.

### 3.1 Overview (`/`)
- **KPI Summary Cards**: Menampilkan Total Download, Total Upload, Active Devices, Active Flows, dan System Uptime.
- **Top Applications Chart**: Grafik batang/pie konsumsi bandwidth aplikasi tertinggi (DL/UL formatted via `fmtBytes`).
- **Network Agents World Map**: Peta interaktif sebaran agent sensor jaringan.
- **Traffic Volume Timeline**: Grafik tren konsumsi lalu lintas data berdasarkan rentang waktu (5m, 1h, 24h, 7d, 30d).

### 3.2 Network Agents (`/agents`)
- **Agent Network Map**: Peta dunia 2D interaktif (CartoDB Dark Matter) menampilkan lokasi agent dengan penanda status (hijau = online/pulse, merah = offline), kontrol zoom/pan, dan tombol 📍 *Set Location* untuk memasukkan koordinat GPS.
- **Agent Table**: Daftar seluruh agent beserta UUID, nama friendly, status koneksi, uptime %, dan volume data.
- **View-As Agent Mode**: Fitur untuk melihat dashboard dari sudut pandang 1 agent spesifik secara aman.
- **Agent Detail Modal (7 Tab)**:
  1. *Devices*: Daftar perangkat yang terhubung ke agent ini.
  2. *Flows*: Rekor aliran lalu lintas data terkini milik agent.
  3. *Top Apps*: Aplikasi teratas yang diakses melalui agent ini.
  4. *Security*: Audit protokol tidak aman, kata sandi unencrypted, serta deteksi TOR/VPN.
  5. *Events*: Log kejadian operasional agent.
  6. *MAC Bandwidth*: Konsumsi bandwidth berdasarkan MAC address.
  7. *Telemetry*: Grafik performa CPU, memori, dan penggunaan interface agent.

### 3.3 App Lookup & Catalog (`/app-lookup`)
- **App Catalog Tab**: Direktori lengkap aplikasi yang terklasifikasi oleh sensor DPI (disertai logo/favicon asli, nama lengkap, dan kategori).
- **Blacklist Configuration Tab**: Fitur bagi Administrator untuk mengkonfigurasi aturan blokir/blacklist aplikasi dan kategori domain.
- **Application Detail Modal**:
  - *Summary Grid*: Total Download & Upload aplikasi.
  - *Top User Devices Table*: Tabel perangkat yang mengakses aplikasi (dengan *server-side pagination* 50 item/halaman).
  - *Agent Telemetry Distribution*: Distribusi konsumsi aplikasi di tiap node agent.

### 3.4 Device Labeling & Asset Directory (`/device-labeling`)
- **Device Asset Directory Table**: Tabel direktori MAC address yang mencakup MAC, Custom Owner Label, System Label, Manufaktur, Tipe Perangkat, dan Network Agent.
- **Edit Owner Modal**: Modal untuk menetapkan nama pemilik (*Custom Owner Label*) pada MAC address tertentu.
- **Device MAC Network Details Modal**:
  - *Profile Card*: Informasi MAC, Owner Label, System Label, Manufaktur, Tipe, dan Agent.
  - *Associated IP Addresses Table*: Riwayat alamat IP yang pernah digunakan oleh MAC tersebut, dilengkapi tampilan tanggal 2-baris (`DateCell`), pemotongan alamat IP panjang (*truncated with tooltip*), serta tombol **Export PDF**.

### 3.5 Network Devices (`/devices`)
- **Devices Table**: Tabel daftar seluruh perangkat IP lokal di jaringan.
- **Device Detail Modal (6 Tab)**:
  1. *Overview*: Kartu durasi aktif, 2-kolom kartu statistik Download & Upload, dan `DeviceIdentityCard` (OS, Tipe, Manufaktur, Last Seen).
  2. *Applications*: Aplikasi yang digunakan oleh perangkat ini (disertai filter pencarian & urutan).
  3. *Protocols*: Audit protokol jaringan yang digunakan perangkat.
  4. *Domains / Web*: Domain dan URL web yang diakses perangkat.
  5. *Network Flows*: Log flow lalu lintas data spesifik perangkat.
  6. *Threats*: Anomali dan ancaman keamanan yang terkait dengan perangkat ini.
  - *Tombol Export PDF*: Mengunduh laporan PDF telemetri perangkat lengkap.

### 3.6 Network Flows (`/flows`)
- **Real-Time Flow Table**: Tabel utama alur jaringan *real-time* yang menampilkan Source IP, Dest IP, Source Port, Dest Port, App Label, Protocol, Download, Upload, dan Last Seen.
- **Server-Side Pagination**: Halaman berkapasitas 50 rekor dengan penomoran urut terus bersambung.
- **Optimasi Performa 60fps**: Bebas freeze pada perangkat mobile.

### 3.7 Detected Threats (`/threats`)
- **Threat Incident Table**: Log insiden keamanan jaringan dengan tingkatan severity (*Critical, High, Medium, Low*).
- **Filter Threat Data Pop-Up Modal**: Modal pop-up filter untuk menyaring insiden berdasarkan tanggal, tipe ancaman, severity, IP, MAC, dan aplikasi.
- **Threat Recommendations Drawer**: Drawer modal berisi panduan mitigasi dan tindakan perbaikan keamanan untuk setiap insiden.
- **Tombol Export PDF**: Mengunduh laporan PDF ringkasan ancaman keamanan.

### 3.8 Security Audit (`/security-audit`)
- **Insecure Protocols Tab**: Audit penggunaan protokol berisiko (HTTP, FTP, Telnet, POP3, IMAP).
- **Cleartext Passwords Tab**: Deteksi pengiriman kata sandi tanpa enkripsi di jaringan.
- **Anonymizer Detections Tab**: Deteksi penggunaan jaringan anonim (TOR Browser & VPN Services).
- **TLS Cipher Suite Audit Tab**: Audit kekuatan cipher suite dan versi enkripsi TLS.
- **Tombol Export PDF**: Mengunduh laporan PDF audit keamanan TLS & protokol.

### 3.9 Network Intelligence (`/network-intelligence`)
- **Bandwidth Distribution**: Grafik breakdown konsumsi bandwidth berdasarkan kategori.
- **Protocol Distribution**: Analisis persentase protokol (TCP, UDP, ICMP, dll.).
- **Top SNI Hostnames**: Nama domain SNI (*Server Name Indication*) yang paling sering diakses.
- **Autonomous Systems (ASN)**: Analisis penyedia jaringan & ISP tujuan.

### 3.10 Geography Traffic (`/geography`)
- **Peta 3D Globe & Peta Dunia 2D**: Peta globe 3D interaktif dan peta 2D (CartoDB Dark Matter) menampilkan lokasi geografis lalu lintas data dunia.
- **Country Traffic Table**: Tabel konsumsi data per negara tujuan.
- **Remote IP Detail Modal (6 Tab)**: Modal rincian IP luar/remote yang mencakup Overview, Local Devices, Protocols, Domains, Flows, dan Threats.

### 3.11 DNS Traffic (`/dns`)
- Pemantauan kueri DNS, domain lookup, dan respons alamat IP.

### 3.12 System Events (`/events`)
- Audit log kejadian sistem, insiden konektivitas agent, dan aktivitas akun.

### 3.13 User Accounts (`/user-accounts`)
- **User Directory Table**: Tabel manajemen akun penguna.
- **Account Modal**: Tambah/edit akun, ubah role, atur checklist penugasan Agent dan Situs, serta unggah/hapus foto profil (*profile picture*).

### 3.14 Contextual Guidance System (`/help` & `HelpTrigger`)
- **Learn This Page Modal**: Panduan penggunaan interaktif yang tersedia di 14 halaman dashboard untuk mengedukasi pengguna mengenai elemen dan kolom data pada halaman tersebut.

---

## BAB 4: Sistem Ekspor Laporan PDF (7 Laporan PDF)

Dashboard dilengkapi dengan 7 generator laporan PDF profesional:

1. **Device Analysis Report (`DevicePdfDocument.tsx`)**: Laporan telemetri perangkat lengkap, mencakup IP, MAC, **Owner / Custom Label**, OS, Manufaktur, Agent, serta grafik & tabel aplikasi, domain, dan flow.
2. **Network Agent Report (`AgentPdfDocument.tsx`)**: Laporan ringkasan agent, mencakup identitas agent, statistik bandwidth, serta tabel **Monitored Devices** (dilengkapi kolom **Owner / Device Label**).
3. **Application Activity Report (`AppPdfDocument.tsx`)**: Laporan analisis konsumsi aplikasi dan daftar perangkat pengguna tertinggi.
4. **Threat Summary Report (`ThreatsSummaryPdfDocument.tsx`)**: Laporan ringkasan insiden keamanan jaringan dan statistik severity.
5. **Security Audit Report (`SecurityAuditPdfDocument.tsx`)**: Laporan audit enkripsi TLS dan deteksi protokol berisiko.
6. **Device Asset Directory Report (`DeviceLabelingPdfDocument.tsx`)**: Laporan unduhan direktori lengkap aset MAC address beserta nama pemilik (*Owner Label*).
7. **Device MAC Details Report (`DeviceMacPdfDocument.tsx`)**: Laporan profil rincian MAC address dan tabel riwayat IP terkait.

---

## BAB 5: Desain Visual, Responsivitas Mobile & Kepatuhan Standar

1. **App-Native Mobile Experience**:
   - Navigation Bottom Bar 5-tab di layar mobile (*Overview, Devices, Flows, Threats, Menu*).
   - `MobileTopBar` khusus dengan logo, judul halaman, dan status notifikasi.
   - Kartu statistik 2-kolom berdampingan pada layar mobile (`grid-cols-2`).
2. **Nol Scrollbar Horizontal Halaman & Nol Clipping (Rule 9)**:
   - Seluruh konten dan tabel muat 100% di dalam lebar container desktop/laptop tanpa memicu scrollbar horizontal halaman utama.
   - Menggunakan pemotongan teks bersahabat (*truncate*) dengan *tooltip hover* `title` pada sel yang panjang.
3. **Bahasa Antarmuka**:
   - Seluruh elemen tampilan antarmuka (UI) dashboard ditulis eksklusif dalam **Bahasa Inggris**.
