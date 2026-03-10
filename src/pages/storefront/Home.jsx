import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { getProducts } from '../../services/api';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      const { data, error } = await getProducts();
      if (!error && data) {
        // For home page, we only show top 4 latest products
        setFeaturedProducts(data.slice(0, 4));
      }
      setLoading(false);
    }
    fetchFeatured();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-primary-dark">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1600262102148-18e5e80826bf?auto=format&fit=crop&q=80"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            Elegance in Modesty
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-green-50 mb-10">
            Discover our premium collection of kerudung and modest fashion. Designed for comfort, styled for elegance.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/catalog" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-primary bg-white hover:bg-gray-50 transition-all">
              Shop Now <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
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
