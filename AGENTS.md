<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Instructions

This is the authoritative rules file for any AI coding agent (Claude Code, Cursor,
GitHub Copilot, Aider, etc.) working in a project that uses this starter kit. Agents
that don't read AGENTS.md natively should be pointed at it via their own config file
— see `docs/vibe-coding/` for per-tool instructions. `CLAUDE.md` imports this file.

## 1. Trigger "e" or "enhance"

If the user types "e", "enhance", or requests an enhancement plan:
- Read `/plans/next-enhancements.md` to understand the current platform structure, history, and active tasks.
- Overwrite or update the active tasks list inside `/plans/next-enhancements.md`.
- The plan must cover each main section/module of the application.
- Inside the tasks list, define **exactly 3 new enhancements per section** with:
  1. A unique number (e.g., `1.1`, `1.2`, `1.3`, and so on).
  2. A clear, specific description of the functional change.
  3. A status (initially set to `[TODO]`).
- Present this plan to the user in your final summary response.
- Write an iteration log per §2b before finishing.

## 2. Trigger "n", "next", or "n{x}"

If the user types "n", "next", "n{x}" (where `{x}` is a positive integer), or requests execution of the next enhancement task(s):
- Read `/plans/next-enhancements.md` to check the status of tasks.
- If all tasks are `[DONE]` (or none are `[TODO]`), automatically run the **"e" / "enhance"** workflow first.
- Otherwise, do NOT execute any task directly. Instead, select the **top 3 priorities** from the `[TODO]` list, present them clearly to the user with a detailed rationale/reason for each, and ask the user to select which one to proceed with. Once the user approves a specific selection, execute it sequentially.

### 2a. Clarify before building ("Grill Me" step)

Before implementing a task, check whether its scope or acceptance criteria are
genuinely ambiguous (multiple valid interpretations, unspecified UI/data behavior,
no clear "done" condition). If so:
- Ask clarifying questions **one at a time** until the task is unambiguous — use
  your tool's native mechanism (e.g. Claude Code's `AskUserQuestion`) where available,
  otherwise ask inline and wait for the answer before continuing.
- Record the resolved acceptance criteria as a short 1-3 line note next to the task
  entry in `/plans/next-enhancements.md` before writing any code.
- Skip this step entirely when the task is already unambiguous — don't grill the
  user on obvious work.

- Implement the selected task(s) fully in the codebase, applying the relevant role(s)
  from `SKILLS.md` (Architect, Backend, Frontend, QA, Hardware/Compatibility).
- Once complete:
  1. Update the task's status in `/plans/next-enhancements.md` to `[DONE]`.
  2. Document the new/updated feature in `/docs/feature-list.md` under the right section heading.
- **Verify build integrity** — this is not just "it compiles and runs":
  - QA pass: exercise the golden path and edge cases; run/extend automated tests.
  - Hardware/Compatibility pass: check cross-platform, cross-browser, and resource
    (memory/CPU) assumptions per `SKILLS.md`.
- In your final response, state which task(s) were completed and the exact menu/navigation path to see the new feature.
- Write an iteration log per §2b before finishing — including when the task failed or was only partially completed.

### 2b. Iteration Log (`/docs/log/`)

Every run of "e"/"enhance" or "n"/"next"/"n{x}" must produce its own log file in
`/docs/log/`, in addition to (not instead of) the `/docs/feature-list.md` update
in §2. This is a running project diary for future agents and the user.

- **Filename**: `docs/log/<YYYY-MM-DD-HHmm>-<trigger>.md`, e.g.
  `docs/log/2026-07-08-1430-n2.md` (`trigger` is `e` or `n`/`n{x}`). One file per
  iteration — never overwrite a previous log.
- **Content** — factual and skimmable, bullet points over prose:
  - What was requested, and which task/section numbers (from
    `/plans/next-enhancements.md`) were touched.
  - Steps taken, in order — what was tried, including dead ends.
  - Outcome: what succeeded, what failed (with the actual error text), and how
    any failure was resolved (or wasn't).
  - Current state of the codebase/feature after this iteration.
  - Considerations for next time: open risks, deliberately deferred TODOs,
    assumptions made, anything a future agent should know before continuing.
- Mandatory even on failure or partial completion — log the failure and current
  state rather than skipping the log entry.

## 3. File Size & Refactoring Rules

- **256-line threshold**: any code/script file — new, modified, or pre-existing —
  that exceeds 256 lines of code must be split into smaller, modular, logical files.
  This is a repo-wide rule, not just for new work; if you touch a file over the
  threshold, split it as part of that change.
- **Why**: an agent reading a file spends its context budget parsing it before it can
  reason about the task. Small, single-purpose files keep that cost low and keep the
  agent's understanding accurate (see the "smart zone / dumb zone" problem — models
  reason worse as context fills up).
