# Plan M2: Kerangka publik (header, footer, marquee, layout)

**Tanggal:** 2026-10-15
**Status:** ✅ Selesai
**Bagian dari:** [roadmap](2026-10-15-roadmap.md), Fase 1

## Tujuan

Bingkai yang sama untuk semua halaman publik, sesuai design.md bagian 3 (Header, Footer, Marquee, Section band).

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | `Container` (maks 1120px, gutter 16/24/32px) dan `SectionHeader` (eyebrow + judul + teks samping) | Claude | `components/layout/` | ✅ |
| 2 | Logo: kotak ink dengan monogram kuning "CH" + wordmark | Claude | `components/layout/logo.tsx` | ✅ |
| 3 | Header sticky: logo, nav (Latest, Categories, Authors, About), kotak cari (form GET ke `/search`, tetap jalan tanpa JS); di HP: ikon cari + tombol menu yang membuka sheet layar penuh (Esc menutup, fokus kembali ke tombol) | Claude | `components/layout/site-header.tsx`, `mobile-menu.tsx` | ✅ |
| 4 | Footer ink: wordmark raksasa, pill tautan, baris mono, tautan "Author log in" | Claude | `components/layout/site-footer.tsx` | ✅ |
| 5 | Marquee judul terbaru: animasi CSS, berhenti saat hover/fokus, `aria-hidden`, statis saat reduced motion | Claude | `components/layout/marquee.tsx`, `app/globals.css` | ✅ |
| 6 | `SectionBand`: latar penuh berwarna dengan garis ink atas-bawah | Claude | `components/layout/section-band.tsx` | ✅ |
| 7 | Layout `(public)` dan pindahkan beranda ke dalamnya | Claude | `app/(public)/layout.tsx`, `app/(public)/page.tsx` | ✅ |
| 8 | Test header, footer, menu HP, marquee. Test lama `page.test.tsx` diganti, karena beranda akan menjadi async Server Component yang tidak bisa dirender Vitest (dicek lewat Playwright di M10) | Claude | `__tests__/layout.test.tsx` | ✅ |
| 9 | Verifikasi + commit + push | Claude | – | ✅ |

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 28 test lulus (4 test baru: nav, form cari tanpa JS, menu HP + Esc, footer, marquee `aria-hidden` dan `tabindex=-1`) |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ |
| Tampilan 1280px dan 375px | ✅ Header sticky, kotak cari (desktop) atau ikon cari + menu (HP), marquee, footer dengan wordmark |

## Catatan

- `app/page.tsx` dipindah ke `app/(public)/page.tsx`, isinya sementara sampai M3.
- `__tests__/page.test.tsx` dihapus, karena beranda kini async Server Component. Pengecekannya lewat Playwright di M10.
- Tambahan di luar plan: tautan "Skip to content" untuk pengguna keyboard.
