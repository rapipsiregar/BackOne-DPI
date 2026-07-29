# DETAIL TEKNIS: Cara Proxy Memfilter Data per Site (SIAB vs Office)

Dokumen ini menjelaskan **secara kode** bagaimana data dipisahkan per site.
Ada **3 lapis filter** yang bekerja dari Netify API sampai ke tampilan dashboard.

---

## LAPIS 1 — Saat Minta Data ke Netify API
### File: `proxy/netifyClientCore.js`

```
NETIFY_SITE_UUIDS = "6681452d_....(SIAB), 1959bb55_....(Office)"
                          |
              proxy loop satu per satu:
              ┌─────────────────────────┐
              │  for SIAB UUID:         │
              │    kirim request ke     │
              │    Netify dengan header │
              │    x-net-site: SIAB-UUID│
              └─────────────────────────┘
              ┌─────────────────────────┐
              │  for Office UUID:       │
              │    kirim request ke     │
              │    Netify dengan header │
              │    x-net-site: OFFICE-UUID│
              └─────────────────────────┘
```

**KODE ASLI — cara header dikirim:**
```javascript
// proxy/netifyClientCore.js baris 14-18
function getHeaders(siteUuid) {
  const headers = {
    'x-api-key': process.env.NETIFY_API_KEY,
    'Accept': 'application/json'
  };

  if (siteUuid) headers['x-net-site'] = siteUuid;
  //            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Ini yang memfilter data di sisi Netify!
  // Netify API hanya kembalikan data untuk site ini saja.

  return headers;
}

async function netifyFetch(endpoint, params = {}, agentUuid, siteUuid) {
  const res = await axios.get(`${BASE_URL}${endpoint}`, {
    headers: getHeaders(siteUuid),  // <--- siteUuid dikirim ke Netify
    params,
    timeout: 30000,
  });
}
```

**Artinya:** Netify API sendiri yang memfilter. Kalau kita kirim header
`x-net-site: SIAB-UUID`, Netify HANYA kembalikan data milik SIAB.
Kita tidak perlu filter manual — Netify sudah filter dari sumbernya.

---

## LAPIS 2 — Saat Simpan ke MongoDB
### File: `proxy/collector.js` (loop utama)

Setelah data dari Netify masuk, setiap dokumen diberi **stempel `site_uuid`**
sebelum disimpan ke MongoDB.

**KODE ASLI — loop per site di collector.js:**
```javascript
// proxy/collector.js baris 123-222

// SITE_UUIDS diambil dari env:
// NETIFY_SITE_UUIDS="6681452d_..., 1959bb55_..."
const SITE_UUIDS = SITE_UUIDS_STR.split(','); // ["SIAB-UUID", "OFFICE-UUID"]

for (const siteUuid of SITE_UUIDS) {
//   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//   Loop: pertama SIAB, lalu Office (satu per satu)

  console.log(`Fetching agents for Site: ${siteUuid}`);
  const agents = await netify.fetchAgents(siteUuid);
  //                                      ^^^^^^^^^
  //  fetchAgents pakai siteUuid → Netify hanya beri agent milik site ini

  // --- PENTING: Anti-duplikat antar site ---
  // Kadang Netify bisa kembalikan agent yang sama untuk 2 site.
  // Di sini kita cegah agar 1 agent hanya masuk 1 site.
  const agents = rawAgents.filter(a => {
    if (processedAgentUuids.has(a.uuid)) {
      console.log(`Skipping ${a.uuid} — already assigned to another site.`);
      return false;  // lewati agent yang sudah diproses site lain
    }
    return true;
  });
  for (const agent of agents) processedAgentUuids.add(agent.uuid);

  // Simpan agent ke MongoDB dengan site_uuid
  await AgentRegistry.findOneAndUpdate(
    { uuid: agent.uuid },
    { $set: {
        uuid: agent.uuid,
        site_uuid: siteUuid,  // <--- stempel site di sini!
        ...
    }},
    { upsert: true }
  );

  // Kumpulkan data untuk setiap agent di site ini
  for (const agent of agents) {
    await collectForAgent(agent.uuid, timestamp, siteUuid);
    //                                           ^^^^^^^^^
    //   siteUuid terus dibawa ke setiap fungsi collect
  }
}
```

**KODE ASLI — cara flows disimpan dengan site_uuid:**
```javascript
// proxy/collectorHelperDpi2.js baris 88-98

const flowDocs = flows.map(f => ({
  timestamp,
  agent_uuid: agentUuid,   // siapa agent-nya
  site_uuid:  SITE_UUID,   // <--- data ini milik site mana! (SIAB atau Office)
  flow_id:    f.flow_id,
  src_ip:     f.src_ip,
  dst_ip:     f.dst_ip,
  download:   f.download,
  upload:     f.upload,
  // ...
}));

// Upsert ke MongoDB (tidak duplikat berdasarkan flow_id + agent_uuid)
await Flow.bulkWrite(flowDocs.map(f => ({
  updateOne: {
    filter: { flow_id: f.flow_id, agent_uuid: f.agent_uuid },
    update: { $set: f },
    upsert: true,
  }
})));
```

