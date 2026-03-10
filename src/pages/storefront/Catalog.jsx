import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ShoppingBag } from 'lucide-react';
import { getProducts } from '../../services/api';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('filter') || 'all';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllProducts() {
      const { data, error } = await getProducts();
      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchAllProducts();
  }, []);

  const setFilter = (value) => {
    setSearchParams(value === 'all' ? {} : { filter: value });
  };

  const filteredProducts = products.filter(product => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'preorder') return product.is_preorder;
    // Assuming category data might be added later, for now we just filter by preorder
    return true;
  });

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Catalog</h1>
            <p className="mt-2 text-gray-500">Showing {filteredProducts.length} products</p>
          </div>

          {/* Filters */}
          <div className="mt-4 md:mt-0 flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <Filter className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
            <FilterButton active={activeFilter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
            <FilterButton active={activeFilter === 'preorder'} onClick={() => setFilter('preorder')}>Pre-order</FilterButton>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No products found in this category.</p>
            <button onClick={() => setFilter('all')} className="mt-4 text-primary font-medium hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
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

      </div>
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${active
          ? 'bg-primary text-white shadow-sm'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }`}
    >
      {children}
    </button>
  );
}
