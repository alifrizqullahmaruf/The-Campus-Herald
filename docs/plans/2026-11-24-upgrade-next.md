# Upgrade Next.js 16.4.3 → 16.4.6 (keamanan)

**Status:** Selesai 2026-11-24 (hari cadangan Fase 4, Sel 24 Nov; user memilih upgrade ini).

## Tujuan

`next build` 16.4.3 memperingatkan celah keamanan yang diketahui dan menyarankan 16.4.6; peringatan itu menghentikan run pertama build pada hari 6 dan 7. `next` dan `eslint-config-next` dinaikkan ke patch 16.4.6 tanpa mengubah perilaku app.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | `next` dan `eslint-config-next` → `16.4.6` (versi tetap) | Claude | `package.json`, `package-lock.json` | ✅ |
| 2 | Cek docs bawaan yang berubah (`node_modules/next/dist/docs/`) | Claude | – | ✅ |
| 3 | Verifikasi penuh | Claude | – | ✅ |
| 4 | `code-reviewer`, plan, roadmap, commit dan push | Claude | plan ini, plan fase 4, roadmap lokal | ✅ |

## File yang berubah

- `package.json`, `package-lock.json`: hanya `next`, `@next/env`, `eslint-config-next`, `@next/eslint-plugin-next` dan 8 paket `@next/swc-*`.
- `docs/plans/2026-11-17-fase-4-alur-kerja.md`: Sel 24 Nov dipakai untuk upgrade ini.
- `CLAUDE.md` tidak diubah (hanya menyebut "Next.js 16.4").

## Docs bawaan yang berubah

Sebagian besar perbaikan kalimat. Yang relevan, dan tidak memerlukan perubahan kode:

- `"use cache"` dan `"use server"` tidak berlaku di Proxy; `cacheLife`/`cacheTag` melempar error di sana. `proxy.ts` hanya mengimpor `lib/auth/session-token`.
- File `"use server"` hanya boleh mengekspor fungsi; file `lib/**/*actions.ts` hanya menambahkan ekspor tipe.
- Flag yang dihapus (`experimental.viewTransition`, `experimental.appNewScrollHandler`) tidak dipakai di `next.config.ts`.
- `preserving-ui-state`: `getByLabel`/`getByPlaceholder` bisa menemukan elemen tersembunyi, sejalan dengan aturan E2E di `CLAUDE.md`.

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm audit --omit=dev` | ✅ 0 celah |
| `npm test -- --run` | ✅ 256/256 |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ lolos pada run pertama, tanpa peringatan keamanan; status rute sama seperti sebelumnya (artikel, beranda, topik ○; `/api/views/[id]` ƒ) |
| `npx playwright test` penuh | 555 lolos, 1 gagal: "Ctrl+K opens quick search", yang sudah diketahui gagal sejak `f34fe0d` |
| `code-reviewer` | Tidak ada temuan Kritis, Tinggi atau Sedang (lockfile bersih, semua dari registry npm) |

## Di luar cakupan / tindak lanjut

- React tetap 19.3.0 (19.3.1 tersedia, tetapi tidak diminta build atau audit).
- Test Ctrl+K yang flaky tetap menjadi tindak lanjut.
