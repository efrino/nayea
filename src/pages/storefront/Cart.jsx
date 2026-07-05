import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, ShoppingBag, Lock } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, loadingCart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { user, openLoginModal } = useAuth();
  const subtotal = getCartTotal();

  // Gate: if no user, show login modal immediately when cart is visited
  useEffect(() => {
    if (!user) {
      openLoginModal(null, 'keranjang');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Guest view — locked state (modal also opens automatically above)
  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">My Bag</span>
          <h1 className="text-4xl sm:text-5xl font-black font-heading text-gray-900 tracking-tighter italic uppercase mb-10">Keranjang Belanja</h1>
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-primary/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black font-heading text-gray-900 italic uppercase mb-2">Login untuk melihat keranjang</h2>
            <p className="text-gray-500 font-medium mb-8">Daftar atau masuk ke akun untuk menyimpan dan melihat item di keranjang belanja Anda.</p>
            <button
              onClick={() => openLoginModal(null, 'keranjang')}
              className="inline-flex items-center px-8 py-4 gradient-primary text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Masuk / Daftar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">My Bag</span>
        <h1 className="text-4xl sm:text-5xl font-black font-heading text-gray-900 tracking-tighter italic uppercase mb-10">Keranjang Belanja</h1>

        {loadingCart ? (
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-black font-heading text-gray-900 italic uppercase mb-2">Keranjang belanja Anda kosong</h2>
            <p className="text-gray-500 font-medium mb-8">Wah, keranjang belanjamu masih kosong nih. Yuk, cari produk menarik di katalog kami!</p>
            <Link to="/catalog" className="inline-flex items-center px-8 py-4 gradient-primary text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">

            {/* Cart Items */}
            <div className="lg:col-span-7">
              <ul role="list" className="border-t border-gray-100 divide-y divide-gray-100 bg-white shadow-sm rounded-[2.5rem] p-6 border border-gray-100">
                {cartItems.map((item) => {
                  const product = item.product;
                  if (!product) return null;

                  // Use first image of images array, or fallback to older image_url, or placeholder
                  const imageSrc = (product.images && product.images.length > 0) ? product.images[0] : (product.image_url || 'https://via.placeholder.com/200x200?text=No+Image');

                  return (
                    <li key={item.id} className="flex py-6 sm:py-10">
                      <div className="flex-shrink-0">
                        <img src={imageSrc} alt={product.name} className="w-24 h-24 rounded-[1.5rem] object-cover object-center sm:w-32 sm:h-32 bg-gray-100" />
                      </div>

                      <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                        <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                          <div>
                            <div className="flex justify-between">
                              <h3 className="text-sm">
                                <Link to={`/product/${product.id}`} className="font-black font-heading uppercase italic text-gray-900 hover:text-primary line-clamp-2 transition-colors">
                                  {product.name}
                                </Link>
                              </h3>
                            </div>
                            {item.selected_color && (
                              <p className="mt-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Varian: <span className="text-gray-700">{item.selected_color}</span>
                              </p>
                            )}
                            <p className="mt-2 text-sm font-black text-gray-900 italic">Rp {product.price.toLocaleString('id-ID')}</p>
                          </div>

                          <div className="mt-4 sm:mt-0 sm:pr-9 flex items-center">
                            <label htmlFor={`quantity-${item.id}`} className="sr-only">Quantity, {product.name}</label>
                            <select
                              id={`quantity-${item.id}`}
                              name={`quantity-${item.id}`}
                              className="max-w-full rounded-[1rem] border border-gray-200 py-2 px-3 text-sm font-black text-gray-700 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                            >
                              {/* Create options dynamically based on available stock, max 10 for display purposes */}
                              {[...Array(Math.min(product.stock, 10)).keys()].map((n) => (
                                <option key={n + 1} value={n + 1}>{n + 1}</option>
                              ))}
                            </select>

                            <div className="absolute top-0 right-0">
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="-m-2 p-2 inline-flex text-gray-400 hover:text-rose-500 transition-colors"
                              >
                                <span className="sr-only">Remove</span>
                                <Trash2 className="w-5 h-5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest gap-2">
                          <ShoppingBag className="flex-shrink-0 h-4 w-4 text-primary" aria-hidden="true" />
                          <span>{product.is_preorder ? 'Pre-order item' : 'Ready Stock'}</span>
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Order Summary */}
            <div className="mt-16 bg-white shadow-sm rounded-[2.5rem] border border-gray-100 p-8 lg:mt-0 lg:col-span-5">
              <h2 id="summary-heading" className="text-lg font-black font-heading text-gray-900 uppercase italic tracking-tight">
                Order Summary
              </h2>

              <dl className="mt-6 space-y-4 text-sm text-gray-500 font-medium">
                <div className="flex items-center justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-black text-gray-900">Rp {subtotal.toLocaleString('id-ID')}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <dt className="flex items-center text-sm">
                    <span>Shipping estimate</span>
                  </dt>
                  <dd className="font-black text-gray-900">Calculated at checkout</dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <dt className="text-base font-black text-gray-900 uppercase italic">Order total</dt>
                  <dd className="text-base font-black text-primary italic">Rp {subtotal.toLocaleString('id-ID')}</dd>
                </div>
              </dl>

              <div className="mt-8">
                {user ? (
                  <Link
                    to="/checkout"
                    className="w-full gradient-primary transition-all shadow-xl active:scale-95 rounded-[1.5rem] py-5 px-4 text-[11px] font-black uppercase tracking-widest text-white flex justify-center items-center"
                  >
                    Checkout
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => openLoginModal(() => navigate('/checkout'), 'checkout')}
                    className="w-full gradient-primary transition-all shadow-xl active:scale-95 rounded-[1.5rem] py-5 px-4 text-[11px] font-black uppercase tracking-widest text-white flex justify-center items-center"
                  >
                    Checkout
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
