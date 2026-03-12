import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getWishlists, toggleWishlist } from '../../services/api';

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
            <div className="bg-gray-50 min-h-screen py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-8 flex items-center gap-3">
                        <Heart className="w-8 h-8 text-primary fill-current" />
                        Wishlist Saya
                    </h1>
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Lock className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">Login untuk melihat wishlist</h2>
                        <p className="text-gray-500 mb-8">Daftar atau masuk ke akun untuk menyimpan dan melihat produk favorit Anda.</p>
                        <button
                            onClick={() => openLoginModal(null, 'wishlist')}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-primary hover:bg-primary-dark transition-colors"
                        >
                            Masuk / Daftar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-8 flex items-center gap-3">
                    <Heart className="w-8 h-8 text-primary fill-current" />
                    Wishlist Saya
                </h1>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : wishlistItems.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-gray-100">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">Wishlist Anda kosong</h2>
                        <p className="text-gray-500 mb-8">Temukan produk favorit Anda dan simpan ke Wishlist untuk dibeli nanti!</p>
                        <Link to="/catalog" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-bold rounded-full shadow-sm text-white bg-primary hover:bg-primary-dark transition-colors">
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
                                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group border border-gray-100 flex flex-col">
                                    <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                                        <img
                                            src={imageSrc}
                                            alt={product.name}
                                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <button
                                            onClick={(e) => { e.preventDefault(); handleRemove(product.id); }}
                                            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 transition-colors"
                                            title="Hapus dari Wishlist"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {product.stock === 0 && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <span className="bg-white/90 px-4 py-2 rounded-full text-sm font-bold text-gray-900">Stok Habis</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        <Link to={`/product/${product.id}`} className="block mt-2">
                                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        <div className="mt-auto pt-4">
                                            <p className="text-lg font-bold text-gray-900">Rp {product.price.toLocaleString('id-ID')}</p>
                                            <Link
                                                to={`/product/${product.id}`}
                                                className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-white rounded-full font-medium transition-colors text-sm gap-2"
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
