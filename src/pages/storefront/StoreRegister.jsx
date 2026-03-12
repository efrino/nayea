import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Chrome } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function StoreRegister() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg('');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'customer'
                }
            }
        });

        if (error) {
            setError(error.message);
        } else {
            if (data?.session) {
                setSuccessMsg('Pendaftaran berhasil! Mengalihkan ke beranda...');
                setTimeout(() => navigate('/'), 2000);
            } else {
                setSuccessMsg('Pendaftaran berhasil! Silakan periksa kotak masuk email Anda untuk melakukan verifikasi.');
                setTimeout(() => navigate('/login'), 4000);
            }
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) setError(error.message);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
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
                <h2 className="text-center text-4xl font-black font-heading text-gray-900 tracking-tighter italic uppercase">
                    Join the Collective
                </h2>
                <p className="mt-4 text-center text-xs font-black text-gray-400 uppercase tracking-widest italic">
                    Unlock exclusive pieces & early access
                </p>
            </div>

            <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-white/80 backdrop-blur-xl py-10 px-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] rounded-[3rem] border border-gray-100 sm:px-12">
                    <form className="space-y-8" onSubmit={handleRegister}>
                        {error && (
                            <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest italic leading-relaxed">{error}</p>
                            </div>
                        )}

                        {successMsg && (
                            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-2xl animate-in fade-in zoom-in-95">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic leading-relaxed">{successMsg}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Full Identity</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Your Name"
                                    className="block w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] text-sm font-black italic text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                                />
                            </div>

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

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Secure Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] text-sm font-black italic text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || !!successMsg}
                                className="w-full flex justify-center py-5 px-8 gradient-primary text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] italic shadow-2xl shadow-primary/30 hover:shadow-primary/50 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? 'CREATING IDENTITY...' : 'CREATE ACCOUNT'}
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-widest italic">
                                <span className="px-4 bg-white text-gray-300">Alternate Gateway</span>
                            </div>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading || !!successMsg}
                                className="w-full flex items-center justify-center gap-4 py-5 px-8 bg-white border-2 border-gray-50 hover:border-primary/20 hover:bg-gray-50 rounded-[1.5rem] font-black text-[12px] uppercase tracking-widest italic text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                <Chrome className="w-5 h-5 text-rose-500" />
                                Sign up with Google
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 pt-8 border-t border-gray-50">
                        <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                            Already a member?{' '}
                            <Link to="/login" className="text-primary hover:text-primary-dark ml-2 hover:underline">
                                Secure Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
