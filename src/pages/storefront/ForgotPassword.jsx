import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSendLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/" className="group flex flex-col items-center">
            <div className="w-16 h-16 gradient-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
              {sent ? <Mail className="w-8 h-8 text-white" /> : <ShoppingBag className="w-8 h-8 text-white" />}
            </div>
            <span className="mt-4 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Nayea.id</span>
          </Link>
        </div>
        <h2 className="text-center text-4xl font-black font-heading text-gray-900 tracking-tighter italic uppercase">
          {sent ? 'Cek Email Anda' : 'Lupa Password?'}
        </h2>
        <p className="mt-4 text-center text-xs font-black text-gray-400 uppercase tracking-widest italic">
          {sent ? 'Klik link reset password yang kami kirim' : 'Kami akan kirimkan link reset password ke email Anda'}
        </p>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-10 px-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] rounded-[3rem] border border-gray-100 sm:px-12">
          {sent ? (
            <div className="text-center space-y-6">
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-2xl text-left">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic leading-relaxed">
                  Link reset password telah dikirim ke <span className="not-italic">{email}</span>. Cek juga folder spam kalau belum masuk dalam beberapa menit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors"
              >
                Salah email? Kirim ulang
              </button>
            </div>
          ) : (
            <form className="space-y-8" onSubmit={handleSendLink}>
              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-2xl">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest italic leading-relaxed">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="block w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] text-sm font-black italic text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-5 px-8 gradient-primary text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] italic shadow-2xl shadow-primary/30 hover:shadow-primary/50 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'MENGIRIM...' : 'KIRIM LINK RESET'}
              </button>
            </form>
          )}

          <div className="mt-12 pt-8 border-t border-gray-50">
            <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
              Sudah ingat password?{' '}
              <Link to="/login" className="text-primary hover:text-primary-dark ml-2 hover:underline">
                Kembali ke Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
