import { Link } from 'react-router-dom';
import { ArrowRight, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const subtotal = getCartTotal();

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-8">Your Cart</h1>

        {cartItems.length === 0 ? (
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
                {cartItems.map((item) => (
                  <li key={item.id} className="flex py-6 sm:py-10">
                    <div className="flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-24 h-24 rounded-lg object-cover object-center sm:w-32 sm:h-32 bg-gray-100" />
                    </div>

                    <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                      <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-sm">
                              <Link to={`/product/${item.id}`} className="font-medium text-gray-700 hover:text-gray-800 line-clamp-2">
                                {item.name}
                              </Link>
                            </h3>
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-900">Rp {item.price.toLocaleString('id-ID')}</p>
                        </div>

                        <div className="mt-4 sm:mt-0 sm:pr-9 flex items-center">
                          <label htmlFor={`quantity-${item.id}`} className="sr-only">Quantity, {item.name}</label>
                          <select
                            id={`quantity-${item.id}`}
                            name={`quantity-${item.id}`}
                            className="max-w-full rounded-md border border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                          >
                            {/* Create options dynamically based on available stock, max 10 for display purposes */}
                            {[...Array(Math.min(item.stock, 10)).keys()].map((n) => (
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
                        <span>{item.is_preorder ? 'Pre-order item' : 'Ready Stock'}</span>
                      </p>
                    </div>
                  </li>
                ))}
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
                <Link to="/checkout" className="w-full bg-primary hover:bg-primary-dark transition-colors border border-transparent rounded-full shadow-sm py-4 px-4 text-base font-medium text-white flex justify-center items-center">
                  Checkout
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
