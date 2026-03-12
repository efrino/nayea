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
    <div className="bg-white min-h-screen py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-24 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center animate-bounce">
            <CheckCircle className="w-5 h-5 mr-3" />
            <span className="font-medium">{toastMsg}</span>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <Link to="/catalog" className="flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Katalog
          </Link>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          {/* Main Gallery Frame */}
          <div className="flex flex-col gap-4 lg:gap-6">
            <div className="w-full relative bg-gray-100 rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-square lg:aspect-[4/5] shadow-sm">
              {isVideoActive && product.video_url ? (
                <video src={product.video_url} autoPlay loop muted playsInline controls className="object-cover object-center w-full h-full bg-black"></video>
              ) : (
                <img
                  src={activeImage || 'https://via.placeholder.com/800x800?text=No+Image'}
                  alt={product.name}
                  className="object-cover object-center w-full h-full"
                />
              )}
              {product.is_preorder && (
                <span className="absolute top-4 left-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 backdrop-blur-sm bg-opacity-90">
                  Pre-order
                </span>
              )}
            </div>

            {/* Thumbnails row */}
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {product.video_url && (
                <button
                  onClick={() => { setIsVideoActive(true); setActiveImage(null); }}
                  className={`relative h-20 w-20 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden bg-gray-900 group ${isVideoActive ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="w-8 h-8 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              )}
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => { setIsVideoActive(false); setActiveImage(img); }}
                  className={`relative h-20 w-20 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden bg-gray-100 ${!isVideoActive && activeImage === img ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-75'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="object-cover object-center w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-10 px-4 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">{product.name}</h1>

            <div className="flex items-center justify-between mb-6">
              <p className="text-4xl font-bold text-primary">Rp {product.price.toLocaleString('id-ID')}</p>
              <button
                onClick={handleToggleWishlist}
                className="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-full transition-colors flex items-center justify-center tooltip-trigger"
                title="Tambah ke Wishlist"
              >
                <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Availability */}
            <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-100">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {product.stock > 0 ? `Stok Tersedia: ${product.stock}` : 'Stok Habis'}
              </div>
              {product.material && (
                <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  Bahan: {product.material}
                </div>
              )}
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Pilih Varian Warna</h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-full border font-medium text-sm transition-all
                          ${selectedColor === color
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Detail Produk</h3>
              <div className="prose prose-sm md:prose-base text-gray-600 mb-8 whitespace-pre-wrap leading-relaxed">
                {product.description || "Tidak ada rincian tambahan untuk produk ini."}
              </div>
            </div>

            <div className="mt-8 bg-white p-4 lg:p-6 border border-gray-100 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Atur Jumlah</h3>
              </div>
              <div className="flex items-center mb-6">
                <div className="flex items-center border border-gray-300 rounded-full bg-white mr-4 h-12">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={product.stock === 0} className="px-5 h-full text-gray-600 hover:text-primary transition-colors disabled:opacity-50 font-bold text-lg">-</button>
                  <span className="w-10 text-center font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={product.stock === 0} className="px-5 h-full text-gray-600 hover:text-primary transition-colors disabled:opacity-50 font-bold text-lg">+</button>
                </div>
                <div className="text-sm text-gray-500 border-l border-gray-200 pl-4 py-1">
                  Subtotal: <br /> <strong className="text-gray-900">Rp {(product.price * quantity).toLocaleString('id-ID')}</strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Button 1: Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-white border-2 border-primary text-primary hover:bg-primary/5 transition-colors px-6 py-4 rounded-xl font-bold text-base flex justify-center items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {product.stock === 0 ? 'Stok Habis' : '+ Keranjang'}
                </button>

                {/* Button 2: Buy Now / Pre-Order Now */}
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 bg-primary hover:bg-primary-dark transition-colors text-white px-6 py-4 rounded-xl font-bold text-base flex justify-center items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.stock === 0
                    ? 'Tidak Tersedia'
                    : product.is_preorder
                      ? '✨ Pre-Order Sekarang'
                      : 'Beli Sekarang'}
                </button>
              </div>
            </div>

            {/* Guarantees */}
            <div className="mt-10 border-t border-gray-100 pt-8 grid grid-cols-1 gap-4">
              <div className="flex items-center text-gray-500">
                <Truck className="w-5 h-5 mr-3 text-primary" />
                <span className="text-sm">Safe & fast delivery via reliable couriers</span>
              </div>
              <div className="flex items-center text-gray-500">
                <ShieldCheck className="w-5 h-5 mr-3 text-primary" />
                <span className="text-sm">Premium quality guarantee from nayea.id</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
