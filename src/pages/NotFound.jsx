import { Link } from 'react-router-dom';
import { Home, Search, AlertCircle, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Aesthetic Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />

      <div className="max-w-md w-full text-center relative z-10">
        <div className="relative mb-10 group">
           <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
           <div className="relative w-32 h-32 bg-white rounded-[2.5rem] shadow-premium border border-gray-50 flex items-center justify-center mx-auto transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
              <AlertCircle className="w-12 h-12 text-rose-500 drop-shadow-sm" />
           </div>
           <div className="absolute -bottom-2 -right-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-lg font-black italic shadow-lg">404</div>
        </div>

        <h1 className="text-4xl font-black font-heading text-gray-900 tracking-tighter italic uppercase leading-tight">
          Halaman Tidak <br /> <span className="text-primary italic">Ditemukan</span>
        </h1>
        
        <p className="mt-6 text-gray-400 font-medium leading-relaxed">
          Maaf, sepertinya Anda tersesat di antara koleksi hijab kami. Halaman yang Anda cari mungkin sudah pindah atau tidak tersedia.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
           <Link 
            to="/" 
            className="w-full py-4 px-8 gradient-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-primary/30 hover:shadow-2xl hover:scale-[1.02] active:scale-98 transition-all"
           >
              <Home className="w-4 h-4" />
              Kembali ke Beranda
           </Link>
           <Link 
            to="/catalog" 
            className="w-full py-4 px-8 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
           >
              <Search className="w-4 h-4" />
              Lihat Katalog
           </Link>
        </div>

        <div className="mt-12 pt-12 border-t border-gray-50">
           <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 italic">
              <ShoppingBag className="w-3 h-3" /> Nayea.id Official Store
           </div>
        </div>
      </div>
    </div>
  );
}
