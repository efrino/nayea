import SEO from '../../components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="bg-white min-h-screen py-16 sm:py-24">
      <SEO title="Kebijakan Privasi" description="Kebijakan privasi Nayea.id — bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi pelanggan." />
      <div className="max-w-3xl mx-auto px-6 sm:px-8">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Legal</span>
        <h1 className="text-5xl sm:text-6xl font-black font-heading text-gray-900 tracking-tighter italic uppercase mb-4">
          KEBIJAKAN PRIVASI
        </h1>
        <p className="text-sm text-gray-400 font-medium mb-12">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="space-y-10 text-sm text-gray-600 font-medium leading-relaxed">
          <section>
            <h2 className="text-lg font-black font-heading text-gray-900 uppercase italic mb-3">1. Data yang Kami Kumpulkan</h2>
            <p>Saat Anda berbelanja atau mendaftar akun di Nayea.id, kami mengumpulkan data yang Anda berikan langsung: nama, alamat email, nomor WhatsApp, dan alamat pengiriman. Kami juga menyimpan riwayat pesanan dan produk yang Anda simpan ke wishlist.</p>
          </section>

          <section>
            <h2 className="text-lg font-black font-heading text-gray-900 uppercase italic mb-3">2. Bagaimana Data Digunakan</h2>
            <p>Data Anda digunakan semata-mata untuk memproses pesanan, menghitung ongkos kirim, menghubungi Anda terkait status pesanan (via WhatsApp/email), dan meningkatkan layanan live chat kami. Kami tidak menjual atau menyewakan data pribadi Anda ke pihak ketiga mana pun.</p>
          </section>

          <section>
            <h2 className="text-lg font-black font-heading text-gray-900 uppercase italic mb-3">3. Penyimpanan &amp; Keamanan</h2>
            <p>Data disimpan di infrastruktur Supabase dengan akses dibatasi lewat Row Level Security — akun Anda hanya bisa mengakses data milik Anda sendiri, dan tim internal kami hanya mengakses data pesanan untuk keperluan operasional (verifikasi pembayaran, pengiriman, dukungan pelanggan).</p>
          </section>

          <section>
            <h2 className="text-lg font-black font-heading text-gray-900 uppercase italic mb-3">4. Pihak Ketiga</h2>
            <p>Kami membagikan data seperlunya ke penyedia jasa pengiriman (untuk pengiriman paket) dan penyedia layanan autentikasi (Google, jika Anda login lewat Google). Kami tidak membagikan data Anda untuk tujuan pemasaran pihak ketiga.</p>
          </section>

          <section>
            <h2 className="text-lg font-black font-heading text-gray-900 uppercase italic mb-3">5. Hak Anda</h2>
            <p>Anda dapat melihat, mengubah, atau menghapus alamat tersimpan kapan saja lewat halaman Profil. Untuk permintaan penghapusan akun secara penuh, hubungi kami lewat live chat atau WhatsApp.</p>
          </section>

          <section>
            <h2 className="text-lg font-black font-heading text-gray-900 uppercase italic mb-3">6. Perubahan Kebijakan</h2>
            <p>Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan diinformasikan lewat halaman ini.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