- This applies to AGENTS.md, CLAUDE.md, and SKILLS.md too: keep each under ~250 lines.
  Push detail into linked docs (`docs/`) rather than growing the root files.

## 4. Roles

Every implementation task should be viewed through the lens of the relevant role(s)
defined in `SKILLS.md`: Software Architect, Backend Engineer, Frontend Engineer,
QA/Test Engineer, and Hardware & Performance Compatibility Reviewer. A single agent
plays all roles in sequence unless the harness supports spawning role-specific
subagents (see `CLAUDE.md`).

## 5. Mockup Data & Demo/Live Mode

- Store all mock/sample data in `/data/mockup/` — keep it separate from UI components and styling.
- Provide a mock API layer that reads from `/data/mockup/` and mirrors the real backend contract.
- Add a switcher control (icon) in the UI to toggle **Demo** (mock API + mock data) and **Live** (real API + real data).

## 6. Cloud vs Local (On-Premise)

- Provide a setting to choose **Cloud** or **Local (on-premise)** deployment.
- **Cloud**: use remote/cloud-hosted API endpoints and services.
- **Local**: use on-premise/self-hosted API endpoints and services.
- Persist the selection and route all backend/service calls to the chosen environment.

## 7. Ad-hoc Feature Requests

For direct feature requests not using "e"/"n", implement the feature and document it in `/docs/feature-list.md`.

## 8. Realtime Data Requirement

- Wajib menggunakan data realtime. Jangan menggunakan data dummy, simulasi, dan palsu.

## 9. UI Layout & Fixed Sizes
- Page berisi 50 list data, kolom, baris wajib rapih dan memiliki ukuran tetap. Yang berbeda hanya isinya saja. Dilarang menggunakan slider ke samping. Slider hanya diperbolehkan untuk scroll kebawah. Data wajib rata tengah. Jika teks terlalu panjang, gunakan "..." diujung kata, dan tambahkan fitur ketika di hover ke message tersebut, akan menampilkan kalimat teks message lengkap

## 10. No Limits / Thresholds on Real Data
- Wajib menampilkan semua data real yang didapatkan. Jangan memberi batas, limit, atau threshold apapun. Data hanya bisa dibatasi melalui filter seperti filter rentang waktu data (sesuai input dari user dari frontend).

## 11. Dilarang Menggunakan kata "Netify"
- Dilarang menggunakan kata "Netify" atau hal-hal yang berkaitan dengan Netify. Ini merupakan branding dari BackOne - Deep Package Inspection dari perusahaan PT. Data Bisnis Solusi.

## 12. Format tulisan
- Wajib menggunakan bahasa (simbol/teks) yang jelas, mudah dipahami dan profesional. 
- Wajib menggunakan bahasa Inggris.
- Dilarang menyingkat kata, singkatan yang tidak umum atau tidak lazim. Contoh : "message" jangan disingkat menjadi "msg". Jika terpaksa maka kembali mengikuti aturan format bahasa pada rules nomor 9.

## 13. Penggunaan DataBase MongoDB
- Semua data yang tertampil wajib hanya menggunakan data yang ada di MongoDB  saja (1 sumber data).
- JANGAN MENGOPOI data dari mana pun, entah itu dari API Netify, atau sumber data lainnya.
- JIKA data di MongoDB tidak ada (0 atau 404), maka wajib menampilkan data tersebut di halaman aplikasi. Bukan data simulasi.
- Apabila tidak ada data yang tertampil, tampilkanlah "No Data" pada halaman aplikasi. Namun, jika ada data yang tertampil lebih dari 0, maka wajib menampilkan data tersebut di setiap tab halaman Web dashboard BackOne - Deep Package Inspection
- Dengan mematuhi rules ini, maka semua data pasti sama, sinkron, sesuai, tidak ada perbedaan, jelas.
- Database wajib diperbarui oleh proxy server setiap 5 menit sekali. Data wajib diperbarui, dilarang menduplikat data.

