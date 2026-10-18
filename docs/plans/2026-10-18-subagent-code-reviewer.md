# Plan: Subagent `code-reviewer`

**Tanggal:** 2026-10-18
**Status:** ✅ Selesai

## Tujuan

Subagent Claude Code bernama `code-reviewer`, disimpan di proyek, yang mereview perubahan kode dan mencari potensi bug sebelum commit.

## Rancangan (disetujui)

| Topik | Rancangan |
|-------|-----------|
| Lokasi | `.claude/agents/code-reviewer.md` (ikut di-commit, berlaku untuk siapa pun yang meng-clone repo) |
| Kapan dipakai | Otomatis setelah mengubah kode / sebelum commit (dicatat di CLAUDE.md, langkah 4), atau diminta langsung |
| Akses | **Hanya membaca**: Read, Grep, Glob, Bash (`git diff/show/status`, `npm test -- --run`, `tsc`, `lint`). Tidak boleh mengedit, memasang paket, commit, atau push |
| Checklist khusus proyek | Aturan domain, akses data lewat `lib/data/*`, jebakan Next 16 + Cache Components, batas server/client, aksesibilitas WCAG 2.1 AA, motion dan performa, lisensi gambar, keamanan, test |
| Hasil | Laporan bahasa Indonesia; temuan diurutkan Kritis → Tinggi → Sedang → Rendah, dengan `file:baris`, skenario gagal, saran perbaikan, dan tingkat keyakinan |
| Model | `inherit` (mengikuti sesi) |

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Konfirmasi rancangan | User | – | ✅ |
| 2 | Tulis definisi subagent | Claude | `.claude/agents/code-reviewer.md` | ✅ |
| 3 | Sebut subagent di CLAUDE.md (langkah 4 alur kerja) | Claude | `CLAUDE.md` | ✅ |
| 4 | Uji coba pada commit `2b3bdb6` | Claude | – | ✅ |
| 5 | Commit + push | Claude | – | ✅ |

## Hasil uji coba

Subagent baru terdaftar setelah sesi Claude Code dimulai ulang (`Agent type 'code-reviewer' not found` di sesi ini). Uji coba dijalankan dengan agent umum yang diperintahkan mengikuti `code-reviewer.md` persis.

- **Read-only terbukti:** `git status` setelah review hanya menunjukkan file dari plan ini.
- **Pemeriksaan yang dijalankan reviewer:** 86 test lulus, `tsc` bersih, `lint` bersih.

| # | Tingkat | Temuan | Lokasi | Keyakinan |
|---|---------|--------|--------|-----------|
| 1 | Tinggi | Baris pill topic kemungkinan tidak bisa di-drag dengan mouse: `<Link>` di `CategoryPill` tanpa `draggable={false}`, browser memulai drag link bawaan lalu `pointercancel`. Test E2E hanya mengecek URL, tidak mengecek baris bergeser | `components/ui/category-pill.tsx:35`, `components/home/topic-rows.tsx` | mungkin |
| 2 | Sedang | `touch-none` dan `cursor: grab` aktif juga di mode statis (reduced motion / gagal muat), sehingga swipe di atas kartu hero tidak menggulir halaman di HP | `components/physics/physics-pile.tsx:120` | yakin |
| 3 | Sedang | Kartu hero tersembunyi selama `pending`; boot menunggu `load` + `requestIdleCallback` tanpa timeout, fallback baru 6 s. Di HP lambat kartu bisa tidak terlihat beberapa detik | `physics-pile.tsx:71-73,101`, `app/globals.css` | mungkin |
| 4 | Rendah | `suppressClick` tidak direset setelah lemparan sentuh tanpa `click`, sehingga aktivasi Enter berikutnya bisa tertelan | `physics-pile.tsx:274,312`, `topic-rows.tsx:52,119` | yakin |
| 5 | Rendah | Koordinat drag meleset saat hero miring (`hero-tilt`), karena `getBoundingClientRect` membaca kotak hasil rotasi | `physics-pile.tsx:275-278`, `app/(public)/page.tsx:59` | mungkin |

## Tindak lanjut

- ~~Mulai ulang sesi~~ Sudah: `code-reviewer` kini terdaftar sebagai subagent.
- **Perbaikan temuan 1–5** di luar cakupan plan ini. Perlu plan terpisah dan persetujuan user.
