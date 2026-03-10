import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setProduct(data);
        setActiveImage(data.image_url);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      addToCart(product, quantity);

      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
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
            <span className="font-medium">Berhasil ditambahkan ke keranjang!</span>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <Link to="/catalog" className="flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Link>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          {/* Image Gallery */}
          <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
            <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
              {/* As we only have one image per product for now in the schema, we just list it once. */}
              {activeImage && (
                <button
                  onClick={() => setActiveImage(activeImage)}
                  className={`relative h-24 w-24 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden bg-gray-100 ring-2 ring-primary ring-offset-2`}
                >
                  <img src={activeImage} alt="" className="object-cover object-center w-full h-full" />
                </button>
              )}
            </div>
            <div className="w-full relative bg-gray-100 rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-square lg:aspect-[4/5]">
              <img
                src={activeImage || 'https://via.placeholder.com/800x800?text=No+Image'}
                alt={product.name}
                className="object-cover object-center w-full h-full"
              />
              {product.is_preorder && (
                <span className="absolute top-4 left-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 backdrop-blur-sm bg-opacity-90">
                  Pre-order
                </span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-10 px-4 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-4">{product.name}</h1>
            <div className="flex items-center justify-between mb-6">
              <p className="text-3xl font-bold text-primary">Rp {product.price.toLocaleString('id-ID')}</p>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
              </div>
            </div>

            <div className="prose prose-sm md:prose-base text-gray-600 mb-8 whitespace-pre-wrap">
              {product.description || "Tidak ada deskripsi untuk produk ini."}
            </div>

            <div className="mt-8">
              <div className="flex items-center mb-4">
                <span className="text-sm font-medium text-gray-900 mr-4">Quantity</span>
                <div className="flex items-center border border-gray-300 rounded-full bg-white">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={product.stock === 0} className="px-4 py-2 text-gray-600 hover:text-primary transition-colors disabled:opacity-50">-</button>
                  <span className="px-4 py-2 font-medium w-12 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={product.stock === 0} className="px-4 py-2 text-gray-600 hover:text-primary transition-colors disabled:opacity-50">+</button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-primary hover:bg-primary-dark transition-colors text-white px-8 py-4 rounded-full font-bold text-lg flex justify-center items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {product.stock === 0 ? 'Out of Stock' : (product.is_preorder ? 'Pre-order Now' : 'Add to Cart')}
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
