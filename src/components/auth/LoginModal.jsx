import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Chrome, Lock, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const HINT_TEXT = {
  keranjang: 'untuk menambahkan produk ke keranjang',
  wishlist: 'untuk menyimpan produk ke wishlist',
  checkout: 'untuk melanjutkan ke halaman checkout',
};

export default function LoginModal() {
  const { loginModal, closeLoginModal, handleModalLoginSuccess, user } = useAuth();
  const { isOpen, onSuccess, hint } = loginModal;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-close if user becomes logged in (handles OAuth and edge cases)
  useEffect(() => {
    if (isOpen && user) {
      handleModalLoginSuccess(onSuccess);
    }
  }, [user, isOpen, handleModalLoginSuccess, onSuccess]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Email belum dikonfirmasi. Silakan cek inbox Anda.');
      } else if (error.message.includes('Invalid login')) {
        setError('Email atau password tidak valid.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      // Success — close and resume deferred action
      handleModalLoginSuccess(onSuccess);
      // Reset form for next use
      setEmail('');
      setPassword('');
      setError(null);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Note: Google OAuth will redirect, so no success callback here
  };

  const handleBackdropClick = (e) => {
    // Only close when the backdrop itself is clicked, not the card or any child
    if (e.target === e.currentTarget) closeLoginModal();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onMouseDown={handleBackdropClick}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'modalIn 0.2s ease-out' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary-dark px-6 pt-8 pb-10 text-white text-center relative">
          <button
            onClick={closeLoginModal}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Masuk ke Nayea.id</h2>
          {hint && HINT_TEXT[hint] && (
            <p className="text-white/80 text-sm mt-1">Login diperlukan {HINT_TEXT[hint]}.</p>
          )}
        </div>

        {/* Card body, overlapping header slightly */}
        <div className="px-6 pb-6 -mt-4">
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 shadow-sm mb-4"
            >
              <Chrome className="w-5 h-5 text-red-500" />
              Lanjutkan dengan Google
            </button>

            {/* Divider */}
            <div className="relative flex items-center mb-4">
              <div className="flex-1 border-t border-gray-200" />
              <span className="px-3 text-xs text-gray-400 font-medium">atau dengan email</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Memeriksa...' : 'Masuk'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Belum punya akun?{' '}
            <Link
              to="/register"
              onClick={closeLoginModal}
              className="font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