## 14. Peforma UI dan UX
- Wajib meningkatkan performa UI dan UX agar bisa memberikan rasa puas kepada pengguna dengan tampilan UI yang rapih, elegan, profesional, responsif, serta informatif
- Wajib memberikan UX yang memuaskan dengan menyajikan data yang jelas, sesuai, tidak membingungkan, dapat dibaca dan dipahami dengan baik.
- Dilarang membuat UI yang membingungkan, susah digunakan, atau tidak user-friendly
- Dilarang menampilkan data realtime/data asli yang duplikat (kecuali ada input filter dari user untuk menampilkan data berdasarkan kriteria tertentu).
- Wajib menampilkan data real dari MongoDB sesuai dengan kriteria tertentu dari input filter user.
- Jika memang data yang seharusnya ditampilkan lebih dari 20000, maka data cukup sampai 20000 saja (ini adalah batas/limit/threshold). Jika data yang ditampilkan lebih dari 50 data, wajib menerapkan pagination per setiap 50 data.

## 15. Skema, Alur Kerja, dan Struktural Dashboard BackOne DPI
- **Arsitektur Tiga Lapis (Three-Tier):**
  - **Proxy Server (Collector):** Mengambil data mentah dari API sensor DPI, memperkaya data, menghapus duplikasi (menggunakan `bulkWrite` upsert pada `flow_id` dan `agent_uuid`), membersihkan data flow mati (> 1 jam), lalu menyimpannya ke MongoDB.
  - **Database MongoDB (Single Source of Truth):** Penyimpanan terpusat untuk semua telemetri jaringan.
  - **Backend Server (Express):** Read-only layer yang memproses REST API dengan menyaring data berdasarkan `site_uuid` dan `agent_uuid` penyewa (tenant).
  - **Frontend (Next.js):** Visualisasi data interaktif, navigasi tab, dan pembatasan fungsionalitas berdasarkan hak akses user (RBAC).
- **Alur Kerja Pengambilan Data:**
  - Proxy melakukan update data database setiap 5 menit sekali secara unik dan efisien.
  - Backend melayani API frontend dengan kecepatan tinggi (< 10ms) karena membaca langsung data teragregasi yang sudah tersinkronisasi di MongoDB.
- **Struktur Direktori Utama:**
  - `/proxy/`: Pengumpul data latar belakang dan API Wrapper.
  - `/backend/`: Route REST API, database Schemas, dan model autentikasi user.
  - `/src/`: Kode client Next.js (pages, components, UI modals).

## 16. Perubahan FrontEnd
- Setiap perubahan yang dilakukan di salah satu bagian pada frontend, Wajib diterapkan juga pada setiap tab halaman lainnya (termasuk semua elemen, fungsi, fitur, komponen, pop-up yang relevan sesuai dengan "sesuatu" yang terjadi perubahan tersebut).
- Kecuali jika perubahan yang dilakukan khusus untuk tab halaman tersebut. 

## 17. MongoDB Capacity Output in Terminal
- Output terminal proxy server dan backend server wajib menampilkan kapasitas/space penyimpanan database MongoDB (data size dan storage size dalam MB) setiap kali berhasil terhubung atau setelah menyelesaikan siklus pengumpulan data.

## 18. Default Time Range Filter
- Default filter rentang waktu data di dashboard BackOne wajib diset ke "Last 24 Hours" ('1d'), dan opsi filter waktu "All" wajib dihapus dari seluruh halaman dashboard.

## 19. Data Retention Policy
- MongoDB hanya boleh menyimpan data maksimal hingga 7 hari yang lalu. Data yang lebih tua dari 7 hari wajib dihapus secara otomatis dan berkala untuk menjaga kapasitas database.

## 20. Waktu Tampilan Dashboard (Timezone Indonesia)
- Seluruh tampilan format waktu (tanggal dan jam) yang disajikan di web dashboard BackOne wajib disesuaikan dengan zona waktu lokal Indonesia (WIB, WITA, WIT) atau menggunakan zona waktu pengguna lokal Indonesia.