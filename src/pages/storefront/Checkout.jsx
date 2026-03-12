import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Truck, MapPin, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/api';
import { searchDestination, getShippingCost, COURIERS } from '../../services/shipping';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, openLoginModal } = useAuth();

  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gate: if no user, show login modal immediately (but don't navigate away)
  useEffect(() => {
    if (!user) {
      openLoginModal(null, 'checkout');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Base Form Data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '' // Street-level address
  });

  // Destination search state
  const [destSearch, setDestSearch] = useState('');
  const [destResults, setDestResults] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null); // { id, label }
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  // Shipping state
  const [selectedCourier, setSelectedCourier] = useState('');
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced destination search
  useEffect(() => {
    if (destSearch.length < 3) {
      setDestResults([]);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchDestination(destSearch);
      setDestResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 500);
  }, [destSearch]);

  // Fetch shipping rates  when destination + courier are selected
  useEffect(() => {
    if (selectedDest && selectedCourier) {
      setLoadingShipping(true);
      setSelectedService(null);
      // 500g per item (typical hijab weight)
      const totalWeight = cartItems.reduce((acc, item) => acc + (item.quantity * 500), 0);
      getShippingCost(selectedDest.id, totalWeight, selectedCourier).then(rates => {
        setShippingRates(rates);
        setLoadingShipping(false);
      });
    }
  }, [selectedDest, selectedCourier, cartItems]);

  // Redirect if cart is empty
  if (cartItems.length === 0 && !isSuccess) {
    navigate('/cart');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectDest = (dest) => {
    // Komerce returns: { id, subdistrict_name, city_name, province, zip_code }
    const label = dest.label ||
      [dest.subdistrict_name, dest.city_name, dest.province].filter(Boolean).join(', ');
    const id = dest.id || dest.destination_id || dest.destination_code;
    setSelectedDest({ id, label });
    setDestSearch(label);
    setShowResults(false);
    setShippingRates([]);
    setSelectedService(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      openLoginModal(null, 'checkout');
      return;
    }

    if (!selectedDest) {
      alert('Harap cari dan pilih kecamatan tujuan pengiriman Anda.');
      return;
    }
    if (!selectedService) {
      alert('Harap pilih layanan kurir terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const shippingCostValue = selectedService.cost[0].value;
      const courierStr = `${selectedCourier.toUpperCase()} - ${selectedService.service}`;
      const fullAddress = `${formData.address}, ${selectedDest.label}`;

      const orderData = {
        customer_name: formData.name,
        customer_phone: formData.phone,
        total_amount: getCartTotal() + shippingCostValue,
        status: 'pending',
        user_id: user.id,
        shipping_address: fullAddress,
        shipping_courier: courierStr,
        shipping_cost: shippingCostValue,
      };

      const { error } = await createOrder(orderData, cartItems);
      if (error) throw error;

      clearCart();
      setIsSuccess(true);
      setTimeout(() => navigate('/'), 5000);
    } catch (error) {
      alert('Terjadi kesalahan saat memproses pesanan: ' + error.message);
      setIsSubmitting(false);
    }
  };

  /* ─── Success Screen ─── */
  if (isSuccess) {
    return (
      <div className="bg-gray-50 min-h-screen py-24 flex items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm text-center max-w-lg w-full mx-4">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Pemesanan Berhasil!</h2>
          <p className="text-gray-500 mb-8">Terima kasih atas pesanan Anda. Kami akan segera memprosesnya dan menghubungi Anda melalui WhatsApp.</p>
          <p className="text-sm text-gray-400">Mengalihkan ke halaman utama...</p>
        </div>
      </div>
    );
  }

  const shippingCostValue = selectedService?.cost[0]?.value ?? 0;

  /* ─── Main Checkout Form ─── */
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
            <div className="space-y-10">

              {/* ── 1. Contact Info ── */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Informasi Kontak</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required
                      className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 border" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Nomor WhatsApp</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required
                      className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 border" />
                  </div>
                </div>
              </div>

              {/* ── 2. Shipping Address ── */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Alamat Pengiriman
                </h2>

                {/* Destination Search */}
                <div className="mb-4 relative" ref={searchRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cari Kecamatan / Kota Tujuan</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cth: Pasar Kemis, Cikupa, Kebayoran..."
                      value={destSearch}
                      onChange={e => { setDestSearch(e.target.value); setSelectedDest(null); }}
                      onFocus={() => destResults.length > 0 && setShowResults(true)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      </div>
                    )}
                  </div>
                  {/* Dropdown results */}
                  {showResults && destResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto">
                      {destResults.map((dest, i) => (
                        <button
                          key={dest.id || i}
                          type="button"
                          onMouseDown={() => handleSelectDest(dest)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b last:border-0 border-gray-100"
                        >
                          <span className="font-medium text-gray-900">{dest.subdistrict_name || dest.label}</span>
                          {(dest.city_name || dest.province) && (
                            <span className="text-gray-500 ml-2">— {[dest.city_name, dest.province].filter(Boolean).join(', ')}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedDest && (
                    <p className="mt-2 text-xs text-green-600 font-medium">✓ Terpilih: {selectedDest.label}</p>
                  )}
                </div>

                {/* Street Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan)</label>
                  <textarea id="address" name="address" rows={3} value={formData.address}
                    onChange={handleInputChange} required
                    placeholder="Cth: Jl. Mawar No. 10, RT 03/RW 05, depan masjid Al-Hidayah"
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 border placeholder-gray-400" />
                </div>
              </div>

              {/* ── 3. Courier Selection ── */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" /> Pilih Kurir
                </h2>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
                  {COURIERS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      disabled={!selectedDest}
                      onClick={() => setSelectedCourier(c.value)}
                      className={`py-2.5 px-2 border rounded-xl text-xs font-bold text-center uppercase tracking-wide transition-all
                        ${!selectedDest ? 'opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400'
                        : selectedCourier === c.value
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-1'
                          : 'border-gray-200 hover:border-primary hover:bg-gray-50 text-gray-600'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {!selectedDest && (
                  <p className="text-xs text-gray-400 italic">Pilih kecamatan tujuan terlebih dahulu untuk mengaktifkan pilihan kurir.</p>
                )}

                {/* Shipping Rates */}
                {selectedDest && selectedCourier && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    {loadingShipping ? (
                      <div className="flex items-center justify-center gap-3 py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                        <span className="text-sm text-gray-500">Mengkalkulasi ongkir dari Pasar Kemis...</span>
                      </div>
                    ) : shippingRates.length === 0 ? (
                      <p className="text-sm text-red-500 text-center py-4">Tidak ada layanan tersedia untuk kurir ini ke tujuan tersebut.</p>
                    ) : (
                      <div className="space-y-3">
                        {shippingRates.map((rate, idx) => (
                          <label key={idx}
                            className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${selectedService?.service === rate.service ? 'border-primary bg-white shadow ring-1 ring-primary' : 'border-gray-200 bg-white hover:border-gray-400'}`}>
                            <input
                              type="radio"
                              name="shipping_service"
                              className="h-4 w-4 mt-0.5 text-primary border-gray-300"
                              checked={selectedService?.service === rate.service}
                              onChange={() => setSelectedService(rate)}
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between">
                                <span className="text-sm font-semibold text-gray-900">{selectedCourier.toUpperCase()} {rate.service}</span>
                                <span className="text-sm font-bold text-gray-900">Rp {Number(rate.cost[0].value).toLocaleString('id-ID')}</span>
                              </div>
                              <span className="text-xs text-gray-500 mt-1 block">{rate.description} · Estimasi: {rate.cost[0].etd}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── 4. Payment Summary ── */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
                <h3 className="text-base font-bold text-gray-900 mb-4">Ringkasan Pembayaran</h3>

                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <p>Subtotal Produk ({cartItems.length} item)</p>
                    <p className="font-medium text-gray-900">Rp {getCartTotal().toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <p>Ongkos Kirim {selectedService ? `(${selectedCourier.toUpperCase()} ${selectedService.service})` : ''}</p>
                    <p className="font-medium text-gray-900">
                      {selectedService ? `Rp ${shippingCostValue.toLocaleString('id-ID')}` : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <p>Total</p>
                  <p className="text-primary">Rp {(getCartTotal() + shippingCostValue).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* ── 5. Payment Method ── */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-primary rounded-xl bg-primary/5 cursor-pointer ring-1 ring-primary">
                    <input type="radio" name="payment_method" defaultChecked className="h-4 w-4 text-primary border-gray-300" />
                    <span className="ml-3 text-sm font-medium text-gray-700">Transfer Bank (BCA / Mandiri / BSI)</span>
                  </label>
                  <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-not-allowed opacity-60">
                    <input type="radio" name="payment_method" disabled className="h-4 w-4 text-gray-400 border-gray-300" />
                    <span className="ml-3 text-sm font-medium text-gray-400">Cash on Delivery (COD) — <span className="text-xs">Segera Hadir</span></span>
                  </label>
                </div>
              </div>

              {/* ── Submit ── */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedService}
                  className="w-full bg-primary hover:bg-primary-dark transition-colors rounded-full shadow-sm py-4 px-4 text-lg font-semibold text-white flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Memproses Pesanan...' : 'Selesaikan Pesanan'}
                </button>
                {!selectedService && (
                  <p className="text-center text-xs text-gray-400 mt-3">Pilih layanan pengiriman untuk melanjutkan.</p>
                )}
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
