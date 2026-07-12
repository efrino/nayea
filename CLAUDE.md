# CLAUDE.md — Nayea

Panduan kerja untuk Claude Code di repo ini. Baca ini dulu sebelum mengerjakan task apa pun.

## Dokumen rujukan wajib

- **[docs/PRD.md](docs/PRD.md)** — Source of Truth: identitas brand, design system (warna, font, spacing, komponen), tone of voice, fitur produk. **Semua perubahan UI/UX/copy harus konsisten dengan file ini.**
- **[docs/SRS.md](docs/SRS.md)** — Software Requirements Specification: arsitektur teknis, data model, requirement fungsional/non-fungsional per modul.

Jika ada instruksi user yang bertentangan dengan kedua dokumen ini, tanyakan dulu apakah dokumennya perlu diupdate — jangan diam-diam menyimpang.

## Ringkasan proyek

Nayea adalah storefront e-commerce untuk bisnis kerudung/modest fashion. Single Page App React + Vite di frontend, Supabase (Postgres + Auth + Storage + Realtime) sebagai backend, dengan beberapa serverless function di Vercel untuk ongkir.

## Stack

- React 18 + Vite, React Router v7
- Tailwind CSS v4 (`@theme` di [src/index.css](src/index.css) — **ini source tunggal untuk token warna/font**, jangan hardcode hex baru di komponen)
- Supabase JS client ([src/lib/supabase.js](src/lib/supabase.js))
- Framer Motion, lucide-react untuk ikon
- Vercel serverless functions di `api/` untuk shipping cost & destination

## Struktur folder

```
src/
  components/
    auth/       — LoginModal, ProtectedRoute
    chat/       — ChatWidget (live chat customer <-> admin)
    layout/     — Navbar, Footer, StoreLayout, AdminLayout
  context/      — React context providers
  lib/          — supabase client init
  pages/
    admin/      — Dashboard, Products, Orders, Payments, Banners, Chat, Login
    auth/       — AuthCallback (OAuth redirect handler)
    storefront/ — Home, Catalog, ProductDetail, Cart, Checkout, Wishlist, StoreLogin/Register
  services/     — api.js (Supabase queries), shipping.js
api/            — Vercel serverless functions (shipping-cost.js, shipping-destination.js)
supabase/       — schema.sql (tables + RLS policies), functions/shipping (Edge Function)
```

## Konvensi kode

- Komponen `.jsx`, functional components + hooks. Tidak ada TypeScript di project ini — jangan perkenalkan `.tsx` tanpa diskusi dulu.
- Styling: Tailwind utility classes langsung di JSX. Warna/font harus lewat token di `@theme` ([src/index.css](src/index.css)), bukan hex literal.
- Signature visual brand saat ini: heading besar bold-black italic uppercase, tracking lebar, radius besar (`rounded-[2rem]`+), shadow lembut. Lihat detail lengkap di [docs/PRD.md](docs/PRD.md#design-system).
- Role user (`customer` / `admin` / `superadmin`) di-enforce lewat Supabase `auth.jwt() -> user_metadata ->> role`, bukan lewat field terpisah — lihat trigger `on_auth_user_created` di [supabase/schema.sql](supabase/schema.sql). Ada tepat satu `superadmin` (email di-hardcode di trigger); satu-satunya beda dari `admin` biasa adalah akses ke halaman Manajemen User (`/admin/users`). Cek role lewat helper [src/lib/roles.js](src/lib/roles.js) (`isStaff`, `isSuperAdmin`) — jangan bandingkan string `'admin'` manual, supaya `superadmin` tidak ketinggalan saat pengecekan baru ditambahkan.
- Jangan commit perubahan skema tanpa update `supabase/schema.sql` — itu source of truth untuk struktur DB & RLS.

## Environment variables (jangan pernah commit isinya)

File `.env`, `.env.local`, `supabase/.env` sudah di-`.gitignore`. Variabel yang dipakai:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — lihat [.env.example](.env.example)
- `SUPABASE_SERVICE_ROLE_KEY` — **jangan pernah** prefix `VITE_` (bakal ke-bundle ke client). Dipakai server-side saja di `api/admin-list-users.js` dan `api/admin-set-role.js` untuk fitur Manajemen User (superadmin-only).
- `RESEND_API_KEY` — server-only, dipakai di `api/send-order-confirmation.js` dan `api/send-shipping-notification.js`. Opsional: kalau kosong, kedua endpoint itu no-op (`sent:false`) alih-alih error, jadi email notifikasi sifatnya opt-in.
- Kredensial shipping API (RajaOngkir/sejenis) dipakai di `api/shipping-*.js` — cek `.env` lokal, jangan expose ke client bundle.
- `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY` — client-side, dipakai di [src/lib/googleDrivePicker.js](src/lib/googleDrivePicker.js) untuk tombol "Import Drive" di Admin Products/Banners. Public identifier (bukan secret) yang dibatasi lewat authorized origin di Google Cloud Console, aman di-bundle ke client. Opsional: kalau kosong, tombolnya nampilin error "belum dikonfigurasi" alih-alih crash.

Kalau menambah env var baru: tambahkan juga ke `.env.example` (tanpa isi asli) supaya orang lain tahu apa yang dibutuhkan.

## .gitignore — yang sudah dikecualikan

```
logs, *.log, npm-debug.log*, yarn-debug.log*, yarn-error.log*, pnpm-debug.log*, lerna-debug.log*
node_modules
dist, dist-ssr
*.local
.vscode/* (kecuali extensions.json)
.idea, .DS_Store, *.suo, *.ntvs*, *.njsproj, *.sln, *.sw?
.vercel
.env
.env*.local
supabase/.env
!.env.example
```

Catatan: `.env` dan `supabase/.env` sekarang di-ignore (sebelumnya sempat ter-commit ke git berisi secret asli — sudah di-`git rm --cached` dan key yang bocor harus dirotasi). `.env.example` sengaja tetap di-track (lihat `!.env.example`) sebagai referensi variabel yang dibutuhkan, tanpa isi asli.

## Perintah

```
npm run dev       # Vite dev server
npm run build      # production build
npm run preview    # preview build hasil
npm run lint       # eslint
```

## Sebelum bilang selesai untuk perubahan UI

Jalankan dev server dan cek beneran di browser (golden path + edge case) sebelum melaporkan task selesai — jangan hanya andalkan lint/build hijau.
