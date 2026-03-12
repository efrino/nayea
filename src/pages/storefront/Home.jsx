import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { getProducts, getBanners } from '../../services/api';

// Check if the URL is an HTML5 video format that needs a <video> tag to loop
const isVideoUrl = (url) => {
  if (!url) return false;
  const lower = url.split('?')[0].toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.webm');
};

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
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative group overflow-hidden">
        <div className="absolute inset-0 transition-all duration-1000">
          {isVideoUrl(activeBannerImage) ? (
            <video
              key={activeBannerImage}
              src={activeBannerImage}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover object-center z-0"
            />
          ) : (
            <img
              src={activeBannerImage}
              alt="Hero Background"
              className="absolute inset-0 w-full h-full object-cover object-center z-0"
            />
          )}
          {/* Multi-stage gradient overlay: Dark on left, subtle on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/40 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent z-10 pointer-events-none"></div>
        </div>

        {banners.length > 1 && (
          <div className="hidden sm:block">
            <button
              onClick={() => setCurrentBannerIdx(prev => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-20 active:scale-90 border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentBannerIdx(prev => (prev + 1) % banners.length)}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-20 active:scale-90 border border-white/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {banners.length > 0 && (
          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-32 sm:py-48 flex flex-col justify-center min-h-[70vh] lg:min-h-[90vh] z-20">
            <div className="max-w-3xl">
              <span className="inline-block px-4 py-2 bg-primary/20 backdrop-blur-md text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] mb-6 italic animate-in fade-in slide-in-from-left duration-700">
                New Arrival 2026
              </span>
              <h1 className="text-5xl md:text-8xl font-black font-heading text-white tracking-tighter leading-[0.9] mb-8 drop-shadow-2xl italic uppercase animate-in fade-in slide-in-from-left duration-700 delay-100">
                {banners[currentBannerIdx]?.title}
              </h1>
              {banners[currentBannerIdx]?.description && (
                <p className="max-w-xl text-lg md:text-2xl text-gray-200 font-medium mb-12 drop-shadow-lg leading-relaxed tracking-wide opacity-90 animate-in fade-in slide-in-from-left duration-700 delay-200">
                  {banners[currentBannerIdx].description}
                </p>
              )}
              {banners[currentBannerIdx]?.link_url && (
                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-left duration-700 delay-300">
                  {(() => {
                    let url = banners[currentBannerIdx].link_url.trim();
                    let isExternal = false;

                    if (url.match(/^https?:\/\//)) {
                      isExternal = true;
                    } else if (url.match(/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/)) {
                      isExternal = true;
                      url = `https://${url}`;
                    } else if (!url.startsWith('/')) {
                      url = `/${url}`;
                    }

                    const commonClasses = "inline-flex items-center justify-center px-10 py-5 rounded-[1.8rem] text-[12px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl";
                    
                    if (isExternal) {
                      return (
                        <a href={url} target="_blank" rel="noopener noreferrer" className={`${commonClasses} bg-white text-gray-900 hover:bg-gray-50`}>
                          Explore Collection <ArrowRight className="ml-3 w-5 h-5" />
                        </a>
                      );
                    }
                    return (
                      <Link to={url} className={`${commonClasses} gradient-primary text-white hover:shadow-primary/30`}>
                        Shop The Look <ArrowRight className="ml-3 w-5 h-5" />
                      </Link>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-12 left-6 sm:left-12 flex items-center gap-3 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIdx(idx)}
                className={`transition-all duration-500 rounded-full ${idx === currentBannerIdx ? 'bg-primary w-12 h-2.5' : 'bg-white/30 w-2.5 h-2.5 hover:bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16">
            <div className="max-w-md">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Curated Space</span>
              <h2 className="text-4xl sm:text-6xl font-black font-heading text-gray-900 tracking-tighter italic uppercase">FEATURED COLLECTION</h2>
            </div>
            <Link to="/catalog" className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-all">
              Browse All <div className="p-2 bg-gray-50 rounded-full group-hover:bg-primary/10 transition-all"><ArrowRight className="w-4 h-4" /></div>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-32">
               <div className="relative">
                  <div className="w-16 h-16 border-4 border-gray-100 rounded-full" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
               </div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-32 bg-gray-50 rounded-[3rem] border border-gray-100">
               <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic italic">No products available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <div key={product.id} className="group relative bg-white rounded-[2.5rem] p-4 border border-gray-100 hover:border-transparent hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-gray-100">
                    <img
                      src={product.image_url || 'https://via.placeholder.com/400x400?text=No+Image'}
                      alt={product.name}
                      className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {product.is_preorder && (
                      <div className="absolute top-4 left-4">
                        <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/90 backdrop-blur-md text-amber-600 shadow-sm italic">
                          PRE-ORDER
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                       <Link to={`/product/${product.id}`} className="w-full py-4 bg-white/95 backdrop-blur-md text-gray-900 rounded-[1.2rem] text-center font-black text-[10px] uppercase tracking-widest shadow-xl block hover:bg-white active:scale-95 transition-all">
                          QUICK VIEW
                       </Link>
                    </div>
                  </div>
                  
                  <div className="mt-6 px-2 space-y-1">
                    <h3 className="text-sm font-black font-heading text-gray-900 uppercase tracking-tight italic line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                       <p className="text-base font-black text-gray-400 tracking-tighter italic">
                          Rp {product.price.toLocaleString('id-ID')}
                       </p>
                       <button className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all active:scale-90 shadow-sm border border-gray-100/50">
                          <ShoppingBag className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 text-center sm:hidden">
            <Link to="/catalog" className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all w-full justify-center">
              SEE ALL PRODUCTS <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-24 bg-gray-50 section-curve-t">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { title: 'PREMIUM QUALITY', desc: 'Crafted with the finest fabrics for ultimate comfort and style.' },
                { title: 'FAST SHIPPING', desc: 'We ensure your items reach you in the shortest time possible.' },
                { title: '24/7 SUPPORT', desc: 'Our dedicated team is always here to help with your inquiries.' }
              ].map((prop, i) => (
                <div key={i} className="space-y-4 p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                   <div className="w-16 h-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center text-primary mb-6">
                      <Package className="w-8 h-8" />
                   </div>
                   <h4 className="text-xl font-black font-heading tracking-tight italic uppercase">{prop.title}</h4>
                   <p className="text-sm text-gray-500 font-medium leading-relaxed">{prop.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-32 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="relative bg-gray-900 rounded-[4rem] p-12 sm:p-24 overflow-hidden group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-1000" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] italic">Stay Connected</span>
              <h2 className="text-4xl sm:text-7xl font-black font-heading text-white tracking-tighter italic leading-tight uppercase">JOIN THE NAYEA FAMILY</h2>
              <p className="text-gray-400 font-medium text-lg leading-relaxed">Be the first to know about new collections, exclusive drops, and special offers tailored just for you.</p>
              
              <form className="flex flex-col sm:flex-row gap-4 mt-12 bg-white/5 p-3 rounded-[2.5rem] backdrop-blur-sm border border-white/10 shadow-2xl">
                <input
                  type="email"
                  placeholder="Drop your email here..."
                  className="flex-grow bg-transparent border-transparent px-8 py-5 text-white placeholder-gray-500 font-bold focus:ring-0 outline-none"
                  required
                />
                <button type="submit" className="px-10 py-5 bg-white text-gray-900 rounded-[1.8rem] font-black text-[12px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95 shadow-xl">
                  SUBSCRIBE NOW
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
