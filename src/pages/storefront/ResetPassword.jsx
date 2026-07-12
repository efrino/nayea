import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Supabase auto-exchanges the recovery token in the URL for a session
  // (detectSessionInUrl is on by default) — just wait for it to settle.
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setHasRecoverySession(!!data?.session);
      setCheckingSession(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasRecoverySession(true);
        setCheckingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    navigate('/login?reset=success');
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/" className="group flex flex-col items-center">
            <div className="w-16 h-16 gradient-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
              {hasRecoverySession ? <KeyRound className="w-8 h-8 text-white" /> : <ShoppingBag className="w-8 h-8 text-white" />}
            </div>
            <span className="mt-4 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Nayea.id</span>
          </Link>
        </div>
        <h2 className="text-center text-4xl font-black font-heading text-primary tracking-tighter italic uppercase">
          Set Password Baru
        </h2>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-10 px-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] rounded-[3rem] border border-oat sm:px-12">
          {checkingSession ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : !hasRecoverySession ? (
            <div className="text-center space-y-6">
              <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-2xl">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest italic leading-relaxed">
                  Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="inline-flex justify-center w-full py-5 px-8 gradient-primary text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] italic shadow-2xl shadow-primary/30 hover:shadow-primary/50 active:scale-95 transition-all"
              >
                Minta Link Baru
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-2xl">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest italic leading-relaxed">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-3 italic">Password Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-6 py-4 bg-cream border-2 border-cream rounded-[1.5rem] text-sm font-black italic text-primary placeholder-secondary-light focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-3 italic">Konfirmasi Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-6 py-4 bg-cream border-2 border-cream rounded-[1.5rem] text-sm font-black italic text-primary placeholder-secondary-light focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-5 px-8 gradient-primary text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] italic shadow-2xl shadow-primary/30 hover:shadow-primary/50 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'MEMPROSES...' : 'SIMPAN PASSWORD BARU'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
