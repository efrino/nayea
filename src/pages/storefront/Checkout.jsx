import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Truck, MapPin, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/api';
import { searchDestination, getShippingRates } from '../../services/shipping';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, openLoginModal } = useAuth();

  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gate: if no user, show login modal immediately
  useEffect(() => {
    if (!user) openLoginModal(null, 'checkout');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Form data
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });

  // Destination search
  const [destSearch, setDestSearch]     = useState('');
  const [destResults, setDestResults]   = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);
  const [isSearching, setIsSearching]   = useState(false);
  const [showResults, setShowResults]   = useState(false);
  const searchRef   = useRef(null);
  const searchTimer = useRef(null);

  // Shipping
  const [shippingRates, setShippingRates]   = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError]   = useState('');

  // Filter chips state
  const [activeCourier, setActiveCourier] = useState('ALL');

  // Honeypot
  const [honey, setHoney] = useState('');

  /* ─── Close dest dropdown on outside click ─── */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── Debounced destination search ─── */
  useEffect(() => {
    // Prevent searching if input matches already selected destination
    if (selectedDest && destSearch === selectedDest.label) return;
    
    if (destSearch.length < 3) { setDestResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchDestination(destSearch, 15);
      setDestResults(results);
      setShowResults(results.length > 0);
      setIsSearching(false);
    }, 500);
  }, [destSearch, selectedDest]);
  /* ─── Fetch ALL courier rates when destination is selected ─── */
  useEffect(() => {
    if (!selectedDest) return;
    setLoadingShipping(true);
    setShippingRates([]);
    setSelectedService(null);
    setShippingError('');
    setActiveCourier('ALL');

    // Calculate total weight from cart items (product.weight in grams)
    const totalWeight = cartItems.reduce((sum, item) => {
      const perItemWeight = item.product?.weight || 500; // Default to 500g if missing
      return sum + (item.quantity * perItemWeight);
    }, 0);
    
    getShippingRates(selectedDest.id, totalWeight).then(rates => {
      setShippingRates(rates);
      setLoadingShipping(false);
      if (rates.length === 0) setShippingError('Tidak ada layanan kurir tersedia untuk tujuan ini.');
    });
  }, [selectedDest, cartItems]);

  // Redirect if cart empty — must be in useEffect, not render body
  useEffect(() => {
    if (cartItems.length === 0 && !isSuccess) navigate('/cart');
  }, [cartItems, isSuccess, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectDest = (dest) => {
    const label = [dest.subdistrict_name, dest.district_name, dest.city_name, dest.province]
      .filter(Boolean).join(', ');
    setSelectedDest({ id: dest.id, label });
    setDestSearch(label);
    setShowResults(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Bot check
    if (honey) {
      console.warn('Bot detected in checkout');
      setIsSuccess(true);
      return;
    }

    if (!user) { openLoginModal(null, 'checkout'); return; }
    if (!selectedDest) { alert('Harap pilih kecamatan tujuan pengiriman.'); return; }
    if (!selectedService) { alert('Harap pilih layanan kurir.'); return; }

    setIsSubmitting(true);
    // Extra safety: set a flag to prevent re-entry during the async call
    if (isSubmitting) return;
    try {
      const courierStr  = `${selectedService.courier} ${selectedService.service}`;
      const fullAddress = `${formData.address}, ${selectedDest.label}`;

      const orderData = {
        customer_name:    formData.name,
        customer_phone:   formData.phone,
        total_amount:     getCartTotal() + selectedService.price,
        status:           'pending',
        user_id:          user.id,
        shipping_address: fullAddress,
        shipping_courier: courierStr,
        shipping_cost:    selectedService.price,
        payment_method:   'bank_transfer',
        payment_status:   'unpaid',
      };

      const { error } = await createOrder(orderData, cartItems);
      if (error) throw error;

      clearCart();
      setIsSuccess(true);
      setTimeout(() => navigate('/'), 5000);
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
      setIsSubmitting(false);
    }
  };

  /* ─── Derived: filter chips from unique couriers in rates ─── */
  const courierNames = ['ALL', ...new Set(shippingRates.map(r => r.courier))];
  const filteredRates = activeCourier === 'ALL'
    ? shippingRates
    : shippingRates.filter(r => r.courier === activeCourier);

  const shippingCost = selectedService?.price ?? 0;
  const totalAmount = getCartTotal() + shippingCost;

  const handleWhatsAppRedir = () => {
    const adminPhone = "+6281234567890"; // Ganti dengan nomor WhatsApp admin Anda
    const orderItemsStr = cartItems.map(item => `- ${item.product.name} (${item.quantity}x)`).join('%0A');
    const msg = `Halo Admin Nayea! Saya ingin konfirmasi pesanan:%0A%0A` +
                `*Nama:* ${formData.name}%0A` +
                `*Total:* Rp ${totalAmount.toLocaleString('id-ID')}%0A` +
                `*Kurir:* ${selectedService.courier} ${selectedService.service}%0A` +
                `*Alamat:* ${formData.address}, ${selectedDest.label}%0A%0A` +
                `*Pesanan:*%0A${orderItemsStr}%0A%0A` +
                `Mohon instruksi selanjutnya untuk pembayaran. Terima kasih!`;
    window.open(`https://wa.me/${adminPhone.replace('+', '')}?text=${msg}`, '_blank');
  };

  /* ─── Success Screen ─── */
  if (isSuccess) {
    return (
      <div className="bg-gray-50 min-h-screen py-24 flex items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm text-center max-w-lg w-full mx-4 border border-gray-100">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Pemesanan Dicatat!</h2>
          <p className="text-gray-500 mb-8">Terima kasih! Pesanan Anda telah tersimpan. Silakan klik tombol di bawah untuk konfirmasi via WhatsApp agar segera diproses.</p>
          
          <div className="space-y-4">
            <button
              onClick={handleWhatsAppRedir}
              className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              Konfirmasi via WhatsApp
            </button>
            <Link to="/" className="block text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main Checkout Form ─── */
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex mb-8">
          <Link to="/cart" className="flex items-center text-sm font-medium text-gray-500 hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Keranjang
          </Link>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10">
          <form onSubmit={handleSubmit}>
            <div className="space-y-10">

              {/* ── 1. Contact Info ── */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Informasi Kontak</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input type="text" id="name" name="name" required value={formData.name} onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                    <input type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cari Kecamatan / Kota Tujuan
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cth: Pasar Kemis, Cikupa, Kebayoran Baru..."
                      value={destSearch}
                      onChange={e => { setDestSearch(e.target.value); setSelectedDest(null); setShippingRates([]); setSelectedService(null); }}
                      onFocus={() => destResults.length > 0 && setShowResults(true)}
                      className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Dropdown */}
                  {showResults && destResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-40 max-h-60 overflow-y-auto">
                      {destResults.map((dest, i) => (
                        <button
                          key={dest.id ?? i}
                          type="button"
                          onMouseDown={() => handleSelectDest(dest)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b last:border-0 border-gray-100"
                        >
                          <span className="font-medium text-gray-900">{dest.subdistrict_name}</span>
                          <span className="text-gray-500 ml-2 text-xs">
                            {[dest.district_name, dest.city_name, dest.province].filter(Boolean).join(', ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedDest && (
                    <p className="mt-1.5 text-xs text-green-600 font-medium">✓ {selectedDest.label}</p>
                  )}
                </div>

                {/* Street Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan)
                  </label>
                  <textarea
                    id="address" name="address" rows={3} required
                    value={formData.address} onChange={handleInputChange}
                    placeholder="Cth: Jl. Melati No. 5, RT 02/RW 04, dekat Indomaret"
                    className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
                  />
                </div>
              </div>

              {/* ── 3. Shipping Rate Selection ── */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" /> Pilih Layanan Pengiriman
                </h2>

                {!selectedDest ? (
                  <p className="text-sm text-gray-400 italic">Pilih kecamatan tujuan terlebih dahulu untuk melihat tarif pengiriman.</p>
                ) : loadingShipping ? (
                  <div className="flex items-center gap-3 py-6 justify-center bg-gray-50 rounded-xl border border-gray-200">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="text-sm text-gray-500">Mencari tarif dari Pasar Kemis, Tangerang...</span>
                  </div>
                ) : shippingError ? (
                  <p className="text-sm text-red-500 text-center py-4">{shippingError}</p>
                ) : (
                  <>
                    {/* Courier filter chips */}
                    <div className="flex gap-2 flex-wrap mb-4">
                      {courierNames.map(name => (
                        <button
                          key={name} type="button"
                          onClick={() => setActiveCourier(name)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                            ${activeCourier === name
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary'}`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>

                    {/* Rate list */}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {filteredRates.map((rate, idx) => (
                        <label key={idx}
                          className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all
                            ${selectedService && selectedService.courier === rate.courier && selectedService.service === rate.service
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-gray-200 bg-white hover:border-gray-400'}`}
                        >
                          <input
                            type="radio" name="shipping_service"
                            className="h-4 w-4 text-primary border-gray-300 shrink-0"
                            checked={!!(selectedService && selectedService.courier === rate.courier && selectedService.service === rate.service)}
                            onChange={() => setSelectedService(rate)}
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {rate.courier} <span className="font-normal text-gray-600">{rate.service}</span>
                              </span>
                              <span className="text-sm font-bold text-gray-900 shrink-0">
                                Rp {rate.price.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">{rate.description} · Est. {rate.etd}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* ── 4. Payment Summary ── */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Ringkasan Pembayaran</h3>
                <div className="space-y-2.5 mb-4 pb-4 border-b border-gray-200 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal Produk ({cartItems.length} item)</span>
                    <span className="font-medium text-gray-900">Rp {getCartTotal().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Ongkos Kirim {selectedService ? `(${selectedService.courier} ${selectedService.service})` : ''}</span>
                    <span className="font-medium text-gray-900">
                      {selectedService ? `Rp ${shippingCost.toLocaleString('id-ID')}` : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-primary">
                    Rp {(getCartTotal() + shippingCost).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* ── 5. Payment Method ── */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
                <div className="space-y-3">
                  <div className="p-5 border border-primary rounded-2xl bg-primary/5 ring-1 ring-primary space-y-4">
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" name="payment_method" defaultChecked className="h-4 w-4 text-primary border-gray-300" />
                      <span className="ml-3 text-sm font-bold text-gray-900">Transfer Bank Manual</span>
                    </label>
                    <div className="pl-7 space-y-3 text-sm text-gray-600 border-t border-primary/10 pt-4">
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-primary/20">
                        <div>
                          <p className="text-xs text-gray-400">BCA</p>
                          <p className="font-mono font-bold text-gray-900">1234567890</p>
                          <p className="text-[10px]">a/n NAYEA OFFICIAL</p>
                        </div>
                        <button type="button" onClick={() => navigator.clipboard.writeText('1234567890')} className="text-xs text-primary font-bold">Salin</button>
                      </div>
                      <p className="text-[11px] leading-relaxed italic">* Harap simpan bukti transfer untuk dikonfirmasikan via WhatsApp setelah klik tombol "Selesaikan Pesanan".</p>
                    </div>
                  </div>
                  <label className="flex items-center p-4 border border-gray-200 rounded-2xl opacity-50 cursor-not-allowed">
                    <input type="radio" name="payment_method" disabled className="h-4 w-4 text-gray-400 border-gray-300" />
                    <span className="ml-3 text-sm font-medium text-gray-400">QRIS (Segera Hadir)</span>
                  </label>
                </div>
              </div>

              {/* Honeypot - Hidden from humans */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="user_confirm_field"
                  tabIndex="-1"
                  autoComplete="off"
                  value={honey}
                  onChange={e => setHoney(e.target.value)}
                />
              </div>

              {/* ── Submit ── */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedService}
                  className="w-full bg-primary hover:bg-primary-dark transition-colors rounded-full py-4 px-6 text-lg font-semibold text-white flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Memproses Pesanan...' : 'Selesaikan Pesanan'}
                </button>
                {!selectedService && (
                  <p className="text-center text-xs text-gray-400 mt-2">Pilih layanan pengiriman untuk melanjutkan.</p>
                )}
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
