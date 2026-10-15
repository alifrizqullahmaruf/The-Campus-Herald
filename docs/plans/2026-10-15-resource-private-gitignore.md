# Plan: Abaikan folder `resource_private/` dan pindahkan spesifikasi ke `docs/`

**Tanggal:** 2026-10-15
**Status:** ✅ Selesai

## Tujuan

`resource_private/` berisi bahan referensi pribadi user: rekaman video template Framer "Crumpet Riot" (349 MB) sebagai inspirasi UI. Folder ini harus diabaikan git, karena ukuran video juga melebihi batas 100 MB GitHub.

Spesifikasi `The Campus Herald.md` sempat dipindahkan user ke folder tersebut. Supaya spesifikasi tidak ikut hilang dari repo, file itu dipindahkan ke `docs/`.

## Keputusan

| Topik | Keputusan |
|-------|-----------|
| Lokasi spesifikasi | `docs/the-campus-herald.md`, tetap ter-commit |
| Isi `resource_private/` | Hanya bahan pribadi, tidak pernah di-commit |
| Template "Crumpet Riot" | Baru dijelaskan di chat, belum ditulis ke tahap 07. User riset UI/UX dulu |

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Tentukan lokasi spesifikasi | User | – | ✅ |
| 2 | Tambah `/resource_private/` ke `.gitignore` | Claude | `.gitignore` | ✅ |
| 3 | Pindahkan spesifikasi (versi 15 Okt) ke `docs/the-campus-herald.md` | Claude | `docs/the-campus-herald.md` | ✅ |
| 4 | Perbarui rujukan spesifikasi dan jelaskan `resource_private/` | Claude | `CLAUDE.md` | ✅ |
| 5 | Simpan plan ini | Claude | file ini | ✅ |
| 6 | Verifikasi | Claude | – | ✅ |
| 7 | Commit + push | Claude | – | ✅ |

## File yang berubah

- `.gitignore`: aturan baru `/resource_private/` di bawah bagian `# misc`
- `The Campus Herald.md` → `docs/the-campus-herald.md`: dipindahkan (git mencatat rename). Satu-satunya perbedaan dengan versi sebelumnya adalah tanggal di header (14 → 15 Oktober 2026)
- `CLAUDE.md`: rujukan ke `docs/the-campus-herald.md` dan catatan tentang `resource_private/`

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `git check-ignore -v resource_private/record.m4.mp4` | ✅ `.gitignore:28:/resource_private/` |
| `git status --short` | ✅ `resource_private/` tidak muncul. Spesifikasi tercatat sebagai rename `R "The Campus Herald.md" -> docs/the-campus-herald.md` |
| Test, lint, build | Tidak dijalankan, karena tidak ada perubahan kode |

## Tindak lanjut

- Tahap 07 (UI/UX) di spesifikasi: tulis keputusan desain setelah riset, dengan "Crumpet Riot" sebagai salah satu referensi. Bagian yang di luar scope SRS (newsletter, polling, surat pembaca, pitch) tidak dipakai.
