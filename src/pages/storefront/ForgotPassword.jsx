import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMsg, setInfoMsg] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
    } else {
      setInfoMsg(`Kode OTP telah dikirim ke ${email}. Cek juga folder spam kalau belum masuk.`);
      setStep('otp');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
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

    // 1. Verify the OTP code sent to the user's email
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    });

    if (verifyError) {
      setError('Kode OTP salah atau sudah kedaluwarsa. ' + verifyError.message);
      setLoading(false);
      return;
    }

    // 2. Now that we have a recovery session, set the new password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // 3. Sign out so the user logs back in fresh with the new password
    await supabase.auth.signOut();
    setLoading(false);
    navigate('/login?reset=success');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/" className="group flex flex-col items-center">
            <div className="w-16 h-16 gradient-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
              {step === 'email' ? <ShoppingBag className="w-8 h-8 text-white" /> : <KeyRound className="w-8 h-8 text-white" />}
            </div>
            <span className="mt-4 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Nayea.id</span>
          </Link>
        </div>
        <h2 className="text-center text-4xl font-black font-heading text-gray-900 tracking-tighter italic uppercase">
          {step === 'email' ? 'Lupa Password?' : 'Masukkan Kode OTP'}
        </h2>
        <p className="mt-4 text-center text-xs font-black text-gray-400 uppercase tracking-widest italic">
          {step === 'email' ? 'Kami akan kirimkan kode OTP ke email Anda' : 'Cek email Anda untuk kode 6 digit'}
        </p>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-10 px-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] rounded-[3rem] border border-gray-100 sm:px-12">
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-2xl mb-8">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest italic leading-relaxed">{error}</p>
            </div>
          )}
          {infoMsg && step === 'otp' && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-2xl mb-8">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic leading-relaxed">{infoMsg}</p>
            </div>
          )}

          {step === 'email' ? (
            <form className="space-y-8" onSubmit={handleSendOtp}>
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
                {loading ? 'MENGIRIM...' : 'KIRIM KODE OTP'}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Kode OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="block w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] text-lg font-black italic text-gray-900 text-center tracking-[0.5em] placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Password Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] text-sm font-black italic text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Konfirmasi Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] text-sm font-black italic text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-5 px-8 gradient-primary text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] italic shadow-2xl shadow-primary/30 hover:shadow-primary/50 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'MEMPROSES...' : 'RESET PASSWORD'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('email'); setError(null); setOtp(''); }}
                className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors"
              >
                Ganti email / Kirim ulang kode
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
