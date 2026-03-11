import { Link } from 'react-router-dom';
import { Instagram, MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-primary tracking-tight">nayea.id</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Premium quality kerudung and modest fashion. Direct to you.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="https://instagram.com/nayea.id" className="p-2 bg-gray-50 text-gray-500 hover:text-primary hover:bg-green-50 rounded-full transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-6">Shop</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/catalog" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link to="/catalog?filter=new" className="hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link to="/catalog?filter=preorder" className="hover:text-primary transition-colors">Pre-order</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/shipping" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <span>Jakarta, Indonesia</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>+62 812 3456 7890</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span>hello@nayea.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Nayea.id. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
