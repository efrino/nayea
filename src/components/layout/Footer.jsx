import { Link } from 'react-router-dom';
import { Instagram, MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-oat pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-5">
            <h3 className="text-2xl font-black font-heading text-primary tracking-tighter italic uppercase">
              NAYEA<span className="text-primary not-italic">.</span>ID
            </h3>
            <p className="text-secondary text-sm font-medium leading-relaxed">
              Premium quality kerudung and modest fashion. Direct to you.
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="https://instagram.com/nayea.id" className="p-3 bg-cream text-secondary hover:text-primary hover:bg-primary/10 rounded-2xl transition-all">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] italic mb-6">Shop</h4>
            <ul className="space-y-4 text-sm font-bold text-secondary">
              <li><Link to="/catalog" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link to="/catalog?filter=new" className="hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link to="/catalog?filter=preorder" className="hover:text-primary transition-colors">Pre-order</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] italic mb-6">Support</h4>
            <ul className="space-y-4 text-sm font-bold text-secondary">
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/shipping" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] italic mb-6">Contact</h4>
            <ul className="space-y-4 text-sm font-bold text-secondary">
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <span>Jakarta, Indonesia</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary" />
                <span>+62 812 3456 7890</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary" />
                <span>hello@nayea.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-oat mt-14 pt-8 flex flex-col md:flex-row gap-4 justify-between items-center text-[10px] font-black text-secondary-light uppercase tracking-widest italic">
          <p>&copy; {new Date().getFullYear()} Nayea.id. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">Kebijakan Privasi</Link>
            <Link to="/terms-conditions" className="hover:text-primary transition-colors">Syarat &amp; Ketentuan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
