import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
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
    return true;
  });

  return (
    <div className="bg-white min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-xl">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">Our Collections</span>
            <h1 className="text-4xl sm:text-7xl font-black font-heading text-gray-900 tracking-tighter italic uppercase leading-none">THE CATALOG</h1>
            <p className="mt-4 text-gray-400 font-bold uppercase tracking-widest text-[10px] italic">Discover {filteredProducts.length} curated pieces</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4 md:pb-0 hide-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0">
             <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-[1.8rem] border border-gray-100">
               <FilterButton active={activeFilter === 'all'} onClick={() => setFilter('all')}>ALL PIECES</FilterButton>
               <FilterButton active={activeFilter === 'preorder'} onClick={() => setFilter('preorder')}>PRE-ORDER</FilterButton>
             </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-40">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-100 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
             </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 bg-gray-50 rounded-[4rem] border border-gray-100">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">No items found in this category.</p>
            <button onClick={() => setFilter('all')} className="mt-6 text-primary font-black uppercase tracking-widest text-[10px] hover:underline">
              CLEAR SELECTIONS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group relative bg-white rounded-[2.5rem] p-4 border border-gray-100 hover:border-transparent hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500">
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
                     <Link to={`/product/${product.id}`} className="w-full py-4 bg-white/95 backdrop-blur-md text-gray-900 rounded-[1.2rem] text-center font-black text-[10px] uppercase tracking-widest shadow-xl block hover:bg-white active:scale-95 transition-all outline-none">
                        VIEW DETAIL
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

      </div>
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic active:scale-95 ${active
          ? 'bg-primary text-white shadow-lg shadow-primary/20'
          : 'text-gray-400 hover:text-gray-900'
        }`}
    >
      {children}
    </button>
  );
}
