import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getWishlists, toggleWishlist } from '../../services/api';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';

export default function Wishlist() {
    const { session, openLoginModal } = useAuth();
    const user = session?.user;

    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Gate: if no user, show login modal immediately when wishlist is visited
    useEffect(() => {
        if (!user) {
            openLoginModal(null, 'wishlist');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        fetchWishlist();
    }, [user]);

    async function fetchWishlist() {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await getWishlists(user.id);
        if (!error && data) {
            setWishlistItems(data);
        }
        setLoading(false);
    }

    const handleRemove = async (productId) => {
        if (!user) return;
        const { error } = await toggleWishlist(user.id, productId);
        if (!error) {
            // Optimistically update UI
            setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
        }
    };

    // Guest view — locked state (modal also opens automatically above)
    if (!user) {
        return (
            <div className="bg-cream min-h-screen py-12 sm:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Saved Pieces</span>
                    <h1 className="text-4xl sm:text-5xl font-black font-heading text-primary tracking-tighter italic uppercase mb-10 flex items-center gap-4">
                        <Heart className="w-9 h-9 text-primary fill-current" />
                        Wishlist Saya
                    </h1>
                    <div className="bg-white rounded-[3rem] border border-oat shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-primary/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black font-heading text-primary italic uppercase mb-2">Login untuk melihat wishlist</h2>
                        <p className="text-secondary font-medium mb-8">Daftar atau masuk ke akun untuk menyimpan dan melihat produk favorit Anda.</p>
                        <button
                            onClick={() => openLoginModal(null, 'wishlist')}
                            className="inline-flex items-center px-8 py-4 gradient-primary text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            Masuk / Daftar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-cream min-h-screen py-12 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Saved Pieces</span>
                <h1 className="text-4xl sm:text-5xl font-black font-heading text-primary tracking-tighter italic uppercase mb-10 flex items-center gap-4">
                    <Heart className="w-9 h-9 text-primary fill-current" />
                    Wishlist Saya
                </h1>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
                    </div>
                ) : wishlistItems.length === 0 ? (
                    <div className="bg-white rounded-[3rem] shadow-sm p-12 text-center border border-oat">
                        <Heart className="w-16 h-16 text-secondary-light mx-auto mb-4" />
                        <h2 className="text-2xl font-black font-heading text-primary italic uppercase mb-2">Wishlist Anda kosong</h2>
                        <p className="text-secondary font-medium mb-8">Temukan produk favorit Anda dan simpan ke Wishlist untuk dibeli nanti!</p>
                        <Link to="/catalog" className="inline-flex items-center px-8 py-4 gradient-primary text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                            Mulai Eksplorasi
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {wishlistItems.map((item) => {
                            const product = item.product;
                            if (!product) return null;

                            const imageSrc = (product.images && product.images.length > 0) ? product.images[0] : (product.image_url || 'https://via.placeholder.com/400x400?text=No+Image');

                            return (
                                <div key={item.id} className="bg-white rounded-[2.5rem] p-4 border border-oat hover:border-transparent hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 group flex flex-col">
                                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-oat">
                                        <img
                                            src={imageSrc}
                                            alt={product.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <button
                                            onClick={(e) => { e.preventDefault(); handleRemove(product.id); }}
                                            className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm text-rose-500 hover:bg-rose-50 active:scale-90 transition-all"
                                            title="Hapus dari Wishlist"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {product.stock === 0 && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <span className="bg-white/90 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest italic text-primary">Stok Habis</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 px-2 space-y-1 flex-1 flex flex-col">
                                        <Link to={`/product/${product.id}`} className="block">
                                            <h3 className="text-sm font-black font-heading text-primary uppercase tracking-tight italic line-clamp-1 hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        <div className="mt-auto pt-4">
                                            <p className="text-base font-black text-primary tracking-tighter italic">Rp {product.price.toLocaleString('id-ID')}</p>
                                            <Link
                                                to={`/product/${product.id}`}
                                                className="mt-4 w-full flex items-center justify-center px-4 py-3 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-[1.2rem] font-black uppercase tracking-widest transition-all text-[10px] gap-2 active:scale-95"
                                            >
                                                <ShoppingBag className="w-4 h-4" /> Lihat Produk
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
