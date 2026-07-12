import { Truck, PackageCheck, RotateCcw } from 'lucide-react';
import SEO from '../../components/SEO';

export default function Shipping() {
  return (
    <div className="bg-cream min-h-screen py-16 sm:py-24">
      <SEO title="Pengiriman & Pengembalian" description="Info pengiriman, estimasi produk pre-order, dan kebijakan penukaran/pengembalian barang di Nayea.id." />
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Support</span>
        <h1 className="text-5xl sm:text-6xl font-black font-heading text-primary tracking-tighter italic uppercase mb-12">
          SHIPPING &amp; RETURNS
        </h1>

        <div className="space-y-6">
          <div className="p-8 bg-cream rounded-[2.5rem] border border-oat">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/5 rounded-[1.2rem] flex items-center justify-center text-primary">
                <Truck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black font-heading uppercase italic tracking-tight">Pengiriman</h2>
            </div>
            <p className="text-sm text-secondary font-medium leading-relaxed">
              Ongkos kirim dihitung otomatis saat checkout berdasarkan berat produk dan lokasi tujuan,
              menggunakan beberapa pilihan kurir terpercaya. Pesanan reguler diproses 1-2 hari kerja
              setelah pembayaran dikonfirmasi admin.
            </p>
          </div>

          <div className="p-8 bg-cream rounded-[2.5rem] border border-oat">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/5 rounded-[1.2rem] flex items-center justify-center text-primary">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black font-heading uppercase italic tracking-tight">Produk Pre-order</h2>
            </div>
            <p className="text-sm text-secondary font-medium leading-relaxed">
              Produk dengan label Pre-order membutuhkan waktu produksi/pengadaan tambahan sebelum dikirim.
              Estimasi waktu kirim untuk setiap produk pre-order tertera di halaman detail produknya.
            </p>
          </div>

          <div className="p-8 bg-cream rounded-[2.5rem] border border-oat">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/5 rounded-[1.2rem] flex items-center justify-center text-primary">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black font-heading uppercase italic tracking-tight">Penukaran &amp; Pengembalian</h2>
            </div>
            <p className="text-sm text-secondary font-medium leading-relaxed">
              Penukaran produk (ukuran/warna) dapat diajukan maksimal 2x24 jam setelah barang diterima,
              selama produk belum dipakai atau dicuci dan kemasan asli masih lengkap. Hubungi kami lewat
              live chat atau WhatsApp untuk memulai proses penukaran.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
