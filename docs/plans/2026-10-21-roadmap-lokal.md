# Plan: Roadmap jadi file lokal

**Tanggal:** 2026-10-21
**Status:** ✅ Selesai

## Tujuan

Roadmap (`docs/plans/2026-10-15-roadmap.md`), yang kini berisi juga jadwal harian, tidak masuk GitHub atas permintaan user. File tetap ada di laptop user.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Pilih lingkup: seluruh roadmap (bukan hanya jadwal) | User | – | ✅ |
| 2 | Lengkapi roadmap: status, perubahan setelah Fase 1, tahap dekat, jadwal harian, catatan untuk Fase 2–5 | Claude | `docs/plans/2026-10-15-roadmap.md` (lokal) | ✅ |
| 3 | Masukkan roadmap ke `.gitignore` dan berhenti melacaknya (`git rm --cached`, file lokal tidak dihapus) | Claude | `.gitignore` | ✅ |
| 4 | CLAUDE.md: roadmap disebut sebagai file lokal yang bisa tidak ada di clone baru | Claude | `CLAUDE.md` | ✅ |
| 5 | Commit + push | Claude | – | ✅ |

## Catatan

- Versi lama roadmap **tetap ada di riwayat git** (commit sebelum 2026-10-21). Menghapusnya dari riwayat butuh menulis ulang riwayat dan force-push; tidak dilakukan.
- Link ke roadmap di plan lama (M1–M10, perbaikan review) dibiarkan sebagai catatan sejarah. Di clone baru link itu tidak bisa dibuka.