**Hasilnya di MongoDB — data terpisah per site:**
```
Collection: flows
┌────────────────────┬────────────────────────────────────────────────────┬────────┬──────────┐
│ flow_id            │ site_uuid                                          │ src_ip │ download │
├────────────────────┼────────────────────────────────────────────────────┼────────┼──────────┤
│ flow-001           │ 6681452d_9cae_4ff4_8ae8_0d504774265e  (SIAB)       │ 10.0.x │ 1234     │
│ flow-002           │ 6681452d_9cae_4ff4_8ae8_0d504774265e  (SIAB)       │ 10.0.x │ 5678     │
│ flow-003           │ 1959bb55_045b_47c7_bbdd_f33b7db197b9  (Office)     │ 192.168.x │ 9012  │
│ flow-004           │ 1959bb55_045b_47c7_bbdd_f33b7db197b9  (Office)     │ 192.168.x │ 3456  │
└────────────────────┴────────────────────────────────────────────────────┴────────┴──────────┘
                       ^^^^^^^^^^ Field ini yang memisahkan data ^^^^^^^^^^
```

**Semua collection lain juga sama:**
- `devices`   → tiap dokumen ada `site_uuid`
- `threats`   → tiap dokumen ada `site_uuid`
- `events`    → tiap dokumen ada `site_uuid`
- `summaries` → tiap dokumen ada `site_uuid`
- `telemetry` → tiap dokumen ada `site_uuid`

---

## LAPIS 3 — Saat Dashboard Baca dari MongoDB
### File: `backend/routes/dashboard/flows.js` (contoh)

Ketika user login sebagai admin SIAB dan buka halaman Flows,
backend hanya query dokumen dengan `site_uuid` yang sesuai:

```javascript
// backend/routes/dashboard/flows.js (contoh query)
const userSiteUuid = req.user.site_uuid;
// → "6681452d_9cae_4ff4_8ae8_0d504774265e" (SIAB)

const flows = await Flow.find({
  site_uuid: userSiteUuid,  // <--- hanya ambil data site ini!
  // ...filter waktu, pagination, dsb
}).limit(50);
```

Admin Office login → `site_uuid = 1959bb55_...` → hanya lihat data Office.
Admin SIAB login → `site_uuid = 6681452d_...` → hanya lihat data SIAB.
Super Admin → bisa pilih site mana yang ingin dilihat.

---

## RINGKASAN — Alur Lengkap Filter Data

```
Netify API
    |
    |-- Lapis 1: Header x-net-site dikirim ke Netify
    |   Netify hanya kirim data milik site tersebut
    |
    v
Proxy Server (setiap 5 menit)
    |
    |-- Lapis 2: Setiap dokumen diberi stempel site_uuid
    |   - SIAB data → { site_uuid: "6681452d_..." }
    |   - Office data → { site_uuid: "1959bb55_..." }
    |   - Anti-duplikat: 1 agent hanya masuk 1 site
    |
    v
MongoDB (semua data tercampur tapi ter-tag per site)
    |
    |-- Lapis 3: Backend query MongoDB dengan filter site_uuid
    |   - Admin SIAB login → WHERE site_uuid = SIAB-UUID
    |   - Admin Office login → WHERE site_uuid = OFFICE-UUID
    |
    v
Web Dashboard (tampil hanya data site yang sesuai)
```

---

## Skenario Konkret

**Skenario:** Network agent "F6-2V-DT-8A" ada di SIAB. Network agent "23-TE-6L-I2" ada di Office.

### Langkah 1 — Proxy request ke Netify
```
[Iter 1] siteUuid = "6681452d..." (SIAB)
  → GET /data/flows
    Header: x-net-site: 6681452d...
  → Netify kembalikan: flows dari F6-2V-DT-8A (agent SIAB)
  → Simpan ke MongoDB: { site_uuid: "6681452d...", agent_uuid: "F6-2V-DT-8A", flow_id: ... }

[Iter 2] siteUuid = "1959bb55..." (Office)
  → GET /data/flows
    Header: x-net-site: 1959bb55...
  → Netify kembalikan: flows dari 23-TE-6L-I2 (agent Office)
  → Simpan ke MongoDB: { site_uuid: "1959bb55...", agent_uuid: "23-TE-6L-I2", flow_id: ... }
```

### Langkah 2 — Dashboard tampilkan
```
User siab login:
  req.user.site_uuid = "6681452d..."
  DB query: Flow.find({ site_uuid: "6681452d..." })
  Hasil: hanya flow dari F6-2V-DT-8A ✓

User office login:
  req.user.site_uuid = "1959bb55..."
  DB query: Flow.find({ site_uuid: "1959bb55..." })
  Hasil: hanya flow dari 23-TE-6L-I2 ✓
```

**Data tidak pernah tercampur** karena ada 3 lapis isolasi ini.

---
*Dokumentasi teknis Source 2 — 29 Juli 2026*
