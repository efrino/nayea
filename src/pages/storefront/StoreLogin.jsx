import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShoppingBag, Chrome, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function StoreLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unconfirmed, setUnconfirmed] = useState(false);
    const [resendMsg, setResendMsg] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const showResetSuccess = searchParams.get('reset') === 'success';

    useEffect(() => {
        if (showResetSuccess) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setUnconfirmed(false);
        setResendMsg('');

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            if (error.message.includes('Email not confirmed')) {
                setError('Email belum dikonfirmasi. Silakan periksa kotak masuk email Anda dan klik tautan verifikasi sebelum login.');
                setUnconfirmed(true);
            } else {
                setError(error.message);
            }
        } else {
            navigate('/');
        }
        setLoading(false);
    };

    const handleResendVerification = async () => {
        if (!email) {
            setError('Masukkan email Anda terlebih dahulu, lalu klik "Kirim ulang email verifikasi".');
            return;
        }
        setLoading(true);
        setResendMsg('');
        const { error } = await supabase.auth.resend({ type: 'signup', email });
        if (error) {
            setError(error.message);
        } else {
            setResendMsg('Email verifikasi telah dikirim ulang. Cek juga folder spam.');
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: { prompt: 'select_account' }
            }
        });
        if (error) setError(error.message);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center mb-8">
                    <Link to="/" className="group flex flex-col items-center">
                        <div className="w-16 h-16 gradient-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                            <ShoppingBag className="w-8 h-8 text-white" />
                        </div>
                        <span className="mt-4 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Nayea.id</span>
                    </Link>
                </div>
                <h2 className="text-center text-4xl font-black font-heading text-primary tracking-tighter italic uppercase">
                    Welcome Back
                </h2>
                <p className="mt-4 text-center text-xs font-black text-secondary uppercase tracking-widest italic">
                    Step into your curated collection
                </p>
            </div>

            <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-white/80 backdrop-blur-xl py-10 px-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] rounded-[3rem] border border-oat sm:px-12">
                    <form className="space-y-8" onSubmit={handleLogin}>
                        {showResetSuccess && (
                            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic leading-relaxed">Password berhasil direset. Silakan login dengan password baru Anda.</p>
                            </div>
                        )}
                        {error && (
                            <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-2xl animate-in fade-in slide-in-from-top-2 space-y-3">
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest italic leading-relaxed">{error}</p>
                                {unconfirmed && (
                                    <button
                                        type="button"
                                        onClick={handleResendVerification}
                                        disabled={loading}
                                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline italic disabled:opacity-50"
                                    >
                                        Kirim ulang email verifikasi
                                    </button>
                                )}
                            </div>
                        )}

                        {resendMsg && (
                            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic leading-relaxed">{resendMsg}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-3 italic">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="block w-full px-6 py-4 bg-cream border-2 border-cream rounded-[1.5rem] text-sm font-black italic text-primary placeholder-secondary-light focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-[10px] font-black text-secondary uppercase tracking-widest italic">Password</label>
                                    <Link to="/forgot-password" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline italic">Forgot?</Link>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full px-6 py-4 bg-cream border-2 border-cream rounded-[1.5rem] text-sm font-black italic text-primary placeholder-secondary-light focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-5 px-8 gradient-primary text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] italic shadow-2xl shadow-primary/30 hover:shadow-primary/50 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-oat" />
                            </div>
                            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-widest italic">
                                <span className="px-4 bg-white text-secondary-light">Alternate Gateway</span>
                            </div>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-4 py-5 px-8 bg-white border-2 border-cream hover:border-primary/20 hover:bg-cream rounded-[1.5rem] font-black text-[12px] uppercase tracking-widest italic text-secondary transition-all shadow-sm active:scale-95"
                            >
                                <Chrome className="w-5 h-5 text-rose-500" />
                                Continue with Google
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 pt-8 border-t border-cream">
                        <p className="text-center text-[10px] font-black text-secondary uppercase tracking-widest italic">
                            New to our pieces?{' '}
                            <Link to="/register" className="text-primary hover:text-primary-dark ml-2 hover:underline">
                                Start Here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
