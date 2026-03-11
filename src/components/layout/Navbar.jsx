import { Link } from 'react-router-dom';
import { Search, Menu, ShoppingBag, User, LogOut } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { getCartCount } = useCart();
  const { session, user, logout } = useAuth();
  const cartCount = getCartCount();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary tracking-tight">
              nayea.id
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary font-medium transition-colors">Home</Link>
            <Link to="/catalog" className="text-gray-700 hover:text-primary font-medium transition-colors">Catalog</Link>
            <Link to="/about" className="text-gray-700 hover:text-primary font-medium transition-colors">About Us</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            {session && (
              <Link to="/admin" className="hidden md:inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-primary bg-primary-50 hover:bg-primary-100 transition-colors">
                Admin Portal
              </Link>
            )}
            <button className="p-2 text-gray-500 hover:text-primary transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link to="/cart" className="p-2 text-gray-500 hover:text-primary transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Customer Authentication */}
            {user ? (
              <div className="hidden md:flex items-center space-x-3 ml-2 border-l border-gray-200 pl-4">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-1 text-gray-400" />
                  {user.user_metadata?.full_name || 'Customer'}
                </span>
                <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3 ml-2 border-l border-gray-200 pl-4">
                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                  Login
                </Link>
                <Link to="/register" className="text-sm font-medium text-white bg-primary px-4 py-2 rounded-full hover:bg-primary-dark transition-colors">
                  Daftar
                </Link>
              </div>
            )}
            <button className="md:hidden p-2 text-gray-500 hover:text-primary">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
