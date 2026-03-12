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
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-8">Keranjang Belanja</h1>
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-medium text-gray-900 mb-2">Login untuk melihat keranjang</h2>
            <p className="text-gray-500 mb-8">Daftar atau masuk ke akun untuk menyimpan dan melihat item di keranjang belanja Anda.</p>
            <button
              onClick={() => openLoginModal(null, 'keranjang')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-primary hover:bg-primary-dark transition-colors"
            >
              Masuk / Daftar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-8">Keranjang Belanja</h1>

        {loadingCart ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-medium text-gray-900 mb-2">Keranjang belanja Anda kosong</h2>
            <p className="text-gray-500 mb-8">Wah, keranjang belanjamu masih kosong nih. Yuk, cari produk menarik di katalog kami!</p>
            <Link to="/catalog" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-primary hover:bg-primary-dark transition-colors">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">

            {/* Cart Items */}
            <div className="lg:col-span-7">
              <ul role="list" className="border-t border-gray-200 divide-y divide-gray-200 bg-white shadow-sm rounded-2xl p-6">
                {cartItems.map((item) => {
                  const product = item.product;
                  if (!product) return null;

                  // Use first image of images array, or fallback to older image_url, or placeholder
                  const imageSrc = (product.images && product.images.length > 0) ? product.images[0] : (product.image_url || 'https://via.placeholder.com/200x200?text=No+Image');

                  return (
                    <li key={item.id} className="flex py-6 sm:py-10">
                      <div className="flex-shrink-0">
                        <img src={imageSrc} alt={product.name} className="w-24 h-24 rounded-lg object-cover object-center sm:w-32 sm:h-32 bg-gray-100" />
                      </div>

                      <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                        <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                          <div>
                            <div className="flex justify-between">
                              <h3 className="text-sm">
                                <Link to={`/product/${product.id}`} className="font-medium text-gray-700 hover:text-gray-800 line-clamp-2">
                                  {product.name}
                                </Link>
                              </h3>
                            </div>
                            {item.selected_color && (
                              <p className="mt-1 text-xs text-gray-500">
                                Varian: <span className="font-semibold text-gray-700">{item.selected_color}</span>
                              </p>
                            )}
                            <p className="mt-2 text-sm font-bold text-gray-900">Rp {product.price.toLocaleString('id-ID')}</p>
                          </div>

                          <div className="mt-4 sm:mt-0 sm:pr-9 flex items-center">
                            <label htmlFor={`quantity-${item.id}`} className="sr-only">Quantity, {product.name}</label>
                            <select
                              id={`quantity-${item.id}`}
                              name={`quantity-${item.id}`}
                              className="max-w-full rounded-md border border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
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
                                className="-m-2 p-2 inline-flex text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <span className="sr-only">Remove</span>
                                <Trash2 className="w-5 h-5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 flex text-sm text-gray-700 space-x-2">
                          <ShoppingBag className="flex-shrink-0 h-5 w-5 text-primary" aria-hidden="true" />
                          <span>{product.is_preorder ? 'Pre-order item' : 'Ready Stock'}</span>
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Order Summary */}
            <div className="mt-16 bg-white shadow-sm rounded-2xl p-6 lg:mt-0 lg:col-span-5">
              <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
                Order summary
              </h2>

              <dl className="mt-6 space-y-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-gray-900">Rp {subtotal.toLocaleString('id-ID')}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="flex items-center text-sm">
                    <span>Shipping estimate</span>
                  </dt>
                  <dd className="font-medium text-gray-900">Calculated at checkout</dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-medium text-gray-900">Order total</dt>
                  <dd className="text-base font-medium text-primary">Rp {subtotal.toLocaleString('id-ID')}</dd>
                </div>
              </dl>

              <div className="mt-6">
                {user ? (
                  <Link
                    to="/checkout"
                    className="w-full bg-primary hover:bg-primary-dark transition-colors border border-transparent rounded-full shadow-sm py-4 px-4 text-base font-medium text-white flex justify-center items-center"
                  >
                    Checkout
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => openLoginModal(() => navigate('/checkout'), 'checkout')}
                    className="w-full bg-primary hover:bg-primary-dark transition-colors border border-transparent rounded-full shadow-sm py-4 px-4 text-base font-medium text-white flex justify-center items-center"
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
