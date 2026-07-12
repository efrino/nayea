import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SEO from '../../components/SEO';

const FAQS = [
  {
    q: 'Bagaimana cara melakukan pembayaran?',
    a: 'Saat ini pembayaran dilakukan lewat transfer bank manual. Setelah checkout, kamu akan menerima detail rekening dan diminta mengunggah bukti transfer untuk kami verifikasi.',
  },
  {
    q: 'Berapa lama pesanan diproses dan dikirim?',
    a: 'Pesanan reguler diproses 1-2 hari kerja setelah pembayaran dikonfirmasi. Produk pre-order memiliki estimasi waktu kirim yang lebih panjang, tertera di halaman detail produk masing-masing.',
  },
  {
    q: 'Apa itu produk Pre-order?',
    a: 'Produk dengan label Pre-order dibuat atau didatangkan setelah pesanan masuk, sehingga waktu kirimnya lebih lama dibanding produk ready stock. Detail estimasi tersedia di halaman produk.',
  },
  {
    q: 'Bisakah saya menukar atau mengembalikan produk?',
    a: 'Bisa, selama produk belum dipakai/dicuci dan pengajuan dilakukan maksimal 2x24 jam setelah barang diterima. Hubungi kami lewat live chat atau WhatsApp untuk proses penukaran.',
  },
  {
    q: 'Bagaimana cara melacak pesanan saya?',
    a: 'Setelah pesanan dikirim, admin akan membagikan nomor resi lewat WhatsApp atau live chat yang bisa kamu lacak langsung di website kurir terkait.',
  },
];

export default function Faq() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="bg-cream min-h-screen py-16 sm:py-24">
      <SEO title="FAQ" description="Pertanyaan yang sering ditanyakan seputar pembayaran, pengiriman, produk pre-order, dan penukaran di Nayea.id." />
      <div className="max-w-3xl mx-auto px-6 sm:px-8">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Support</span>
        <h1 className="text-5xl sm:text-6xl font-black font-heading text-primary tracking-tighter italic uppercase mb-12">
          FAQ
        </h1>

        <div className="space-y-4">
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="bg-cream rounded-[1.8rem] border border-oat overflow-hidden">
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full flex items-center justify-between gap-4 px-6 sm:px-8 py-5 text-left"
                >
                  <span className="font-black text-primary uppercase tracking-tight italic text-sm">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-primary flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <p className="px-6 sm:px-8 pb-6 text-sm text-secondary font-medium leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
