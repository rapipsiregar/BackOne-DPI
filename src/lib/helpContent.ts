// src/lib/helpContent.ts
// ─────────────────────────────────────────────────────────────────────────────
// Centralized content for the User Guide & Help Center.
// Used by both HelpCenterFAB (quick FAQs) and the /help page (full guide).
// ─────────────────────────────────────────────────────────────────────────────

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TableColumn {
  column: string;
  description: string;
}

export interface PageGuide {
  id: string;
  title: string;
  url: string;
  icon: string;
  summary: string;
  sections: {
    heading: string;
    content?: string;
    columns?: TableColumn[];
    items?: { label: string; description: string }[];
  }[];
}

// ── FAQ (used in HelpCenterFAB quick panel) ──────────────────────────────────
export const FAQS: FAQItem[] = [
  {
    question: "Kenapa data Threats kosong (0)?",
    answer:
      "Jika indikator Threats menunjukkan angka 0, artinya jaringan Anda aman dalam rentang waktu yang dipilih. Sistem tidak mendeteksi adanya paket data yang cocok dengan profil serangan yang diketahui.",
  },
  {
    question: "Apa perbedaan Events dan Threats?",
    answer:
      "Events adalah semua log aktivitas koneksi biasa yang tercatat di jaringan (termasuk yang aman). Threats adalah sekumpulan Events khusus yang telah difilter dan diklasifikasikan sebagai aktivitas berbahaya oleh sistem Deep Packet Inspection (DPI).",
  },
  {
    question: "Bagaimana cara membaca Heatmap Geo Traffic?",
    answer:
      "Warna biru muda menunjukkan trafik rendah, sedangkan warna biru pekat/tua menunjukkan volume trafik (download/upload) yang sangat tinggi dari/ke negara tersebut.",
  },
  {
    question: "Berapa lama data disimpan?",
    answer:
      "Database sistem dikonfigurasi untuk secara otomatis menghapus data telemetri jaringan yang usianya lebih dari 7 hari untuk menjaga performa sistem.",
  },
  {
    question: "Apa arti indikator Online/Offline pada agen?",
    answer:
      "Agen berstatus Online jika berhasil mengirim data dalam 12 jam terakhir. Agen Offline berarti tidak ada paket data yang diterima melebihi batas waktu tersebut.",
  },
  {
    question: "Mengapa Download lebih besar dari Upload?",
    answer:
      "Ini adalah kondisi normal. Pengguna di jaringan umumnya mengunduh (streaming, web browsing) jauh lebih banyak daripada mengunggah. Jika Upload lebih besar, hal itu bisa mengindikasikan data exfiltration dan perlu diselidiki.",
  },
];

