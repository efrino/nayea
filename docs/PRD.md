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

| Token | Nilai | Peran |
|---|---|---|
| `--color-primary` | `#10B981` (emerald-500) | Warna utama brand: CTA, highlight, active state, badge harga |
| `--color-primary-light` | `#34D399` | Hover/lighter variant primary |
| `--color-primary-dark` | `#059669` | Gradient end, pressed state |
| `--color-accent` | `#6366F1` (indigo-500) | Aksen sekunder (jarang dipakai langsung, lebih untuk variasi gradient) |
| `--color-accent-light` | `#818CF8` | Lighter accent |
| Background dasar | `#FBFBFE` | Body background, hampir putih dengan sedikit tone dingin |
| Gray scale | Tailwind default `gray-*` | Teks, border, surface (`gray-900` untuk teks utama/dark section, `gray-400`/`gray-500` untuk teks sekunder) |
| Dark section | `gray-900` | Section kontras tinggi (newsletter, notifikasi) — selalu dipasangkan teks putih |
| Status warna | Tailwind semantic: `emerald-500` (success), `amber-600` (pre-order/warning), `red-*` (error/cancelled) | Konsisten pakai palet Tailwind bawaan untuk status, jangan bikin warna status baru |

**Shadow tokens:**
- `--shadow-premium`: `0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)` — untuk card premium/elevated.
- `--shadow-glass`: `0 8px 32px 0 rgba(31,38,135,0.07)` — dipakai bersama `.glass-effect` (blur + transparansi putih).

**Utility class turunan** (didefinisikan di `@layer utilities`, dipakai lintas halaman):
- `.glass-effect` — kartu/panel efek glassmorphism.
- `.gradient-primary` — gradient emerald untuk CTA utama.
- `.gradient-accent` — gradient indigo untuk aksen sekunder.
- `.text-gradient` — teks gradient primary→accent, dipakai terbatas untuk highlight kata kunci.

### 5.2 Tipografi

| Token | Font | Pemakaian |
|---|---|---|
| `--font-sans` | Inter (300–700) | Body text, paragraf, form, label |
| `--font-heading` | Outfit (300–700) | Semua `h1`–`h6` (di-apply global lewat `@layer base`) |

Font dimuat via Google Fonts `@import` di [src/index.css](../src/index.css) — kalau nambah font baru, tambahkan family + weight di `@import` yang sama, jangan bikin `<link>` terpisah di HTML.

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

- Palet warna (emerald primary + indigo accent) — dikonfirmasi dipertahankan, **tidak** diganti ke tema modest-fashion warna hangat (dusty rose/gold) meski itu sempat jadi opsi.
- Signature look "bold uppercase italic, radius besar" tetap dipakai untuk semua halaman baru storefront.
- Admin dashboard boleh lebih plain/fungsional, tidak wajib se-dekoratif storefront.
