import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Supabase handles the session exchange automatically on the redirect URL
      // We just need to wait for it to settle and then redirect the user
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error.message);
        navigate('/login');
        return;
      }

      if (data?.session) {
        // Successful login, redirect to home with success flag
        navigate('/?login=success');
      } else {
        // No session found, redirect to login
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-4">
        <div className="relative">
           <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
           <Loader2 className="w-12 h-12 text-primary animate-spin relative mx-auto" />
        </div>
        <div>
          <h2 className="text-xl font-black font-heading text-gray-900 italic tracking-tight">AUTENTIKASI...</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">Mohon tunggu sebentar, kami sedang menyiapkan akun Anda. 🌿</p>
        </div>
      </div>
    </div>
  );
}
