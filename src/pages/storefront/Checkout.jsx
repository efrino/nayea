import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { createOrder } from '../../services/api';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();

  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // From data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Redirect if cart is empty
  if (cartItems.length === 0 && !isSuccess) {
    navigate('/cart');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderData = {
        customer_name: formData.name,
        customer_phone: formData.phone,
        total_amount: getCartTotal(),
        status: 'pending'
      };

      const { data, error } = await createOrder(orderData, cartItems);

      if (error) throw error;

      // Sukses
      clearCart();
      setIsSuccess(true);

      // Auto redirect after 4 seconds
      setTimeout(() => {
        navigate('/');
      }, 4000);

    } catch (error) {
      alert("Terjadi kesalahan saat memproses pesanan: " + error.message);
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-gray-50 min-h-screen py-24 flex items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm text-center max-w-lg w-full mx-4">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Pemesanan Berhasil!</h2>
          <p className="text-gray-500 mb-8">Terima kasih atas pesanan Anda. Kami telah menerima detail pesanan dan akan segera memprosesnya.</p>
          <p className="text-sm text-gray-400">Mengalihkan ke halaman utama...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <nav className="flex mb-8" aria-label="Breadcrumb">
          <Link to="/cart" className="flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Keranjang
          </Link>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-8">Checkout</h1>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10">
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">

              {/* Customer Info */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Kontak & Pengiriman</h2>
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                    <div className="mt-1">
                      <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 px-3 border" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Nomor WhatsApp</label>
                    <div className="mt-1">
                      <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 px-3 border" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat Lengkap (Beserta Kode Pos)</label>
                    <div className="mt-1">
                      <textarea id="address" name="address" rows={3} value={formData.address} onChange={handleInputChange} required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 px-3 border" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary (Mini) */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-3">Ringkasan Pesanan ({cartItems.length} Produk)</h3>
                <div className="flex justify-between text-base font-bold text-gray-900">
                  <p>Total Harga</p>
                  <p className="text-primary">Rp {getCartTotal().toLocaleString('id-ID')}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">*Belum termasuk ongkos kirim. Admin akan menghubungi Anda untuk detail pengiriman.</p>
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Metode Pembayaran</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input id="bank_transfer" name="payment_method" type="radio" defaultChecked className="focus:ring-primary h-4 w-4 text-primary border-gray-300" />
                    <label htmlFor="bank_transfer" className="ml-3 block text-sm font-medium text-gray-700">Transfer Bank (BCA / Mandiri / BSI)</label>
                  </div>
                  <div className="flex items-center">
                    <input id="cod" name="payment_method" type="radio" disabled className="focus:ring-primary h-4 w-4 text-gray-400 border-gray-300" />
                    <label htmlFor="cod" className="ml-3 block text-sm font-medium text-gray-400">Cash on Delivery (COD) - <span className="text-xs">Segera Hadir</span></label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary-dark transition-colors border border-transparent rounded-full shadow-sm py-4 px-4 text-lg font-medium text-white flex justify-center items-center disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Selesaikan Pesanan'}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
