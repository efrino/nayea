# Nayea — Product Requirements Document & Source of Truth

Status: living document. Versi: 1.0 — 2026-07-05.

Dokumen ini adalah **acuan tunggal** untuk identitas brand, fitur produk, dan design system Nayea. Setiap perubahan visual, copy, atau fitur baru harus konsisten dengan yang tertulis di sini. Kalau ada kebutuhan yang memaksa menyimpang, update dokumen ini dulu (jangan biarkan kode dan dokumen menyimpang diam-diam).

---

## 1. Brand & Business Context

- **Nama brand:** Nayea (nayea.id)
- **Kategori bisnis:** E-commerce kerudung / modest fashion untuk wanita muslimah.
- **Positioning:** Premium, editorial, bold — bukan toko kerudung generik. Visual terasa seperti fashion label modern, bukan marketplace biasa.
- **Target pelanggan:** Wanita muslimah usia ~18–40, belanja online, peduli kualitas bahan dan tampilan foto produk, terbiasa dengan UX e-commerce modern (Shopee/Zalora-level expectation, tapi dengan sentuhan butik).
- **Model bisnis:** Direct-to-consumer, satu toko/brand (bukan marketplace multi-seller). Ada 1 admin/owner yang mengelola produk, pesanan, pembayaran manual (transfer bank), dan banner promosi.
- **Kanal:** Storefront web (mobile-first, banyak pelanggan akses via HP) + admin dashboard untuk operasional harian.

## 2. Goals

1. Storefront yang terasa premium dan bikin percaya (trust) meski pembayaran manual (bank transfer) — bukan otomatis via payment gateway.
2. Proses belanja singkat: lihat produk → keranjang/wishlist → checkout dengan ongkir akurat → upload bukti transfer.
3. Admin bisa mengelola produk, pesanan, pembayaran, banner, dan membalas chat pelanggan tanpa perlu tools eksternal.
4. Semua halaman baru harus terasa "satu keluarga visual" dengan halaman yang sudah ada — tidak ada style yang menyimpang sendiri-sendiri.

## 3. Non-Goals (saat ini)

- Multi-seller / marketplace.
- Payment gateway otomatis (Midtrans/Xendit dll) — saat ini transfer manual + upload bukti + verifikasi admin.
- Aplikasi mobile native.
- Multi-bahasa (saat ini Bahasa Indonesia untuk harga/ongkir, tapi label UI banyak yang bahasa Inggris — lihat catatan tone of voice di bawah).

## 4. Fitur Produk (ringkas)

### Storefront (customer-facing)
- **Home** — hero banner (gambar/video, auto-rotate), featured products, value proposition, newsletter signup.
- **Catalog** — daftar produk, filter/browse.
- **Product Detail** — galeri gambar/video, pilihan warna, deskripsi, harga, tambah ke keranjang/wishlist.
- **Cart** — kelola item keranjang per user (per kombinasi produk + warna).
- **Checkout** — input data pengiriman, hitung ongkir (integrasi API ongkir), pilih metode bayar, upload bukti transfer.
- **Wishlist** — simpan produk favorit per user.
- **Auth** — login/register customer (Supabase Auth, termasuk OAuth callback), role otomatis `customer` kecuali email admin terdaftar.
- **Live Chat** — widget chat customer ↔ admin, realtime, dengan status pesan (sent/delivered/read).

### Admin Dashboard
- **Dashboard** — ringkasan/statistik operasional.
- **Products** — CRUD produk (gambar, video, warna, material, berat untuk ongkir, status pre-order).
- **Orders** — kelola status pesanan (`pending` → `paid` → `shipped`, atau `cancelled`).
- **Payments** — verifikasi bukti transfer, update `payment_status`.
- **Banners** — kelola banner hero (gambar/video, judul, deskripsi, link, aktif/nonaktif).
- **Chat** — balas pesan customer secara realtime.

---

## 5. Design System

Semua token warna/font didefinisikan sebagai CSS variable Tailwind v4 di [src/index.css](../src/index.css) (`@theme` block). **Jangan hardcode hex code baru di komponen** — tambahkan/reuse token di sana.

### 5.1 Palet Warna

