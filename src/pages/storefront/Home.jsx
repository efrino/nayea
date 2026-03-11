import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProducts, getBanners } from '../../services/api';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [productsRes, bannersRes] = await Promise.all([
        getProducts(),
        getBanners(true) // true to get only active banners
      ]);

      if (productsRes.data) setFeaturedProducts(productsRes.data.slice(0, 4));
      if (bannersRes.data) setBanners(bannersRes.data);

      setLoading(false);
    }
    fetchData();
  }, []);

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const activeBannerImage = banners.length > 0
    ? banners[currentBannerIdx].image_url
    : 'https://images.unsplash.com/photo-1600262102148-18e5e80826bf?auto=format&fit=crop&q=80';

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-primary-dark group">
        <div className="absolute inset-0 overflow-hidden transition-all duration-1000">
          <img
            src={activeBannerImage}
            alt="Hero Background"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
          {/* Directional gradient overlay: Dark on left for text, transparent on right for image */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/60 to-transparent z-10 pointer-events-none"></div>
        </div>

        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentBannerIdx(prev => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/10 hover:bg-white/30 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentBannerIdx(prev => (prev + 1) % banners.length)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/10 hover:bg-white/30 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {banners.length > 0 && (
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48 pointer-events-none z-20">
            <div className="max-w-2xl text-left">
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight mb-6 drop-shadow-2xl">
                {banners[currentBannerIdx]?.title}
              </h1>
              {banners[currentBannerIdx]?.description && (
                <p className="mt-4 text-lg md:text-2xl text-gray-200 font-medium mb-10 drop-shadow-lg leading-relaxed tracking-wide">
                  {banners[currentBannerIdx].description}
                </p>
              )}
              {banners[currentBannerIdx]?.link_url && (
                <div className="flex justify-start space-x-4 pointer-events-auto mt-8">
                  {banners[currentBannerIdx].link_url.startsWith('http') ? (
                    <a href={banners[currentBannerIdx].link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-8 py-4 border border-transparent text-sm md:text-base font-bold rounded-xl shadow-xl text-primary bg-white hover:bg-gray-100 hover:scale-105 transition-all uppercase tracking-wider">
                      Detail Promo <ArrowRight className="ml-3 w-5 h-5" />
                    </a>
                  ) : (
                    <Link to={banners[currentBannerIdx].link_url} className="inline-flex items-center px-8 py-4 border border-transparent text-sm md:text-base font-bold rounded-xl shadow-xl text-primary bg-white hover:bg-gray-100 hover:scale-105 transition-all uppercase tracking-wider">
                      Shop Now <ArrowRight className="ml-3 w-5 h-5" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIdx(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentBannerIdx ? 'bg-white w-8' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Featured Collection</h2>
              <p className="mt-2 text-gray-500">Handpicked favorites just for you.</p>
            </div>
            <Link to="/catalog" className="hidden sm:inline-flex items-center text-primary font-medium hover:text-primary-dark transition-colors">
              View all <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p>Produk belum tersedia. Silakan tambahkan produk di dashboard admin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <div key={product.id} className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative h-72 w-full overflow-hidden bg-gray-200">
                    <img
                      src={product.image_url || 'https://via.placeholder.com/400x400?text=No+Image'}
                      alt={product.name}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.is_preorder && (
                      <span className="absolute top-4 left-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Pre-order
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
                      <Link to={`/product/${product.id}`}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {product.name}
                      </Link>
                    </h3>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">Rp {product.price.toLocaleString('id-ID')}</p>
                      <button className="relative z-10 p-2 text-gray-400 hover:text-primary hover:bg-green-50 rounded-full transition-colors z-20">
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center sm:hidden">
            <Link to="/catalog" className="inline-flex items-center text-primary font-medium">
              View all products <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter or Value Prop */}
      <section className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-green-50 rounded-3xl p-12 md:p-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Nayea.id Family</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Get updates on our latest collections, pre-orders, and exclusive offers.</p>
          <form className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow rounded-full border-gray-300 px-6 py-3 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              required
            />
            <button type="submit" className="rounded-full bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors shadow-sm">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
