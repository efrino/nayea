import { MapPin, Phone, Mail, Instagram, MessageCircle } from 'lucide-react';
import SEO from '../../components/SEO';

export default function Contact() {
  return (
    <div className="bg-cream min-h-screen py-16 sm:py-24">
      <SEO title="Hubungi Kami" description="Hubungi Nayea.id lewat WhatsApp, email, Instagram, atau live chat untuk pertanyaan produk dan pesanan." />
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Get In Touch</span>
        <h1 className="text-5xl sm:text-6xl font-black font-heading text-primary tracking-tighter italic uppercase mb-12">
          CONTACT US
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-8 bg-cream rounded-[2.5rem] border border-oat flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/5 rounded-[1.2rem] flex items-center justify-center text-primary flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Alamat</h3>
              <p className="text-sm font-black text-primary">Tangerang, Indonesia</p>
            </div>
          </div>

          <div className="p-8 bg-cream rounded-[2.5rem] border border-oat flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/5 rounded-[1.2rem] flex items-center justify-center text-primary flex-shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">WhatsApp</h3>
              <a href="https://wa.me/6289653411226" target="_blank" rel="noopener noreferrer" className="text-sm font-black text-primary hover:text-accent transition-colors">+62 896 5341 1226</a>
            </div>
          </div>

          <div className="p-8 bg-cream rounded-[2.5rem] border border-oat flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/5 rounded-[1.2rem] flex items-center justify-center text-primary flex-shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Email</h3>
              <a href="mailto:nayeaofficial@gmail.com" className="text-sm font-black text-primary hover:text-accent transition-colors">nayeaofficial@gmail.com</a>
            </div>
          </div>

          <div className="p-8 bg-cream rounded-[2.5rem] border border-oat flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/5 rounded-[1.2rem] flex items-center justify-center text-primary flex-shrink-0">
              <Instagram className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Instagram</h3>
              <a href="https://instagram.com/nayea.id" target="_blank" rel="noopener noreferrer" className="text-sm font-black text-primary hover:text-accent transition-colors">@nayea.id</a>
            </div>
          </div>
        </div>

        <div className="mt-10 p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-[1.2rem] flex items-center justify-center text-primary flex-shrink-0 shadow-sm">
            <MessageCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-secondary font-medium leading-relaxed">
            Butuh respon cepat? Gunakan tombol <span className="font-black text-primary">live chat</span> di pojok kanan bawah layar —
            tim kami siap membantu selama jam operasional.
          </p>
        </div>
      </div>
    </div>
  );
}