// ── Full Page Guides (used in /help page) ────────────────────────────────────
export const PAGE_GUIDES: PageGuide[] = [
  {
    id: "overview",
    title: "Overview",
    url: "/",
    icon: "🏠",
    summary: "Ringkasan kondisi jaringan secara keseluruhan dalam satu tampilan.",
    sections: [
      {
        heading: "Kartu KPI (Header)",
        columns: [
          { column: "Total Flows", description: "Jumlah sesi koneksi jaringan yang terpantau dalam rentang waktu aktif." },
          { column: "Total Download", description: "Akumulasi data yang diterima oleh semua perangkat di site aktif." },
          { column: "Total Upload", description: "Akumulasi data yang dikirim keluar dari site aktif." },
          { column: "Active Devices", description: "Jumlah perangkat unik yang terdeteksi aktif dalam rentang waktu aktif." },
        ],
      },
      {
        heading: "Globe Map",
        content:
          "Peta bola dunia interaktif. Garis bercahaya merepresentasikan arus trafik dari site Anda ke negara tujuan. Warna garis menunjukkan intensitas trafik. Hover ke garis untuk melihat nama negara dan volume data. Klik dan seret untuk memutar globe.",
      },
      {
        heading: "Top Applications & Top Protocols",
        content:
          "Widget di bawah globe menampilkan 7 aplikasi dan protokol dengan volume trafik tertinggi. Bar horizontal merepresentasikan perbandingan volume relatif antar entri.",
      },
    ],
  },
  {
    id: "agents",
    title: "Agents Inventory",
    url: "/agents",
    icon: "📡",
    summary: "Daftar dan status semua Network Agent yang terdaftar di site Anda.",
    sections: [
      {
        heading: "Kartu Statistik",
        columns: [
          { column: "Total Agents", description: "Jumlah Network Agent yang terdaftar di site aktif." },
          { column: "Online Agents", description: "Agen yang berhasil mengirim data dalam 12 jam terakhir." },
          { column: "Offline Agents", description: "Agen yang tidak terdeteksi aktif." },
          { column: "Avg. Historical Uptime", description: "Rata-rata persentase waktu aktif seluruh agen sepanjang data 7 hari tersimpan." },
        ],
      },
      {
        heading: "Agent Location & Topology Map",
        content:
          "Peta Indonesia interaktif. Titik hijau = agen Online. Titik merah = agen Offline. Garis biru = aliran trafik antar agen yang terdeteksi. Hover ke titik untuk melihat detail agen. Hover ke garis untuk melihat detail flow (agen asal, tujuan, volume data). Panel biru di bawah peta menampilkan agen yang belum memiliki koordinat GPS — klik chip agen untuk menambahkan koordinat secara manual.",
      },
      {
        heading: "Tabel: Provisioned Network Agents",
        columns: [
          { column: "UUID / Serial", description: "Identitas unik perangkat agen hardware." },
          { column: "Label", description: "Nama lokasi atau deskripsi yang diberikan untuk agen ini." },
          { column: "Provisioned", description: "Apakah agen sudah diaktifkan dan didaftarkan di sistem." },
          { column: "Activated", description: "Apakah agen sudah terhubung dan pernah mengirim data." },
          { column: "Status", description: "Online (hijau) atau Offline (merah) beserta waktu terakhir terlihat." },
          { column: "Historical Uptime", description: "Persentase waktu aktif selama 7 hari data tersimpan." },
          { column: "Data Size", description: "Total ukuran data yang dikumpulkan agen ini di database sistem." },
          { column: "Actions", description: "Tombol aksi: Detail, Koordinat GPS, Visibilitas, Delete." },
        ],
      },
    ],
  },
  {
    id: "flows",
    title: "Flows",
    url: "/flows",
    icon: "🔀",
    summary: "Daftar semua sesi koneksi jaringan aktif yang terdeteksi oleh DPI.",
    sections: [
      {
        heading: "Filter Bar",
        content:
          "Filter di bagian atas tabel: Source IP, Destination IP, Protocol, dan App / Domain. Kombinasikan beberapa filter untuk mempersempit hasil pencarian.",
      },
      {
        heading: "Tabel: Active Flows",
        columns: [
          { column: "#", description: "Nomor urut baris dalam halaman saat ini." },
          { column: "Last Seen", description: "Waktu terakhir paket dari sesi ini diterima (zona waktu Indonesia)." },
          { column: "Flow ID", description: "Identitas unik sesi koneksi yang dibuat oleh DPI." },
          { column: "Src IP", description: "Alamat IP sumber — perangkat atau server yang memulai koneksi." },
          { column: "Dst IP", description: "Alamat IP tujuan. Hover untuk melihat nama perangkat jika diketahui." },
          { column: "Dst Port", description: "Port tujuan. Hover untuk melihat nama layanan (443=HTTPS, 53=DNS, dll.)." },
          { column: "Protocol", description: "Protokol jaringan yang digunakan pada sesi ini (TCP, UDP, QUIC, dll.)." },
          { column: "App / Domain", description: "Aplikasi atau nama domain yang teridentifikasi oleh mesin DPI." },
          { column: "Download", description: "Volume data yang diterima dari tujuan ke sumber (dalam KB/MB)." },
          { column: "Upload", description: "Volume data yang dikirim dari sumber ke tujuan." },
        ],
      },
    ],
  },
  {
    id: "apps",
    title: "Apps",
    url: "/apps",
    icon: "📦",
    summary: "Daftar semua aplikasi yang teridentifikasi oleh DPI beserta volume trafik.",
    sections: [
      {
        heading: "Tabel: Top Applications",
        columns: [
          { column: "Application", description: "Nama aplikasi yang teridentifikasi (YouTube, Zoom, WhatsApp, dll.)." },
          { column: "Download", description: "Total data yang diunduh melalui aplikasi ini dalam rentang waktu aktif." },
          { column: "Upload", description: "Total data yang diunggah melalui aplikasi ini." },
          { column: "Total Traffic", description: "Gabungan download + upload untuk aplikasi ini." },
          { column: "Devices", description: "Jumlah perangkat unik yang menggunakan aplikasi ini." },
          { column: "Flows", description: "Jumlah sesi koneksi aktif dari aplikasi ini." },
        ],
      },
    ],
  },
  {
    id: "devices",
    title: "Devices",
    url: "/devices",
    icon: "💻",
    summary: "Inventaris semua perangkat yang terdeteksi aktif di jaringan.",
    sections: [
      {
        heading: "Tabel: Device Inventory",
        columns: [
          { column: "IP Address", description: "Alamat IP perangkat di jaringan lokal." },
          { column: "MAC Address", description: "Identitas fisik kartu jaringan perangkat (hardware address)." },
          { column: "Hostname", description: "Nama perangkat jika tersedia dari resolver DNS lokal." },
          { column: "Agent", description: "Network Agent yang mendeteksi dan memantau perangkat ini." },
          { column: "Last Seen", description: "Kapan terakhir kali perangkat ini aktif mengirim atau menerima trafik." },
          { column: "Download / Upload", description: "Volume trafik total dari dan ke perangkat ini." },
        ],
      },
    ],
  },
  {
    id: "dns",
    title: "DNS",
    url: "/dns",
    icon: "🌐",
    summary: "Log query DNS yang terdeteksi di jaringan.",
    sections: [
      {
        heading: "Tabel: DNS Queries",
        columns: [
          { column: "Domain", description: "Nama domain yang di-query oleh perangkat di jaringan." },
          { column: "Query Type", description: "Jenis query DNS: A (IPv4), AAAA (IPv6), MX (mail), CNAME (alias), dll." },
          { column: "Client IP", description: "Alamat IP perangkat yang melakukan query DNS ini." },
          { column: "Response", description: "Alamat IP yang dikembalikan oleh server DNS sebagai jawaban." },
          { column: "Count", description: "Frekuensi query domain ini dalam rentang waktu aktif." },
          { column: "Last Seen", description: "Waktu terakhir query domain ini terjadi." },
        ],
      },
    ],
  },
  {
    id: "network-intelligence",
    title: "Traffic Categories",
    url: "/network-intelligence",
    icon: "📊",
    summary: "Klasifikasi trafik berdasarkan kategori aplikasi hasil analisis DPI.",
    sections: [
      {
        heading: "Kategori Utama",
        content:
          "Menampilkan bagan distribusi trafik per kategori utama seperti Streaming, Social Media, Web, Email, Cloud, File Transfer, dll. serta visualisasi proporsi trafik menggunakan Pie Chart.",
      },
      {
        heading: "Tabel Kategori Aplikasi",
        columns: [
          { column: "Category", description: "Nama kategori aplikasi jaringan yang diidentifikasi." },
          { column: "Download", description: "Volume data yang diunduh pada kategori ini." },
          { column: "Upload", description: "Volume data yang diunggah pada kategori ini." },
          { column: "Total Traffic", description: "Gabungan volume download dan upload." },
          { column: "Devices", description: "Jumlah perangkat unik yang menggunakan kategori ini." },
        ],
      },
    ],
  },
  {
    id: "dpi-analytics",
    title: "DPI MetaData",
    url: "/dpi-analytics",
    icon: "🔌",
    summary: "Analisis metadata mentah hasil inspeksi paket mendalam (DPI) dan sidik jari perangkat.",
    sections: [
      {
        heading: "Tab: Hostnames & Servers",
        content: "Log domain eksternal, IP server, port, dan agen pendeteksi. Membantu mengidentifikasi tujuan koneksi perangkat.",
      },
      {
        heading: "Tab: Client Fingerprints",
        content: "Menampilkan data sidik jari sistem operasi (Discovery OS), dhcpFingerprints, dan HTTP User Agent untuk mengidentifikasi jenis perangkat yang aktif.",
      },
      {
        heading: "Tab: Specific Protocols",
        content: "Log metadata protokol khusus seperti versi server SSH yang digunakan dan Bittorrent Hashes untuk mengaudit torrenting.",
      },
      {
        heading: "Tabel Detail Metadata",
        columns: [
          { column: "Value / OS / Domain", description: "Nilai metadata, nama domain, User Agent, atau nama sistem operasi." },
          { column: "Details / Version", description: "Informasi detail tambahan (seperti versi SSH atau detail OS)." },
          { column: "Count", description: "Frekuensi kemunculan metadata ini di jaringan." },
          { column: "Last Seen", description: "Waktu terakhir metadata ini terdeteksi di database." },
        ],
      },
    ],
  },
  {
    id: "geography",
    title: "Geo Traffic",
    url: "/geography",
    icon: "🗺️",
    summary: "Distribusi trafik berdasarkan negara tujuan koneksi.",
    sections: [
      {
        heading: "Tabel: Traffic by Country",
        columns: [
          { column: "Country", description: "Negara tujuan koneksi yang terdeteksi oleh mesin geolokasi." },
          { column: "Flag", description: "Bendera negara sebagai identifikasi visual." },
          { column: "Download / Upload", description: "Volume trafik yang dikirim ke atau diterima dari negara tersebut." },
          { column: "Flows", description: "Jumlah sesi koneksi aktif yang menuju negara tersebut." },
        ],
      },
    ],
  },
  {
    id: "intelligence",
    title: "Threat Intelligence",
    url: "/intelligence",
    icon: "🛡️",
    summary: "Deteksi ancaman keamanan jaringan secara otomatis oleh sistem DPI.",
    sections: [
      {
        heading: "Kategori Ancaman (Sidebar Kiri)",
        items: [
          { label: "Crypto Mining", description: "Perangkat yang terdeteksi menambang cryptocurrency tanpa izin." },
          { label: "Botnet Command & Control", description: "Koneksi ke server Command and Control yang diketahui berbahaya." },
          { label: "Malware", description: "Trafik yang cocok dengan signature malware yang terdaftar." },
          { label: "Phishing", description: "Akses ke domain yang teridentifikasi sebagai situs phishing." },
        ],
      },
      {
        heading: "Tabel Detail Ancaman",
        columns: [
          { column: "Threat Level", description: "Tingkat keparahan: Critical, High, Medium, atau Low." },
          { column: "Source IP", description: "Alamat IP perangkat di jaringan Anda yang terlibat." },
          { column: "Destination", description: "IP atau domain tujuan yang teridentifikasi berbahaya." },
          { column: "First Seen", description: "Kapan pertama kali ancaman ini terdeteksi dalam database." },
          { column: "Last Seen", description: "Kapan terakhir kali aktivitas mencurigakan ini terpantau." },
          { column: "Evidence", description: "Detail teknis yang menjadi dasar sistem mengklasifikasikan ini sebagai ancaman." },
        ],
      },
    ],
  },
  {
    id: "events",
    title: "Events",
    url: "/events",
    icon: "📋",
    summary: "Log semua kejadian penting yang dicatat oleh sistem.",
    sections: [
      {
        heading: "Tabel: Event Log",
        columns: [
          { column: "Timestamp", description: "Waktu kejadian terjadi dalam zona waktu Indonesia." },
          { column: "Severity", description: "Tingkat keparahan: Info, Warning, atau Critical." },
          { column: "Agent", description: "Network Agent yang mendeteksi dan mencatat kejadian ini." },
          { column: "Description", description: "Deskripsi singkat kejadian yang terjadi." },
          { column: "Details", description: "Klik untuk membuka panel detail lengkap kejadian." },
        ],
      },
    ],
  },
  {
    id: "security-audit",
    title: "Encryption Audit (TLS)",
    url: "/security-audit",
    icon: "🔐",
    summary: "Audit keamanan enkripsi TLS di seluruh jaringan yang terpantau.",
    sections: [
      {
        heading: "Tabel: TLS Versions",
        columns: [
          { column: "Version", description: "Versi TLS yang digunakan (TLS 1.0, 1.1, 1.2, 1.3)." },
          { column: "Count", description: "Jumlah koneksi yang menggunakan versi ini dalam rentang waktu aktif." },
          { column: "Risk", description: "TLS 1.0/1.1 = Berisiko Tinggi. TLS 1.2 = Sedang. TLS 1.3 = Aman." },
        ],
      },
      {
        heading: "Tabel: TLS Ciphers",
        columns: [
          { column: "Cipher Suite", description: "Nama algoritma enkripsi yang digunakan pada koneksi TLS." },
          { column: "Strength", description: "Kekuatan enkripsi: Strong, Weak, atau Insecure." },
          { column: "Count", description: "Frekuensi penggunaan cipher ini dalam rentang waktu aktif." },
        ],
      },
    ],
  },
  {
    id: "network-infrastructure",
    title: "Topology (Infrastructure)",
    url: "/network-infrastructure",
    icon: "🌐",
    summary: "Visualisasi dan rincian topologi fisik, logis, dan geografis dari infrastruktur jaringan.",
    sections: [
      {
        heading: "Tab: Routing & Geography",
        content: "Melihat statistik wilayah (Top Regions) dan perkotaan (Top Cities) asal/tujuan pengiriman trafik jaringan.",
      },
      {
        heading: "Tab: Interfaces & VLANs",
        content: "Daftar antarmuka jaringan fisik (Interfaces) dan penanda VLAN (VLAN Tags) yang aktif mengalirkan data.",
      },
      {
        heading: "Tab: IP & MAC",
        content: "Daftar alamat IP remote teraktif, statistik versi protokol IP (IPv4 vs IPv6), dan pemakaian bandwidth berdasarkan MAC Address lokal.",
      },
      {
        heading: "Tab: Flow Profiles",
        content: "Log karakteristik aliran data berdasarkan jenis flow (Flow Types) dan sumber asal flow (Flow Origins) seperti Local, Inbound, Outbound.",
      },
    ],
  },
  {
    id: "lookup",
    title: "Application Database (Lookup)",
    url: "/lookup",
    icon: "🔍",
    summary: "Katalog referensi global database aplikasi yang dapat dikenali oleh sistem DPI.",
    sections: [
      {
        heading: "Katalog & Pencarian",
        content: "Gunakan bar pencarian di bagian atas untuk menemukan aplikasi tertentu berdasarkan nama, atau gunakan dropdown filter kategori untuk menyaring daftar aplikasi.",
      },
      {
        heading: "Detail Aplikasi (Modal)",
        content: "Klik salah satu card aplikasi untuk membuka modal informasi lengkap yang merinci deskripsi aplikasi, tingkat risiko keamanan (Risk Level), port standar (Default Port), serta protokol transport yang digunakan.",
      },
    ],
  },
];

// ── Global UI Conventions ─────────────────────────────────────────────────────
export const UI_CONVENTIONS = [
  { symbol: "● (hijau)", meaning: "Status aktif / Online / Kondisi aman" },
  { symbol: "● (merah)", meaning: "Status tidak aktif / Offline / Berisiko" },
  { symbol: "● (kuning/amber)", meaning: "Perlu perhatian / Warning" },
  { symbol: "Teks terpotong (...)", meaning: "Hover ke teks untuk melihat nilai lengkap" },
  { symbol: "KB / MB / GB", meaning: "Satuan ukuran data (1 MB = 1.000 KB)" },
  { symbol: "Format waktu WIB/WITA/WIT", meaning: "Semua waktu ditampilkan dalam zona waktu Indonesia" },
  { symbol: "Pagination < 1/N >", meaning: "Navigasi halaman — setiap halaman menampilkan 50 baris data" },
];