Versi 2 (rebrand — lihat [§6](#6-keputusan-desain-yang-sudah-final-jangan-diubah-tanpa-diskusi-ulang)): tema hangat terinspirasi Ikebana, menggantikan tema emerald/indigo versi awal.

| Token | Nilai | Peran |
|---|---|---|
| `--color-primary` | `#4A3525` (Deep Warm Brown) | Teks utama, heading, tombol CTA penting, elemen penegas |
| `--color-primary-light` | `#6F5643` | Hover/lighter variant primary |
| `--color-primary-dark` | `#2E1F15` | Gradient end, pressed state, dark section (newsletter, toast, modal header) |
| `--color-secondary` | `#9E8476` (Taupe / Muted Rose) | Sub-heading, teks sekunder/muted, aksen border |
| `--color-secondary-light` | `#B7A79A` | Teks tersier/disabled, placeholder |
| `--color-accent` | `#A3B19B` (Soft Sage Green) | Tombol CTA sekunder, badge promo — terinspirasi elemen daun/bunga |
| `--color-accent-light` | `#C0CBB9` | Lighter accent |
| `--color-cream` | `#F4EFEA` (Warm Cream/Beige) | Background dasar body & halaman — pengganti putih polos |
| `--color-oat` | `#E3DAC9` (Almond/Oat) | Background section kedua (pembeda antar section), border halus |
| Surface/card | `white` | Card & panel yang "mengambang" di atas background cream/oat (product card, modal, navbar, footer) — **tetap putih**, jangan diganti cream, supaya ada kontras elevasi |
| Status warna | Tailwind semantic: `emerald-500` (success/stok tersedia), `amber-600` (pre-order/warning), `rose-500`/`red-*` (error/habis/cancelled) | **Di luar brand palette** — dipertahankan apa adanya di seluruh app (termasuk admin) karena maknanya universal (hijau=oke, merah=masalah). Jangan diganti ke sage/brown walau secara warna mirip. |

**Cakupan rebrand:** token di atas + semua pemakaian `gray-*` Tailwind di komponen **storefront** (`src/pages/storefront/`, `src/components/layout/`, `src/components/auth/`, `src/components/chat/`, halaman auth/404) sudah dikonversi ke token warna baru. **Admin dashboard** (`src/pages/admin/`, `AdminLayout.jsx`) sengaja **tidak** direbrand — tetap pakai `gray-*` netral sesuai keputusan lama bahwa admin boleh lebih plain/fungsional (lihat [§6](#6-keputusan-desain-yang-sudah-final-jangan-diubah-tanpa-diskusi-ulang)).

**Mapping gray→warna baru yang dipakai** (referensi kalau nambah kode baru di storefront):
| Gray lama | Token baru | Alasan |
|---|---|---|
| `gray-900`, `gray-800` | `primary` | Teks utama/heading, dark section |
| `gray-700`–`gray-400` | `secondary` | Teks sekunder/muted |
| `gray-300` | `secondary-light` | Placeholder, disabled, ikon tersier |
| `gray-200`, `gray-100` | `oat` | Border halus, divider |
| `gray-50` | `cream` | Section background kedua |
| `white` (card/panel) | `white` (tidak berubah) | Surface elevasi di atas cream/oat |

**Shadow tokens:**
- `--shadow-premium`: `0 10px 25px -5px rgba(74,53,37,0.08), 0 8px 10px -6px rgba(74,53,37,0.06)` — untuk card premium/elevated (tint brown, bukan hitam netral).
- `--shadow-glass`: `0 8px 32px 0 rgba(74,53,37,0.07)` — dipakai bersama `.glass-effect`.

**Utility class turunan** (didefinisikan di `@layer utilities`, dipakai lintas halaman):
- `.glass-effect` — kartu/panel efek glassmorphism.
- `.gradient-primary` — gradient brown (primary→primary-dark) untuk CTA utama.
- `.gradient-accent` — gradient sage (accent→accent-light) untuk aksen sekunder.
- `.text-gradient` — teks gradient primary→accent, dipakai terbatas untuk highlight kata kunci.

### 5.2 Tipografi

| Token | Font | Pemakaian |
|---|---|---|
| `--font-sans` | Montserrat (300–800), fallback Inter | Body text, paragraf, form, label |
| `--font-heading` | Playfair Display (serif, ital+400–900) | Semua `h1`–`h6` (di-apply global lewat `@layer base`) — kesan anggun/majalah fashion high-end |

Font dimuat via Google Fonts `@import` di [src/index.css](../src/index.css) — kalau nambah font baru, tambahkan family + weight di `@import` yang sama, jangan bikin `<link>` terpisah di HTML.

Alternatif yang dipertimbangkan tapi tidak dipakai (catat di sini kalau suatu saat mau eksperimen ulang): heading `Cormorant Garamond` (lebih ramping/puitis) + body `Lato`/`Open Sans`.

**Gaya heading khas Nayea** (harus konsisten di semua halaman baru):
- Bold maksimal: `font-black`
- Uppercase + italic untuk headline besar (hero, section title)
- `tracking-tighter` untuk heading besar, `tracking-[0.2em]`–`tracking-[0.5em]` untuk label kecil/eyebrow text
- Ukuran heading hero: `text-5xl md:text-8xl`; section title: `text-4xl sm:text-6xl`
- Eyebrow/label kecil di atas heading: `text-[10px] font-black uppercase tracking-[0.4em] italic`, warna `text-primary`

### 5.3 Spacing & Layout

- Container utama: `max-w-7xl mx-auto px-6 sm:px-8`
- Section vertical padding: `py-24 sm:py-32` untuk section besar, `py-24` untuk section sekunder
- Grid produk: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8`

### 5.4 Radius & Shape

Nayea pakai radius **besar dan generous** — ini bagian dari signature look, jangan turunkan ke radius kecil (`rounded-md`/`rounded-lg`) di komponen baru kecuali elemen kecil (ikon button, badge).

| Ukuran elemen | Radius |
|---|---|
| Card produk / panel besar | `rounded-[2.5rem]` – `rounded-[4rem]` |
| Gambar dalam card | `rounded-[2rem]` |
| Tombol CTA besar | `rounded-[1.5rem]` – `rounded-[1.8rem]` |
| Badge/pill kecil | `rounded-full` atau `rounded-2xl` |
| Input form | `rounded-[1.2rem]`+ mengikuti container-nya |

### 5.5 Motion

- Framer Motion + Tailwind `animate-in` (fade-in, slide-in) untuk entrance halaman/hero.
- Hover state: `hover:-translate-y-2`, `hover:shadow-xl`, `group-hover:scale-110` pada gambar produk (zoom halus).
- Transisi standar: `transition-all duration-500` untuk hover card, `duration-700` untuk image zoom, `duration-1000` untuk background/banner crossfade.
- Tombol aktif: selalu `active:scale-95` (atau `active:scale-90` untuk tombol icon kecil) supaya terasa "tactile".

### 5.6 Tone of Voice & Copy Style

- Label CTA & eyebrow text: **UPPERCASE, singkat, tegas** — contoh: "SHOP THE LOOK", "NEW ARRIVAL 2026", "FEATURED COLLECTION".
- Campuran Bahasa Inggris (untuk label/CTA fashion-editorial) + Bahasa Indonesia (untuk data transaksional: harga "Rp", status pesanan, form checkout). Ini pola yang sudah berjalan — pertahankan, jangan mix satu kalimat jadi dua bahasa sekaligus.
- Harga selalu format `Rp {angka.toLocaleString('id-ID')}` — jangan pakai `$` atau format lain.
- Hindari nada terlalu "jualan keras"/hard-sell berlebihan; gaya yang dipakai lebih ke editorial fashion brand (calm confidence), bukan gaya toko diskon.

### 5.7 Komponen kunci yang jadi rujukan pattern

Kalau bikin komponen baru, contek pattern dari:
- [src/pages/storefront/Home.jsx](../src/pages/storefront/Home.jsx) — hero banner, card produk, section value prop, newsletter, toast notifikasi.
- [src/components/layout/Navbar.jsx](../src/components/layout/Navbar.jsx) & [Footer.jsx](../src/components/layout/Footer.jsx) — struktur navigasi storefront.
- [src/components/layout/AdminLayout.jsx](../src/components/layout/AdminLayout.jsx) — struktur layout admin (biasanya lebih fungsional/plain dibanding storefront, tidak perlu se-"editorial" storefront).

## 6. Keputusan desain yang sudah final (jangan diubah tanpa diskusi ulang)

- **[Update]** Palet warna direbrand total ke tema hangat Ikebana-inspired (Deep Warm Brown primary, Taupe secondary, Soft Sage Green accent, Cream/Oat background) + tipografi Playfair Display (heading) & Montserrat (body). Ini menggantikan keputusan lama "emerald primary + indigo accent" yang sebelumnya tercatat final di sini — jangan bingung kalau lihat referensi lama ke warna emerald/indigo di commit history, itu sudah tidak berlaku.
- Rebrand warna **hanya mencakup storefront**, admin dashboard sengaja dibiarkan pakai gray-scale netral Tailwind biasa (lihat §5.1).
- Warna status (emerald=sukses, amber=warning, rose/red=error) **bukan** bagian dari brand palette dan dipertahankan di seluruh app termasuk admin — jangan diganti ke sage/brown.
- Signature look "bold uppercase italic, radius besar" tetap dipakai untuk semua halaman baru storefront.
- Admin dashboard boleh lebih plain/fungsional, tidak wajib se-dekoratif storefront.
