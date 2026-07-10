# BackOne DPI — Deep Package Inspection Dashboard

Produk BackOne oleh **PT. Data Bisnis Solusi** — Dashboard monitoring jaringan berbasis Netify DPI.

---

## 🏗️ Arsitektur 2 Container Groups

```
┌─────────────────────────────────────────┐
│  CONTAINER GROUP 1: INFRA               │
│                                         │
│  ┌──────────────────┐  ┌─────────────┐  │
│  │  backone_proxy   │  │backone_mongo│  │
│  │  (port 4000)     │──│ (port 27017)│  │
│  │  Netify API →    │  │  MongoDB    │  │
│  │  MongoDB writer  │  │  Database   │  │
│  └──────────────────┘  └─────────────┘  │
│         Network: backone-infra           │
└─────────────────────────────────────────┘
                    │ MongoDB shared
┌─────────────────────────────────────────┐
│  CONTAINER GROUP 2: APP                 │
│                                         │
│  ┌──────────────────┐  ┌─────────────┐  │
│  │backone_backend   │  │backone_front│  │
│  │  (port 3001)     │  │ (port 3000) │  │
│  │  REST API        │──│  Next.js    │  │
│  │  MongoDB reader  │  │  Dashboard  │  │
│  └──────────────────┘  └─────────────┘  │
│         Network: backone-app             │
└─────────────────────────────────────────┘
```

**Prinsip:**
- Proxy **MENULIS** ke MongoDB → Backend **MEMBACA** dari MongoDB
- Backend tidak pernah memanggil Netify API secara langsung
- Setiap data di-tag dengan `agent_uuid` untuk isolasi multi-tenant

---

## 📡 Proxy — 2 Mode Pengambilan Data

Proxy server (port 4000) mendukung 2 mode yang dikontrol via environment variable:

### Mode 1: Semua Network Agent (Admin BackOne)

```env
# .env.local
PROXY_COLLECT_MODE=all
```

Proxy akan mengambil data dari **semua Network Agent yang terdaftar** di Netify, lalu menyimpan setiap record dengan tag `agent_uuid` masing-masing. Cocok untuk tampilan admin BackOne yang ingin melihat semua data.

### Mode 2: Agent Spesifik (Per-Client/Tenant)

```env
# .env.local
PROXY_COLLECT_MODE=agent
PROXY_AGENT_UUID=2F-TF-1D-GK    # UUID Network Agent CPI Balaraja
```

Proxy hanya mengambil data dari **satu Network Agent spesifik** (berdasarkan UUID). Data agent lain tidak pernah masuk ke database. Cocok untuk deployment di sisi client (Pihak A, B, C) agar mereka hanya punya data milik mereka sendiri.

### Contoh Multi-Tenant Deployment

| Deployment | PROXY_COLLECT_MODE | PROXY_AGENT_UUID | Data yang disimpan |
|---|---|---|---|
| Kantor BackOne (Admin) | `all` | _(kosong)_ | Semua agent |
| Pihak A | `agent` | `UUID-AGENT-A` | Hanya data Pihak A |
| Pihak B | `agent` | `UUID-AGENT-B` | Hanya data Pihak B |
| Pihak C | `agent` | `UUID-AGENT-C` | Hanya data Pihak C |

---

## 🔌 Proxy REST API (Port 4000)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/health` | Health check (status MongoDB + service) |
| GET | `/status` | Status scheduler, mode, last run result |
| GET | `/agents` | List semua agent UUID yang ada di MongoDB |
| POST | `/collect/all` | Trigger manual — kumpulkan semua agent |
| POST | `/collect/:uuid` | Trigger manual — kumpulkan agent spesifik |

---

## 🚀 Cara Menjalankan

### Development (Localhost)

```bash
# 1. Pastikan MongoDB berjalan di port 27017
# 2. Edit .env.local sesuai kebutuhan

# Terminal 1 — Proxy Server
cd proxy
npm install
npm start    # berjalan di port 4000

# Terminal 2 — Backend API
cd backend
npm install
npm start    # berjalan di port 3001

# Terminal 3 — Frontend
npm install
npm run dev  # berjalan di port 3000
```

### Production (Docker Compose)

```bash
# Mode default (semua agent):
docker-compose up -d

# Mode agent spesifik (ubah .env.local dulu):
# PROXY_COLLECT_MODE=agent
# PROXY_AGENT_UUID=UUID_AGENT_ANDA
docker-compose up -d

# Cek status container:
docker-compose ps

# Test:
curl http://localhost:4000/health      # Proxy
curl http://localhost:3001/api/health  # Backend
curl http://localhost:4000/agents      # List Agent UUIDs
```

---

## 📊 Data yang Disimpan per Network Agent

Setiap Network Agent menyimpan data berikut di MongoDB (semua ter-tag `agent_uuid`):

| Collection | Data |
|---|---|
| `summaries` | Bandwidth total (download/upload), total devices, active flows |
| `appstats` | Top aplikasi per bandwidth (IP address, download, upload, flows) |
| `devicestats` | Perangkat ditemukan (IP, MAC address, device type, OS, manufacturer, last seen) |
| `flows` | Network flows aktif (src_ip, dst_ip, dst_port, protocol, domain, download, upload) |
| `threats` | Ancaman cyber terdeteksi (threat_type, severity, src_ip, dst_ip) |

---

## 🔐 Role & Akses

| Role | Deskripsi | Data yang dilihat |
|---|---|---|
| `SUPER_ADMIN` | Admin BackOne | Semua data semua agent |
| `AGENT_VIEWER` | Client/Tenant | Hanya data `agent_uuid` milik mereka |

Login pertama kali: **admin / admin** (ganti segera!)

---

## 🧪 Menjalankan TDD Tests

```bash
# Architecture verification (48 tests)
node test/architecture_test.js

# Final deliverable review (63 tests)
node test/final_review.js
```
