import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ShoppingBag } from 'lucide-react';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('filter') || 'all';

  const setFilter = (value) => {
    setSearchParams(value === 'all' ? {} : { filter: value });
  };

  // Mock Data
  const products = [
    { id: 1, name: "Khimar Syar'i Premium", price: 150000, category: 'khimar', is_preorder: false, image: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=400" },
    { id: 2, name: "Pashmina Silk Exclusive", price: 120000, category: 'pashmina', is_preorder: true, image: "https://images.unsplash.com/photo-1600093845873-6c84cffd87f8?auto=format&fit=crop&q=80&w=400" },
    { id: 3, name: "Bergo Instan Daily", price: 85000, category: 'bergo', is_preorder: false, image: "https://images.unsplash.com/photo-1601646960002-315cc6ba771a?auto=format&fit=crop&q=80&w=400" },
    { id: 4, name: "Hijab Segiempat Voal", price: 95000, category: 'square', is_preorder: false, image: "https://images.unsplash.com/photo-1598555610056-bb6f272caffb?auto=format&fit=crop&q=80&w=400" },
    { id: 5, name: "Gamis Set Aisyah", price: 350000, category: 'apparel', is_preorder: true, image: "https://images.unsplash.com/photo-1550630997-c2560b457b56?auto=format&fit=crop&q=80&w=400" },
    { id: 6, name: "Mukena Travel Mini", price: 180000, category: 'accessories', is_preorder: false, image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=400" },
  ];

  const filteredProducts = products.filter(product => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'preorder') return product.is_preorder;
    return product.category === activeFilter;
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
            <FilterButton active={activeFilter === 'khimar'} onClick={() => setFilter('khimar')}>Khimar</FilterButton>
            <FilterButton active={activeFilter === 'pashmina'} onClick={() => setFilter('pashmina')}>Pashmina</FilterButton>
            <FilterButton active={activeFilter === 'preorder'} onClick={() => setFilter('preorder')}>Pre-order</FilterButton>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <div key={product.id} className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
              <div className="relative h-72 w-full overflow-hidden bg-gray-200">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
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
                  <button className="relative z-10 p-2 text-gray-400 hover:text-primary hover:bg-green-50 rounded-full transition-colors">
                    <ShoppingBag className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No products found in this category.</p>
            <button onClick={() => setFilter('all')} className="mt-4 text-primary font-medium hover:underline">
              Clear filters
            </button>
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
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active 
          ? 'bg-primary text-white shadow-sm' 
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}
