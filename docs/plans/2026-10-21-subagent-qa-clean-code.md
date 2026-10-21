# Plan: Subagent `qa-tester` dan `clean-code`

**Tanggal:** 2026-10-21
**Status:** ✅ Selesai

## Tujuan

Dua subagent baru di samping `code-reviewer`, supaya kualitas terjaga saat Fase 2–5 menambah fitur. Susunan disetujui user (2026-10-21).

## Hasil

| | `code-reviewer` (sudah ada) | `qa-tester` (baru) | `clean-code` (baru) |
|---|---|---|---|
| Fokus | Bug di perubahan kode | Frontend dari sisi pengguna: black box + gray box, HP dan desktop | Kerapian kode tanpa mengubah perilaku |
| Boleh mengubah | Tidak | Hanya `e2e/` dan `__tests__/`, dan hanya kalau ada plan yang disetujui; tanpa plan cukup melapor | Kode aplikasi, hanya item yang disetujui user |
| Kalau menemukan bug | Melapor | Melapor dengan test yang gagal (`test.fail` / `test.fails`); tidak menambal kode aplikasi | Berhenti dan melapor |
| Larangan | Edit, install, commit, push | Install, commit, push, mengubah kode/konfigurasi, perintah git yang membuang perubahan | Install, commit, push, mengubah konfigurasi, mengubah test agar lulus, perintah git yang membuang perubahan |
| Bukti | Laporan | Test baru + seluruh suite dijalankan (cek dulu tidak ada server lama di port 3200) | Unit, lint, tsc, build, E2E tetap lulus (cek port 3200 juga) |

`clean-code` bekerja dua langkah: **mode usul** (read-only, hasilnya masuk plan) → **mode kerjakan** (setelah user setuju).

CLAUDE.md: tabel "Subagents", dan alur kerja langkah 4 kini berurutan `qa-tester` (kalau ada di plan) → `code-reviewer` terakhir, supaya test baru ikut direview.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui susunan | User | – | ✅ |
| 2 | Konfirmasi plan | User | – | ✅ |
| 3 | Definisi `qa-tester` | Claude | `.claude/agents/qa-tester.md` (baru) | ✅ |
| 4 | Definisi `clean-code` | Claude | `.claude/agents/clean-code.md` (baru) | ✅ |
| 5 | CLAUDE.md: tabel subagent + urutan di langkah 4 | Claude | `CLAUDE.md` | ✅ |
| 6 | Cek terdaftar | Claude | – | ✅ Keduanya langsung tersedia sebagai tipe agent, tanpa memulai ulang sesi |
| 7 | Commit + push | Claude | – | ✅ |

## Review `code-reviewer`

Temuan yang menyangkut subagent, semuanya diperbaiki:

| Tingkat | Temuan | Perbaikan |
|---------|--------|-----------|
| Sedang | "Revert" di `clean-code` bisa membuang perubahan user yang belum di-commit | Kedua agen: batalkan hanya edit sendiri dengan Edit; dilarang `git checkout/restore/reset/stash/clean` |
| Rendah | Urutan QA vs review tidak jelas; QA bisa menulis file tanpa plan | Langkah 4 CLAUDE.md diberi urutan; `qa-tester` hanya melapor tanpa plan yang disetujui |
| Rendah | E2E bisa menguji build lama (`reuseExistingServer`) | Kedua agen mengecek port 3200 sebelum `npm run test:e2e` |

## Tindak lanjut

- Tugas pertama: `qa-tester` menyelidiki `flows.spec.ts` yang kadang gagal; `clean-code` (mode usul) mulai dari dashboard yang membaca `lib/mock` langsung. Masing-masing lewat plan sendiri (jadwal Kamis 22 Okt).
