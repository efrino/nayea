import { Package, Sparkles, Heart } from 'lucide-react';
import SEO from '../../components/SEO';

export default function About() {
  return (
    <div className="bg-cream min-h-screen py-16 sm:py-24">
      <SEO title="Tentang Kami" description="Kenali Nayea.id — brand kerudung dan modest fashion premium yang mengutamakan kualitas bahan dan kenyamanan untuk perempuan modern." />
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Our Story</span>
        <h1 className="text-5xl sm:text-7xl font-black font-heading text-primary tracking-tighter italic uppercase leading-[0.95] mb-10">
          ABOUT NAYEA
        </h1>

        <div className="space-y-6 text-secondary font-medium leading-relaxed text-base sm:text-lg max-w-2xl">
          <p>
            Nayea lahir dari keinginan sederhana: menghadirkan kerudung dan modest fashion
            berkualitas premium yang membuat setiap perempuan merasa percaya diri, anggun,
            dan tetap nyaman sepanjang hari.
          </p>
          <p>
            Setiap koleksi kami dipilih dan dikurasi dengan detail — mulai dari pemilihan bahan,
            jahitan, hingga warna — supaya bukan cuma cantik difoto, tapi juga enak dipakai
            untuk aktivitas sehari-hari maupun momen spesial.
          </p>
          <p>
            Kami adalah brand direct-to-consumer: tidak ada perantara, produk dikirim langsung
            dari kami ke rumahmu, dengan layanan yang personal lewat live chat setiap saat kamu butuh bantuan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
          {[
            { icon: Sparkles, title: 'CURATED PIECES', desc: 'Setiap produk dipilih langsung, bukan sekadar ikut tren.' },
            { icon: Package, title: 'PREMIUM MATERIAL', desc: 'Bahan berkualitas untuk kenyamanan sepanjang hari.' },
            { icon: Heart, title: 'MADE WITH CARE', desc: 'Dari kurasi produk sampai layanan pelanggan.' },
          ].map((item, i) => (
            <div key={i} className="p-8 bg-cream rounded-[2.5rem] border border-oat">
              <div className="w-14 h-14 bg-primary/5 rounded-[1.2rem] flex items-center justify-center text-primary mb-5">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black font-heading tracking-tight italic uppercase mb-2">{item.title}</h3>
              <p className="text-sm text-secondary font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
