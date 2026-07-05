# Nayea — Software Requirements Specification (SRS)

Status: living document. Versi: 1.0 — 2026-07-05.

Dokumen ini menjelaskan requirement teknis Nayea. Untuk konteks bisnis, fitur, dan design system, lihat [PRD.md](PRD.md).

---

## 1. Arsitektur Sistem

```
┌─────────────────────┐        ┌──────────────────────┐
│  React SPA (Vite)   │──────▶│  Supabase              │
│  storefront + admin │        │  - Postgres (data)     │
└─────────┬───────────┘        │  - Auth (customer/admin)│
          │                    │  - Storage (produk/banner)│
          │                    │  - Realtime (chat)     │
          ▼                    └──────────────────────┘
┌─────────────────────┐
│ Vercel Serverless    │
│ api/shipping-cost.js │
│ api/shipping-dest.js │──────▶ Shipping provider API (ongkir)
└─────────────────────┘

Deployment: Vercel (frontend + api/ functions), lihat vercel.json
```

- **Frontend:** React 18 SPA, routing via `react-router-dom` v7, tidak ada SSR.
- **Backend-as-a-service:** Supabase — Postgres untuk data, Auth untuk login/register (email + OAuth), Storage untuk file gambar/video, Realtime untuk chat.
- **Serverless functions:** `api/shipping-cost.js` dan `api/shipping-destination.js` — proxy ke API ongkir eksternal, dijalankan di Vercel supaya API key provider ongkir tidak terekspos ke client bundle.
- **Edge Function tambahan:** `supabase/functions/shipping/` (Supabase Edge Function) — cek apakah ini alur alternatif/duplikat dari `api/shipping-*.js` sebelum menambah logic ongkir baru, supaya tidak ada dua sumber kebenaran untuk hal yang sama.

## 2. Data Model (Supabase Postgres)

Sumber kebenaran skema: [supabase/schema.sql](../supabase/schema.sql). Ringkasan tabel:

| Tabel | Keterangan |
|---|---|
| `products` | Produk: nama, deskripsi, harga, stok, `is_preorder`, `image_url`, `images[]`, `video_url`, `colors[]`, `material`, `weight` (gram, dipakai hitung ongkir) |
| `wishlists` | Relasi user↔produk, unique per pasangan |
| `cart_items` | Item keranjang per user, unique per (`user_id`, `product_id`, `selected_color`) |
| `orders` | Pesanan: data pelanggan, alamat, kurir, `shipping_cost`, `total_amount`, `status` (`pending`/`paid`/`shipped`/`cancelled`), `payment_method`, `payment_status` (`unpaid`/`pending_verification`/`paid`), `payment_proof_url` |
| `order_items` | Line item per order (produk, qty, harga saat order dibuat) |
| `banners` | Banner hero: judul, deskripsi, `image_url`, `link_url`, `active` |
| `messages` | Chat: `user_id`, `sender` (`customer`/`admin`), `text`, `status` (`sent`/`delivered`/`read`), realtime via `REPLICA IDENTITY FULL` |

Storage buckets: `products` (public read, admin write), `banners` (public read, authenticated write).

## 3. Model Otorisasi

- Role disimpan di `auth.users.raw_user_meta_data.role`, **bukan** kolom database terpisah.
- Trigger `on_auth_user_created` (lihat schema.sql) otomatis set role:
  - `admin` **hanya** jika email cocok dengan email admin yang di-hardcode di trigger (`efrinowep@gmail.com`).
  - Semua email lain dipaksa jadi `customer`, override apa pun yang dikirim client — mencegah user self-assign role admin.
- RLS (Row Level Security) aktif di semua tabel; setiap policy mengecek `auth.uid()` (kepemilikan data) atau `(auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'`.
- **Requirement:** setiap tabel baru wajib punya RLS + policy eksplisit sebelum dipakai di production — jangan andalkan `anon key` tanpa RLS.
- **Catatan keamanan yang perlu diperhatikan:** admin email untuk auto-assign role di-hardcode di function SQL. Kalau perlu tambah admin lain, harus lewat migrasi SQL manual (update trigger atau `raw_user_meta_data`), bukan lewat UI — pastikan proses ini terdokumentasi kalau ada admin kedua.

## 4. Functional Requirements

### FR-1 Storefront — Katalog & Produk
- FR-1.1 Sistem menampilkan daftar produk publik (tanpa login).
- FR-1.2 Detail produk menampilkan galeri (gambar + video), pilihan warna, harga, status stok/pre-order.
- FR-1.3 Produk dengan `is_preorder = true` ditandai visual berbeda (badge) dan tidak diperlakukan sama seperti stok reguler saat checkout (butuh konfirmasi alur pre-order jika ada perbedaan waktu kirim).

