import SEO from '../../components/SEO';

export default function TermsConditions() {
  return (
    <div className="bg-cream min-h-screen py-16 sm:py-24">
      <SEO title="Syarat & Ketentuan" description="Syarat dan ketentuan berbelanja di Nayea.id — pemesanan, pembayaran, pengiriman, dan kebijakan akun pengguna." />
      <div className="max-w-3xl mx-auto px-6 sm:px-8">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Legal</span>
        <h1 className="text-5xl sm:text-6xl font-black font-heading text-primary tracking-tighter italic uppercase mb-4">
          SYARAT &amp; KETENTUAN
        </h1>
        <p className="text-sm text-secondary font-medium mb-12">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="space-y-10 text-sm text-secondary font-medium leading-relaxed">
          <section>
            <h2 className="text-lg font-black font-heading text-primary uppercase italic mb-3">1. Penerimaan Ketentuan</h2>
            <p>Dengan mengakses dan berbelanja di Nayea.id, Anda dianggap menyetujui seluruh syarat dan ketentuan yang tertulis di halaman ini.</p>
          </section>

          <section>
            <h2 className="text-lg font-black font-heading text-primary uppercase italic mb-3">2. Pemesanan</h2>
            <p>Pesanan dianggap sah setelah pelanggan menyelesaikan proses checkout dan mengirimkan bukti transfer sesuai instruksi. Nayea.id berhak membatalkan pesanan apabila stok tidak tersedia atau pembayaran tidak dapat diverifikasi dalam waktu wajar.</p>
          </section>

          <section>
            <h2 className="text-lg font-black font-heading text-primary uppercase italic mb-3">3. Harga &amp; Pembayaran</h2>
            <p>Seluruh harga tercantum dalam Rupiah (Rp) dan sudah termasuk pajak yang berlaku, belum termasuk ongkos kirim. Pembayaran dilakukan melalui transfer bank manual yang dikonfirmasi lewat WhatsApp. Nayea.id berhak mengubah harga produk sewaktu-waktu tanpa pemberitahuan sebelumnya untuk pesanan yang belum dibuat.</p>
          </section>

          <section>
            <h2 className="text-lg font-black font-heading text-primary uppercase italic mb-3">4. Pengiriman</h2>
            <p>Estimasi waktu pengiriman bergantung pada kurir yang dipilih dan lokasi tujuan. Produk Pre-order memiliki waktu produksi tambahan sebagaimana tertulis di halaman produk masing-masing. Nayea.id tidak bertanggung jawab atas keterlambatan yang disebabkan oleh pihak jasa kirim.</p>
          </section>

          <section>
            <h2 className="text-lg font-black font-heading text-primary uppercase italic mb-3">5. Penukaran &amp; Pengembalian</h2>
            <p>Penukaran produk dapat diajukan maksimal 2x24 jam setelah barang diterima, dengan syarat produk belum dipakai/dicuci dan kemasan asli masih lengkap. Detail lengkap lihat halaman <a href="/shipping" className="text-primary hover:underline">Shipping &amp; Returns</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-black font-heading text-primary uppercase italic mb-3">6. Akun Pengguna</h2>
            <p>Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda. Nayea.id tidak bertanggung jawab atas kerugian akibat penyalahgunaan akun yang disebabkan kelalaian pengguna.</p>
          </section>

          <section>
            <h2 className="text-lg font-black font-heading text-primary uppercase italic mb-3">7. Perubahan Ketentuan</h2>
            <p>Nayea.id berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan berlaku sejak dipublikasikan di halaman ini.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
