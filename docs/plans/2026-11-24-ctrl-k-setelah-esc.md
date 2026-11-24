# Ctrl+K tepat setelah Esc tidak membuka quick search

**Status:** Selesai 2026-11-24 (sisa hari cadangan; user memilih "Perbaiki test Ctrl+K").

## Masalah

Test E2E "Ctrl+K opens quick search" sering gagal sejak `f34fe0d` (6 dari 8 run hari ini). Penyelidikan (MutationObserver dan log event di browser):

- Esc menutup `<dialog>` seketika, tetapi event `close`-nya baru tiba 100–250 ms kemudian.
- Selama itu `CommandPaletteTrigger` masih menganggap palet terbuka, jadi Ctrl+K berikutnya diabaikan (`setOpen(true)` tidak mengubah apa pun).
- Lalu event `close` yang terlambat memanggil `onClose`, dan palet dilepas.

Jadi ini bug kecil di app, bukan hanya di test: orang yang menekan Ctrl+K segera setelah Esc kehilangan tekanan itu.

## Perbaikan

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Palet memberi tahu trigger saat itu juga: Esc lewat `onCancel`; tombol Esc, klik backdrop, membuka hasil dan "All results" lewat satu fungsi `close()`; event `close` tetap sebagai cadangan | Claude | `components/search/command-palette.tsx` | ✅ |
| 2 | Trigger: `close()` aman dipanggil dua kali; tiap pembukaan dapat `key` baru (penghitung di ref), jadi tutup lalu buka dalam satu render tetap memasang dialog baru; fokus dikembalikan lewat effect setelah palet dilepas | Claude | `components/search/command-palette-trigger.tsx` | ✅ |
| 3 | Unit test: Ctrl+K tepat setelah Esc / tombol tutup membuka lagi, dan event `close` dialog lama yang terlambat tidak menutup yang baru; fokus kembali setelah Esc | Claude | `__tests__/search.test.tsx` | ✅ |
| 4 | Test E2E tidak diubah (memang menguji ini) | Claude | – | ✅ |
| 5 | Verifikasi, `code-reviewer`, plan, commit dan push | Claude | plan ini, plan fase 4, roadmap lokal | ✅ |

**Perubahan dari rencana:** penghitung `key` per pembukaan ditambahkan, untuk berjaga kalau tutup dan buka lagi masuk satu render.

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| Test unit baru dengan kode lama | ❌ 2 gagal (bug terbukti) |
| `npm test -- --run` | ✅ 259/259 |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | ✅ |
| Ctrl+K dan Esc E2E, `--repeat-each 10` | ✅ 22/22 (sebelumnya gagal 6 dari 8) |
| `npx playwright test` penuh | ✅ 556 lolos, 0 gagal |
| `code-reviewer` | Tidak ada Kritis, Tinggi atau Sedang. Dua Rendah diperbaiki: `vi.restoreAllMocks()` pindah ke `afterEach`; test pengembalian fokus ditambahkan |

## Tindak lanjut

Tidak ada.