### FR-2 Storefront — Keranjang & Wishlist
- FR-2.1 Hanya user yang login (customer) dapat menambah item ke cart/wishlist (RLS enforced).
- FR-2.2 Kombinasi produk + warna yang sama tidak boleh duplikat di cart (unique constraint) — penambahan qty pada kombinasi yang sama harus increment, bukan insert baru.

### FR-3 Storefront — Checkout & Pembayaran
- FR-3.1 Checkout menghitung ongkir via `api/shipping-cost.js` berdasarkan berat total (`weight` per produk × qty) dan tujuan yang dipilih via `api/shipping-destination.js`.
- FR-3.2 Order boleh dibuat oleh guest (RLS `orders` insert `with check (true)`) — `user_id` opsional (nullable, `on delete set null`).
- FR-3.3 Pembayaran manual: customer upload bukti transfer (`payment_proof_url`), status awal `pending_verification`, admin yang mengubah ke `paid`.
- FR-3.4 Status order dan status pembayaran adalah dua field terpisah (`status` vs `payment_status`) — jangan digabung jadi satu state machine.

### FR-4 Live Chat
- FR-4.1 Customer login dapat mengirim pesan ke admin; admin dapat membalas ke customer tertentu.
- FR-4.2 Status pesan (`sent`→`delivered`→`read`) update realtime lewat Supabase Realtime (butuh `REPLICA IDENTITY FULL`, sudah diset).
- FR-4.3 Admin melihat daftar pesan lintas customer lewat RPC `get_chat_messages_with_users()` (join aman ke `auth.users` tanpa expose tabel auth langsung ke client).

### FR-5 Admin Dashboard
- FR-5.1 Semua route admin dilindungi oleh role check (`ProtectedRoute` + RLS di level DB sebagai lapisan kedua — jangan andalkan proteksi client-side saja).
- FR-5.2 Admin dapat CRUD produk, termasuk upload gambar (≤5MB, jpeg/png/webp/gif) dan video (≤50MB, mp4/webm/quicktime) — validasi tipe & ukuran dilakukan di client (`src/services/api.js`) **dan** harus tetap divalidasi lagi di sisi Storage policy/edge function untuk kasus bypass client.
- FR-5.3 Admin dapat mengubah status order dan payment_status.
- FR-5.4 Admin dapat CRUD banner (aktif/nonaktif menentukan tampil di homepage hero).

### FR-6 Autentikasi
- FR-6.1 Login/register email password + OAuth (callback ditangani `src/pages/auth/AuthCallback.jsx`).
- FR-6.2 Setelah login sukses, redirect ke halaman asal dengan flag sukses (lihat pola `?login=success` di `Home.jsx`).

## 5. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| **Performance** | Halaman storefront harus tetap terasa cepat di koneksi mobile (mayoritas traffic diasumsikan HP) — hindari bundle besar tak perlu, lazy-load gambar/video berat di luar viewport awal. |
| **Security** | Tidak ada service-role key Supabase di client bundle — hanya `anon key`. Semua akses privileged (admin) harus lewat RLS + role check, bukan hanya UI hiding. Secret provider ongkir hanya di server (`api/*.js`), tidak pernah di `VITE_*` env var. |
| **Availability** | Bergantung pada uptime Supabase + Vercel — tidak ada requirement HA custom saat ini (skala bisnis kecil-menengah). |
| **Data integrity** | Constraint unik (cart per warna, wishlist per produk) dan foreign key `on delete cascade`/`restrict` dijaga di level DB, bukan hanya di aplikasi. |
| **Konsistensi visual** | Semua fitur baru harus mengikuti token & pattern di [PRD.md § Design System](PRD.md#5-design-system) — ini requirement, bukan saran, supaya brand terasa konsisten lintas halaman. |
| **Realtime** | Fitur chat wajib tetap realtime (Supabase channel subscription) — regresi ke polling tidak diterima kecuali ada alasan kuat yang didiskusikan dulu. |

## 6. Environment & Konfigurasi

Lihat [.env.example](../.env.example) untuk daftar variabel publik (`VITE_*`). Variabel privat (kredensial provider ongkir, dsb.) hidup di `.env`/`.env.local` lokal dan environment variables Vercel — **tidak pernah** ditambahkan ke `VITE_*` karena prefix itu di-bundle ke client.

## 7. Out of Scope (saat ini)

- Payment gateway otomatis.
- Multi-seller/marketplace.
- Aplikasi mobile native.
- Automated testing suite (belum ada test runner terpasang di `package.json` — kalau menambah test, diskusikan dulu framework yang dipakai: Vitest paling natural untuk stack Vite ini).
