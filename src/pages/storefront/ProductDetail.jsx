import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck, CheckCircle, Heart, PlayCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { addToCart, toggleWishlist, getWishlists } from '../../services/api';

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
      <div className="bg-white min-h-screen py-32 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white min-h-screen py-32 flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Produk tidak ditemukan</h2>
        <Link to="/catalog" className="text-primary hover:underline flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-10 sm:py-16 relative">
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
          <Link to="/catalog" className="group flex items-center text-[10px] font-black text-gray-400 hover:text-primary transition-all uppercase tracking-widest italic">
            <div className="p-2 bg-gray-50 rounded-full mr-3 group-hover:bg-primary/10 transition-all">
               <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Collection
          </Link>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 xl:gap-x-24">
          {/* Main Gallery Frame */}
          <div className="flex flex-col gap-6">
            <div className="w-full relative bg-gray-50 rounded-[3rem] overflow-hidden aspect-[4/5] sm:aspect-square lg:aspect-[4/5] shadow-sm border border-gray-100">
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
                  className={`relative h-24 w-24 flex-shrink-0 cursor-pointer rounded-[1.5rem] overflow-hidden bg-gray-900 group transition-all ${isVideoActive ? 'ring-4 ring-primary ring-offset-4' : 'opacity-60 hover:opacity-100'}`}
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
                  className={`relative h-24 w-24 flex-shrink-0 cursor-pointer rounded-[1.5rem] overflow-hidden bg-gray-50 transition-all ${!isVideoActive && activeImage === img ? 'ring-4 ring-primary ring-offset-4' : 'opacity-60 hover:opacity-100'}`}
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
               <h1 className="text-4xl sm:text-6xl font-black font-heading text-gray-900 tracking-tighter italic uppercase leading-tight mb-4">{product.name}</h1>

               <div className="flex items-center justify-between mb-10 pb-10 border-b border-gray-50">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Price Value</span>
                    <p className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter italic">
                       Rp {product.price.toLocaleString('id-ID')}
                    </p>
                 </div>
                 <button
                   onClick={handleToggleWishlist}
                   className={`p-5 rounded-2xl transition-all flex items-center justify-center shadow-xl active:scale-90 ${isWishlisted ? 'bg-rose-50 text-rose-500 shadow-rose-500/10' : 'bg-gray-50 text-gray-300 hover:text-rose-500 shadow-gray-200/10'}`}
                   title="Add to Wishlist"
                 >
                   <Heart className={`w-7 h-7 ${isWishlisted ? 'fill-current' : ''}`} />
                 </button>
               </div>

               {/* Meta Info grid */}
               <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Availability</p>
                     <p className={`text-[12px] font-black uppercase italic ${product.stock > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                        {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                     </p>
                  </div>
                  {product.material && (
                    <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Fabrication</p>
                       <p className="text-[12px] font-black uppercase italic text-gray-900 truncate">
                          {product.material}
                       </p>
                    </div>
                  )}
               </div>

               {/* Colors */}
               {product.colors && product.colors.length > 0 && (
                 <div className="mb-10">
                   <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">Available Colorways</h3>
                   <div className="flex flex-wrap gap-3">
                     {product.colors.map((color, idx) => (
                       <button
                         key={idx}
                         onClick={() => setSelectedColor(color)}
                         className={`px-6 py-3.5 rounded-[1.2rem] border-2 font-black text-[10px] uppercase tracking-widest transition-all italic active:scale-95
                             ${selectedColor === color
                             ? 'border-primary bg-primary/5 text-primary shadow-xl shadow-primary/10'
                             : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200 hover:text-gray-900 group-hover:bg-white'}`}
                       >
                         {color}
                       </button>
                     ))}
                   </div>
                 </div>
               )}

               <div className="mb-12">
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">Piece Description</h3>
                 <div className="text-sm font-medium text-gray-500 leading-relaxed whitespace-pre-wrap max-w-xl">
                   {product.description || "No additional details available for this curated piece."}
                 </div>
               </div>
            </div>

            {/* Sticky Action Bar for Mobile Ergonomics */}
            <div className="mt-8 bg-white p-6 sm:p-8 border border-gray-100 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] space-y-8">
              <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Order Size</h3>
                   <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-[1.5rem] border border-gray-100">
                     <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={product.stock === 0} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-gray-900 font-black hover:text-primary transition-all disabled:opacity-50 active:scale-90 border border-gray-100 shadow-sm">-</button>
                     <span className="w-8 text-center font-black italic">{quantity}</span>
                     <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={product.stock === 0} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-gray-900 font-black hover:text-primary transition-all disabled:opacity-50 active:scale-90 border border-gray-100 shadow-sm">+</button>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL ESTIMATE</p>
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
                 <div className="flex items-center p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="p-3 bg-white rounded-xl mr-4 shadow-sm"><Truck className="w-5 h-5 text-primary" /></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic leading-tight">Fast Shipping<br/><span className="text-gray-300 font-bold lowercase">via professional courier</span></span>
                 </div>
                 <div className="flex items-center p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="p-3 bg-white rounded-xl mr-4 shadow-sm"><ShieldCheck className="w-5 h-5 text-primary" /></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic leading-tight">Official Piece<br/><span className="text-gray-300 font-bold lowercase">quality guarantee</span></span>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
