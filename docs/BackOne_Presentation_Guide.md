# Panduan Presentasi Proyek: BackOne DPI Dashboard
**PT. Data Bisnis Solusi**

Dokumen panduan ini ditujukan sebagai bahan acuan singkat, jelas, dan mudah dipahami untuk melakukan presentasi kepada Manajemen Eksekutif.

---

## 1. Latar Belakang & Tujuan Proyek
*   **Apa itu BackOne DPI?** 
    Platform pemantauan keamanan dan analisis lalu lintas jaringan tingkat lanjut menggunakan teknologi **Deep Packet Inspection (DPI)**.
*   **Tujuan Proyek**: 
    1.  Mendeteksi ancaman jaringan dan aktivitas mencurigakan secara realtime.
    2.  Memetakan distribusi geografis agen pemantau jaringan di seluruh Indonesia.
    3.  Mengisolasi hak akses dan visibilitas data lalu lintas jaringan antar-penyewa (multi-tenancy) secara aman.

---

## 2. Arsitektur Sistem (Three-Tier Architecture)
Aplikasi ini berjalan secara efisien melalui pembagian 3 lapis komponen utama:
1.  **Proxy Server (Collector)**:
    Mengambil data telemetri mentah dari sensor jaringan setiap 5 menit sekali secara unik (menggunakan *upsert* berbasis `flow_id`), membersihkan data flow mati (> 1 jam), dan memangkas ukuran database.
2.  **MongoDB Database**:
    Sebagai *Single Source of Truth* (sumber data tunggal) agar seluruh data terpusat, konsisten, dan sinkron tanpa adanya duplikasi data.
3.  **Backend (Express) & Frontend (Next.js)**:
    Menyajikan API berkecepatan tinggi (< 10ms) dan antarmuka dashboard interaktif berbasis Role-Based Access Control (RBAC).

---

## 3. Fitur Utama Dashboard
*   **Keamanan Terisolasi (Multi-Tenancy & RBAC)**:
    Pengguna memiliki peran berbeda (Admin, SOC Analyst, Engineer). Data lalu lintas dibatasi hanya untuk masing-masing penyewa (*site* seperti SIAB atau Nexus), sehingga menjamin kerahasiaan informasi.
*   **Peta Topologi Geografis**:
    Peta interaktif Indonesia yang menunjukkan posisi fisik agen jaringan di lapangan beserta metrik kecepatan dan volume lalu lintas jaringannya.
*   **Threat Intelligence & Audit**:
    Deteksi ancaman jaringan otomatis (seperti cryptomining atau port scanning) serta kustomisasi pencegahan melalui kebijakan *Blacklist Policy* per agen.
*   **Kapasitas Database Realtime**:
    Kalkulasi cerdas kapasitas data (*Data Size*) yang digunakan oleh masing-masing agen di database dengan metode cepat tanpa membebani server produksi.
*   **Enkripsi & Analisis Protokol**:
    Audit enkripsi lalu lintas (TLS), pembagian kategori aplikasi (streaming, hosting, web), dan rincian perangkat pengakses.

---

## 4. Keamanan & Kebijakan Data Produksi
*   **Keamanan Kode Utama**:
    Kunci JWT, API sensor, dan database disimpan dengan aman di server (*Server-Side*). Tidak ada kredensial krusial yang bocor di sisi browser (*Client-Side*) sehingga aman dari serangan *inspect element*.
*   **Kebijakan Retensi Data**:
    Sistem secara otomatis menghapus data telemetri yang berusia lebih dari **7 hari** (rolling 7 days) untuk menjaga ketersediaan kapasitas ruang server VPS.
*   **Status Deploy**:
    Sudah terpasang penuh (*live*) pada domain **https://demoplace.my.id** menggunakan Node.js v20 di bawah pengelolaan manajer proses PM2.

---
*(c) 2026 PT. Data Bisnis Solusi. Dokumen ini disiapkan untuk kebutuhan presentasi manajemen.*
