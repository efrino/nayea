import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck, CheckCircle, Heart, PlayCircle, Star, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { isStaff } from '../../lib/roles';
import {
  addToCart,
  toggleWishlist,
  getWishlists,
  getProductReviews,
  canReviewProduct,
  createReview,
  deleteReview,
} from '../../services/api';
import SEO from '../../components/SEO';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, openLoginModal } = useAuth();
  const user = session?.user;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(null);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [allImages, setAllImages] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    const { data } = await getProductReviews(id);
    setReviews(data || []);
    setLoadingReviews(false);
  };

  useEffect(() => {
    fetchReviews();
    async function checkEligibility() {
      if (!user) {
        setCanReview(false);
        return;
      }
      const { data } = await canReviewProduct(user.id, id);
      setCanReview(!!data);
    }
    checkEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      openLoginModal(() => handleSubmitReview(e), 'review');
      return;
    }
    if (reviewForm.rating < 1) {
      alert('Harap pilih rating bintang terlebih dahulu.');
      return;
    }
    setSubmittingReview(true);
    const { error } = await createReview({
      product_id: id,
      user_id: user.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim() || null,
    });
    setSubmittingReview(false);
    if (error) {
      alert('Gagal mengirim ulasan: ' + error.message);
      return;
    }
    setReviewForm({ rating: 0, comment: '' });
    setCanReview(false);
    fetchReviews();
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Hapus ulasan ini?')) return;
    const { error } = await deleteReview(reviewId);
    if (error) {
      alert('Gagal menghapus ulasan: ' + error.message);
      return;
    }
    fetchReviews();
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setProduct(data);

        let imagesArray = [];
        if (data.images && data.images.length > 0) {
          imagesArray = data.images;
        } else if (data.image_url) {
          imagesArray = [data.image_url];
        }
        setAllImages(imagesArray);

        if (data.video_url) {
          setIsVideoActive(true); // Default to video if exists like Tokopedia
        } else if (imagesArray.length > 0) {
          setActiveImage(imagesArray[0]);
        }

        // Automatic color selection if variants exist
        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }
      }
      setLoading(false);
    }

    async function checkWishlist() {
      if (user) {
        const { data } = await getWishlists(user.id);
        const inWishlist = data?.some(w => w.product_id === id);
        setIsWishlisted(inWishlist);
      }
    }

    fetchProduct();
    checkWishlist();
  }, [id, user]);

  const handleAddToCart = async () => {
    if (!user) {
      openLoginModal(() => handleAddToCart(), 'keranjang');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("Harap pilih warna terlebih dahulu.");
      return;
    }

    if (product && product.stock > 0) {
      const { error } = await addToCart(user.id, product.id, quantity, selectedColor);
      if (error) {
        alert("Gagal menambahkan ke keranjang.");
        return;
      }
      setToastMsg('Berhasil ditambahkan ke keranjang!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Dispatch custom event so the Navbar cart counter updates
      window.dispatchEvent(new Event('cart_updated'));
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      openLoginModal(() => handleToggleWishlist(), 'wishlist');
      return;
    }
    const { added, error } = await toggleWishlist(user.id, product.id);
    if (!error) {
      setIsWishlisted(added);
      setToastMsg(added ? 'Ditambahkan ke Wishlist ❤️' : 'Dihapus dari Wishlist');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      openLoginModal(() => handleBuyNow(), 'checkout');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("Harap pilih warna terlebih dahulu.");
      return;
    }
    if (product && product.stock > 0) {
      const { error } = await addToCart(user.id, product.id, quantity, selectedColor);
      if (error) {
        alert("Gagal memproses pemesanan.");
        return;
      }
      window.dispatchEvent(new Event('cart_updated'));
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="bg-cream min-h-screen py-32 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-cream min-h-screen py-32 flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-primary mb-4">Produk tidak ditemukan</h2>
        <Link to="/catalog" className="text-primary hover:underline flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen py-10 sm:py-16 relative">
      <SEO
        title={product.name}
        description={product.description?.slice(0, 160) || `${product.name} — kerudung dan modest fashion premium dari Nayea.id. Rp ${product.price.toLocaleString('id-ID')}.`}
        image={product.image_url || (product.images && product.images[0])}
      />
      <div className="max-w-7xl mx-auto px-6 sm:px-8">

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] gradient-primary text-white px-8 py-4 rounded-[1.5rem] shadow-2xl flex items-center animate-in slide-in-from-top duration-300">
            <CheckCircle className="w-5 h-5 mr-3" />
            <span className="font-black text-[10px] uppercase tracking-widest">{toastMsg}</span>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex mb-12 sm:mb-16" aria-label="Breadcrumb">
          <Link to="/catalog" className="group flex items-center text-[10px] font-black text-secondary hover:text-primary transition-all uppercase tracking-widest italic">
            <div className="p-2 bg-cream rounded-full mr-3 group-hover:bg-primary/10 transition-all">
               <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Collection
          </Link>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 xl:gap-x-24">
          {/* Main Gallery Frame */}
          <div className="flex flex-col gap-6">
            <div className="w-full relative bg-cream rounded-[3rem] overflow-hidden aspect-[4/5] sm:aspect-square lg:aspect-[4/5] shadow-sm border border-oat">
              {isVideoActive && product.video_url ? (
                <video src={product.video_url} autoPlay loop muted playsInline controls className="object-cover object-center w-full h-full bg-black"></video>
              ) : (
                <img
                  src={activeImage || 'https://via.placeholder.com/800x800?text=No+Image'}
                  alt={product.name}
                  className="object-cover object-center w-full h-full animate-in fade-in duration-500"
                />
              )}
              {product.is_preorder && (
                <div className="absolute top-6 left-6">
                  <span className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/95 backdrop-blur-md text-amber-600 shadow-xl italic">
                    PRE-ORDER PIECE
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails row */}
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0">
              {product.video_url && (
                <button
                  onClick={() => { setIsVideoActive(true); setActiveImage(null); }}
                  className={`relative h-24 w-24 flex-shrink-0 cursor-pointer rounded-[1.5rem] overflow-hidden bg-primary group transition-all ${isVideoActive ? 'ring-4 ring-primary ring-offset-4' : 'opacity-60 hover:opacity-100'}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="w-10 h-10 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              )}
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => { setIsVideoActive(false); setActiveImage(img); }}
                  className={`relative h-24 w-24 flex-shrink-0 cursor-pointer rounded-[1.5rem] overflow-hidden bg-cream transition-all ${!isVideoActive && activeImage === img ? 'ring-4 ring-primary ring-offset-4' : 'opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="object-cover object-center w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-12 sm:mt-16 lg:mt-0 flex flex-col">
            <div className="flex-1">
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Nayea Selection</span>
               <h1 className="text-4xl sm:text-6xl font-black font-heading text-primary tracking-tighter italic uppercase leading-tight mb-4">{product.name}</h1>

               {reviews.length > 0 && (
                 <div className="flex items-center gap-2 mb-6">
                   <div className="flex items-center">
                     {[1, 2, 3, 4, 5].map((n) => (
                       <Star key={n} className={`w-4 h-4 ${n <= Math.round(averageRating) ? 'text-amber-400 fill-current' : 'text-oat fill-current'}`} />
                     ))}
                   </div>
                   <span className="text-xs font-black text-primary">{averageRating.toFixed(1)}</span>
                   <span className="text-xs font-medium text-secondary">({reviews.length} ulasan)</span>
                 </div>
               )}

               <div className="flex items-center justify-between mb-10 pb-10 border-b border-cream">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Price Value</span>
                    <p className="text-4xl sm:text-5xl font-black text-primary tracking-tighter italic">
                       Rp {product.price.toLocaleString('id-ID')}
                    </p>
                 </div>
                 <button
                   onClick={handleToggleWishlist}
                   className={`p-5 rounded-2xl transition-all flex items-center justify-center shadow-xl active:scale-90 ${isWishlisted ? 'bg-rose-50 text-rose-500 shadow-rose-500/10' : 'bg-cream text-secondary-light hover:text-rose-500 shadow-oat/10'}`}
                   title="Add to Wishlist"
                 >
                   <Heart className={`w-7 h-7 ${isWishlisted ? 'fill-current' : ''}`} />
                 </button>
               </div>

               {/* Meta Info grid */}
               <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="p-5 bg-cream rounded-[2rem] border border-oat">
                     <p className="text-[9px] font-black text-secondary uppercase tracking-widest mb-1.5">Availability</p>
                     <p className={`text-[12px] font-black uppercase italic ${product.stock > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                        {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                     </p>
                  </div>
                  {product.material && (
                    <div className="p-5 bg-cream rounded-[2rem] border border-oat">
                       <p className="text-[9px] font-black text-secondary uppercase tracking-widest mb-1.5">Fabrication</p>
                       <p className="text-[12px] font-black uppercase italic text-primary truncate">
                          {product.material}
                       </p>
                    </div>
                  )}
               </div>

               {/* Colors */}
               {product.colors && product.colors.length > 0 && (
                 <div className="mb-10">
                   <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4 italic">Available Colorways</h3>
                   <div className="flex flex-wrap gap-3">
                     {product.colors.map((color, idx) => (
                       <button
                         key={idx}
                         onClick={() => setSelectedColor(color)}
                         className={`px-6 py-3.5 rounded-[1.2rem] border-2 font-black text-[10px] uppercase tracking-widest transition-all italic active:scale-95
                             ${selectedColor === color
                             ? 'border-primary bg-primary/5 text-primary shadow-xl shadow-primary/10'
                             : 'border-cream bg-cream text-secondary hover:border-oat hover:text-primary group-hover:bg-white'}`}
                       >
                         {color}
                       </button>
                     ))}
                   </div>
                 </div>
               )}

               <div className="mb-12">
                 <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4 italic">Piece Description</h3>
                 <div className="text-sm font-medium text-secondary leading-relaxed whitespace-pre-wrap max-w-xl">
                   {product.description || "No additional details available for this curated piece."}
                 </div>
               </div>
            </div>

            {/* Sticky Action Bar for Mobile Ergonomics */}
            <div className="mt-8 bg-white p-6 sm:p-8 border border-oat rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] space-y-8">
              <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1 italic">Order Size</h3>
                   <div className="flex items-center gap-4 bg-cream p-2 rounded-[1.5rem] border border-oat">
                     <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={product.stock === 0} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-primary font-black hover:text-primary transition-all disabled:opacity-50 active:scale-90 border border-oat shadow-sm">-</button>
                     <span className="w-8 text-center font-black italic">{quantity}</span>
                     <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={product.stock === 0} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-primary font-black hover:text-primary transition-all disabled:opacity-50 active:scale-90 border border-oat shadow-sm">+</button>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-secondary uppercase tracking-widest mb-1">TOTAL ESTIMATE</p>
                  <p className="text-2xl font-black text-primary tracking-tighter italic">Rp {(product.price * quantity).toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] italic flex justify-center items-center shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <ShoppingBag className="w-5 h-5 mr-3" />
                  {product.stock === 0 ? 'NOT AVAILABLE' : 'ADD TO BAG'}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 gradient-primary text-white px-8 py-5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] italic flex justify-center items-center shadow-2xl shadow-primary/40 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {product.stock === 0
                    ? 'SOLD OUT'
                    : product.is_preorder
                      ? '✨ SECURE PRE-ORDER'
                      : 'PURCHASE NOW'}
                </button>
              </div>
            </div>

            {/* Guarantees */}
            <div className="mt-12 group">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="flex items-center p-4 bg-cream/50 rounded-2xl hover:bg-cream transition-colors">
                    <div className="p-3 bg-white rounded-xl mr-4 shadow-sm"><Truck className="w-5 h-5 text-primary" /></div>
                    <span className="text-[10px] font-black text-secondary uppercase tracking-widest italic leading-tight">Fast Shipping<br/><span className="text-secondary-light font-bold lowercase">via professional courier</span></span>
                 </div>
                 <div className="flex items-center p-4 bg-cream/50 rounded-2xl hover:bg-cream transition-colors">
                    <div className="p-3 bg-white rounded-xl mr-4 shadow-sm"><ShieldCheck className="w-5 h-5 text-primary" /></div>
                    <span className="text-[10px] font-black text-secondary uppercase tracking-widest italic leading-tight">Official Piece<br/><span className="text-secondary-light font-bold lowercase">quality guarantee</span></span>
                 </div>
              </div>
            </div>

          </div>
        </div>

        {/* Reviews */}
        <div className="mt-20 pt-16 border-t border-cream max-w-3xl">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Customer Voices</span>
          <h2 className="text-3xl sm:text-4xl font-black font-heading text-primary tracking-tighter italic uppercase mb-10">
            {reviews.length > 0 ? `${reviews.length} ULASAN` : 'ULASAN PRODUK'}
          </h2>

          {canReview && (
            <form onSubmit={handleSubmitReview} className="mb-12 p-8 bg-cream rounded-[2.5rem] border border-oat">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest italic mb-4">Bagikan Pendapatmu</h3>
              <div className="flex items-center gap-2 mb-5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewForm((prev) => ({ ...prev, rating: n }))}
                    className="active:scale-90 transition-transform"
                  >
                    <Star className={`w-7 h-7 ${n <= reviewForm.rating ? 'text-amber-400 fill-current' : 'text-oat fill-current'}`} />
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Ceritakan pengalamanmu dengan produk ini (opsional)..."
                className="w-full px-6 py-4 rounded-[1.5rem] bg-white border border-oat focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all resize-none mb-5"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="px-8 py-4 gradient-primary text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {submittingReview ? 'MENGIRIM...' : 'KIRIM ULASAN'}
              </button>
            </form>
          )}

          {loadingReviews ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-secondary font-medium italic">Belum ada ulasan untuk produk ini. Jadilah yang pertama!</p>
          ) : (
            <div className="space-y-8">
              {reviews.map((review) => (
                <div key={review.id} className="pb-8 border-b border-cream last:border-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="text-sm font-black text-primary">{review.reviewer_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`w-3.5 h-3.5 ${n <= review.rating ? 'text-amber-400 fill-current' : 'text-oat fill-current'}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-secondary font-medium">
                          {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    {(review.user_id === user?.id || isStaff(user?.user_metadata?.role)) && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-2 text-secondary-light hover:text-rose-500 transition-colors flex-shrink-0"
                        title="Hapus ulasan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-secondary font-medium leading-relaxed mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
