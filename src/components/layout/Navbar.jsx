import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, ShoppingBag, User, LogOut, Heart, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getWishlists } from '../../services/api';

export default function Navbar() {
  const { getCartCount } = useCart();
  const { session, user, logout } = useAuth();
  const cartCount = getCartCount();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchWishlists() {
      if (user) {
        const { data } = await getWishlists(user.id);
        setWishlistCount(data?.length || 0);
      } else {
        setWishlistCount(0);
      }
    }

    fetchWishlists();

    const handleWishlistUpdate = () => fetchWishlists();
    window.addEventListener('wishlist_updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist_updated', handleWishlistUpdate);
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-3xl font-black font-heading text-gray-900 tracking-tighter italic uppercase">
              NAYEA<span className="text-primary not-italic">.</span>ID
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-10">
            <Link to="/" className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-all">Home</Link>
            <Link to="/catalog" className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-all">Catalog</Link>
            <Link to="/about" className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-all">About Us</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {session?.user?.user_metadata?.role === 'admin' && (
              <Link to="/admin" className="hidden lg:inline-flex items-center px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/10 transition-all border border-primary/10">
                Admin Portal
              </Link>
            )}

            <div className="flex items-center gap-1 sm:gap-2">
              <Link to="/wishlist" className="p-2.5 text-gray-400 hover:text-rose-500 transition-all relative group" title="Wishlist">
                <Heart className="w-5 h-5 group-hover:fill-current" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-black leading-none text-white bg-rose-500 rounded-full ring-2 ring-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link to="/cart" className="p-2.5 text-gray-400 hover:text-primary transition-all relative group" title="Keranjang">
                <ShoppingBag className="w-5 h-5 group-hover:fill-current" />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-black leading-none text-white bg-primary rounded-full ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Customer Authentication (Desktop) */}
            {user ? (
              <div className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-gray-100">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter italic">{user.user_metadata?.full_name || 'Customer'}</span>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.1em]">Verified Account</span>
                </div>
                <button onClick={logout} className="p-2.5 bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-gray-100">
                <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-all">
                  Login
                </Link>
                <Link to="/register" className="gradient-primary text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl hover:shadow-xl hover:shadow-primary/20 transition-all">
                  Sign Up
                </Link>
              </div>
            )}

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden p-3 bg-gray-50 rounded-2xl text-gray-900 hover:bg-gray-100 transition-all border border-gray-100 active:scale-90"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMenuOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-500 p-8 flex flex-col">
            <div className="flex justify-between items-center mb-12">
              <span className="text-2xl font-black font-heading text-gray-900 italic uppercase tracking-tighter">NAYEA<span className="text-primary not-italic">.</span>ID</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 active:scale-90 transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex flex-col gap-6 flex-1">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-black font-heading text-gray-900 italic tracking-tight hover:text-primary transition-colors">HOME</Link>
              <Link to="/catalog" onClick={() => setIsMenuOpen(false)} className="text-xl font-black font-heading text-gray-900 italic tracking-tight hover:text-primary transition-colors">CATALOG</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-xl font-black font-heading text-gray-900 italic tracking-tight hover:text-primary transition-colors">ABOUT US</Link>
              <div className="mt-4 pt-8 border-t border-gray-50 flex flex-col gap-4">
                 {user ? (
                   <>
                      <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
                         <p className="text-lg font-black font-heading text-gray-900 tracking-tight italic uppercase">{user.user_metadata?.full_name}</p>
                      </div>
                      <button onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full py-4 bg-rose-50 text-rose-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all">LOGOUT ACCOUNT</button>
                   </>
                 ) : (
                   <>
                      <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-4 bg-gray-50 text-gray-900 rounded-[1.5rem] text-center font-black text-xs uppercase tracking-widest transition-all">LOGIN</Link>
                      <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full py-4 gradient-primary text-white rounded-[1.5rem] text-center font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all">GET STARTED</Link>
                   </>
                 )}
              </div>
            </div>

            <div className="pt-8 border-t border-gray-50">
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] italic text-center">Nayea Official Store</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
