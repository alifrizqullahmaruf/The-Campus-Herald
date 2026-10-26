# Plan: Agent, alur kerja, dan test dibuat lebih sederhana

**Tanggal:** 2026-10-26
**Status:** ✅ Selesai

## Masalah

User merasa agent dan prosesnya terlalu ribet. Yang dipilih untuk disederhanakan: **isi file agent**, **alur kerjanya**, dan **sistem test known-bugs**. Laporan agent tidak dipilih, tapi ikut lebih pendek karena isi file agent dipendekkan.

## Rancangan

### 1. Isi file agent (`.claude/agents/*.md`)

Sekarang 50–60 baris per file. Jadi **±20 baris**: peran, boleh mengubah apa, 3–5 langkah, format laporan pendek. Aturan keamanan inti tetap ada.

| Agent | Tetap ada | Dibuang |
|-------|-----------|---------|
| `code-reviewer` | Hanya membaca; cek bug, aturan domain, keamanan, aksesibilitas; laporan per tingkat keparahan | Checklist panjang per topik (dirangkum jadi satu daftar pendek), bagian "yang sudah dicek dan aman" |
| `qa-tester` | Uji di HP dan desktop; hanya menulis di `e2e/` dan `__tests__/`; bug dilaporkan, tidak ditambal | Daftar alur yang sangat rinci, aturan port dan build yang panjang (cukup satu baris) |
| `clean-code` | Usul dulu, kerjakan setelah disetujui, tanpa mengubah perilaku, semua test tetap lulus | Urutan prioritas panjang, contoh-contoh |
| Semua | Dilarang commit, push, install paket, dan perintah git yang membuang perubahan | – |

Laporan: maksimal ±10 poin, hanya temuan nyata dan langkah perbaikannya.

### 2. Alur kerja (CLAUDE.md langkah 4)

| Sekarang | Jadi |
|----------|------|
| Setiap perubahan: test + lint + build, lalu `qa-tester` (kalau ada di plan), lalu `code-reviewer`, perbaiki, sering review ulang | Test + lint + build, lalu **`code-reviewer` sekali** sebelum commit. Perbaiki Kritis/Tinggi/Sedang; Rendah boleh dicatat sebagai tindak lanjut. Review ulang hanya kalau perbaikannya besar |
| `qa-tester` dipakai otomatis untuk perubahan halaman | `qa-tester` **hanya kalau user minta** atau sebelum rilis |
| `clean-code` sebelum fase baru | Sama, tapi hanya kalau user minta |

### 3. Sistem test known-bugs

Daftar `e2e/known-bugs.ts` sekarang **kosong** (semua bug responsif sudah diperbaiki), tapi mekanismenya masih membuat setiap test bercabang ("kalau bug masih ada… kalau tidak…").

| Sekarang | Jadi |
|----------|------|
| `e2e/known-bugs.ts` + fungsi `isOpen` / `stillOpen` / `expectOnlyKnown`, setiap test punya dua cabang | File dihapus. Setiap test hanya memeriksa perilaku yang benar |
| Bug baru dicatat di registry | Bug baru: test-nya dilewati **hanya di ukuran yang terkena** dengan `test.fixme(project === "…", "R-…")` (fitur standar Playwright), dan dicatat di plan |

Isi pemeriksaannya tidak berubah: overflow di 6 ukuran, judul terpotong, axe, menu, dashboard, dan lain-lain tetap dites.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Konfirmasi plan | User | – | ✅ |
| 2 | Pendekkan ketiga file agent | Claude | `.claude/agents/code-reviewer.md`, `qa-tester.md`, `clean-code.md` | ✅ ±150 → 50 baris total |
| 3 | Sederhanakan alur kerja dan tabel subagent | Claude | `CLAUDE.md` | ✅ |
| 4 | Hapus sistem known-bugs; test hanya cek perilaku benar | Claude | `e2e/known-bugs.ts` (hapus), `e2e/responsive.spec.ts`, `e2e/layout.ts` | ✅ spec 527 → 439 baris, `known-bugs.ts` (66 baris) dihapus |
| 5 | Verifikasi: semua test tetap lulus (jumlah pemeriksaan sama), `code-reviewer` sekali | Claude | – | ✅ |
| 6 | Commit + push | Claude | – | ✅ |


## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| Unit, lint, tsc, build | ✅ 93 unit lulus |
| E2E | ✅ **484/484**, jumlah sama seperti sebelumnya (tidak ada pemeriksaan yang hilang) |
| `code-reviewer` (sekali) | Test tidak ada yang melemah. Diperbaiki: dua batasan yang hilang di `qa-tester` (hanya dengan plan yang disetujui; jangan melemahkan/menghapus test); `test.fixme()` hanya di ukuran yang terkena; `code-reviewer` juga membaca perubahan staged dan file baru; `clean-code` berhenti kalau item membesar dan mengosongkan port 3200 sebelum E2E |
