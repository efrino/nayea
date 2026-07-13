import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  Lock,
  Plus,
  Edit2,
  Trash2,
  Star,
  X,
  ShoppingBag,
  LogOut,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getMyOrders,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../services/api';

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  shipped: 'bg-blue-50 text-blue-600 border-blue-100',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
};

const TABS = [
  { key: 'account', label: 'Info Akun', icon: User },
  { key: 'orders', label: 'Riwayat Pesanan', icon: Package },
  { key: 'addresses', label: 'Alamat Tersimpan', icon: MapPin },
];

const VALID_TABS = TABS.map((t) => t.key);

export default function Profile() {
  const { user, openLoginModal, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(VALID_TABS.includes(initialTab) ? initialTab : 'account');

  const handleTabChange = (key) => {
    setActiveTab(key);
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!user) openLoginModal(null, 'profil');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return (
      <div className="bg-cream min-h-screen py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">My Account</span>
          <h1 className="text-4xl sm:text-5xl font-black font-heading text-primary tracking-tighter italic uppercase mb-10">Profil Saya</h1>
          <div className="bg-white rounded-[3rem] border border-oat shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-primary/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black font-heading text-primary italic uppercase mb-2">Login untuk melihat profil</h2>
            <p className="text-secondary font-medium mb-8">Daftar atau masuk ke akun untuk melihat riwayat pesanan dan alamat tersimpan Anda.</p>
            <button
              onClick={() => openLoginModal(null, 'profil')}
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
    <div className="bg-cream min-h-screen py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">My Account</span>
        <h1 className="text-4xl sm:text-5xl font-black font-heading text-primary tracking-tighter italic uppercase mb-10">Profil Saya</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-10 lg:items-start">
          {/* Sidebar */}
          <div className="lg:col-span-3 mb-8 lg:mb-0">
            <div className="bg-white rounded-[2.5rem] border border-oat shadow-sm p-6 space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${
                      isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:bg-cream hover:text-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
              <div className="pt-2 mt-2 border-t border-cream">
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-9">
            {activeTab === 'account' && <AccountTab user={user} />}
            {activeTab === 'orders' && <OrdersTab userId={user.id} />}
            {activeTab === 'addresses' && <AddressesTab userId={user.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountTab({ user }) {
  const fullName = user.user_metadata?.full_name || 'Customer Nayea';
  const joinDate = new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-[2.5rem] border border-oat shadow-sm p-8 sm:p-10">
      <div className="flex items-center gap-5 mb-10 pb-10 border-b border-cream">
        <div className="w-20 h-20 rounded-[1.5rem] gradient-primary flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-primary/20 flex-shrink-0">
          {fullName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-black font-heading text-primary uppercase italic tracking-tight">{fullName}</h3>
          <p className="text-sm text-secondary font-medium mt-1">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 bg-cream rounded-[2rem] border border-oat">
          <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Nama Lengkap</p>
          <p className="text-sm font-black text-primary">{fullName}</p>
        </div>
        <div className="p-6 bg-cream rounded-[2rem] border border-oat">
          <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Email</p>
          <p className="text-sm font-black text-primary truncate">{user.email}</p>
        </div>
        <div className="p-6 bg-cream rounded-[2rem] border border-oat">
          <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Bergabung Sejak</p>
          <p className="text-sm font-black text-primary">{joinDate}</p>
        </div>
        <div className="p-6 bg-cream rounded-[2rem] border border-oat">
          <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Status Akun</p>
          <p className="text-sm font-black text-emerald-600 uppercase italic">Verified Account</p>
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await getMyOrders(userId);
      if (data) setOrders(data);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-oat shadow-sm p-20 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-oat shadow-sm p-16 text-center">
        <ShoppingBag className="w-16 h-16 text-oat mx-auto mb-4" />
        <h3 className="text-xl font-black font-heading text-primary italic uppercase mb-2">Belum ada pesanan</h3>
        <p className="text-secondary font-medium mb-8">Riwayat belanja Anda akan muncul di sini setelah checkout pertama.</p>
        <Link to="/catalog" className="inline-flex items-center px-8 py-4 gradient-primary text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-[2.5rem] border border-oat shadow-sm p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-cream">
            <div>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest italic mb-1">
                Order #{order.id?.toString().slice(-6).toUpperCase()} &middot;{' '}
                {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-lg font-black text-primary italic">Rp {Number(order.total_amount).toLocaleString('id-ID')}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_STYLE[order.status] || STATUS_STYLE.pending}`}>
              {order.status}
            </span>
          </div>

          <div className="space-y-3">
            {(order.order_items || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cream border border-oat flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt={item.product?.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-secondary-light" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary truncate">{item.product?.name || 'Produk tidak tersedia'}</p>
                  <p className="text-[10px] text-secondary font-medium uppercase tracking-widest">{item.quantity}x &middot; Rp {Number(item.price).toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>

          {order.tracking_number && (
            <div className="mt-6 pt-6 border-t border-cream flex items-center gap-3">
              <Truck className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Nomor Resi</p>
                <p className="text-sm font-black text-primary">{order.tracking_number}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const emptyForm = { label: 'Rumah', recipient_name: '', phone: '', full_address: '' };

function AddressesTab({ userId }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchAddresses() {
    setLoading(true);
    const { data } = await getAddresses(userId);
    if (data) setAddresses(data);
    setLoading(false);
  }

  const openAddModal = () => {
    setEditId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (address) => {
    setEditId(address.id);
    setForm({
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone,
      full_address: address.full_address,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editId) {
        const { error } = await updateAddress(editId, form);
        if (error) throw error;
      } else {
        const { error } = await createAddress({ ...form, user_id: userId, is_default: addresses.length === 0 });
        if (error) throw error;
      }
      closeModal();
      fetchAddresses();
    } catch (err) {
      alert('Gagal menyimpan alamat: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus alamat ini?')) return;
    const { error } = await deleteAddress(id);
    if (error) alert('Gagal menghapus alamat: ' + error.message);
    else fetchAddresses();
  };

  const handleSetDefault = async (id) => {
    const { error } = await setDefaultAddress(userId, id);
    if (error) alert('Gagal mengubah alamat utama: ' + error.message);
    else fetchAddresses();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-oat shadow-sm p-20 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-6 py-3.5 gradient-primary text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Tambah Alamat
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-oat shadow-sm p-16 text-center">
          <MapPin className="w-16 h-16 text-oat mx-auto mb-4" />
          <h3 className="text-xl font-black font-heading text-primary italic uppercase mb-2">Belum ada alamat tersimpan</h3>
          <p className="text-secondary font-medium">Tambahkan alamat supaya checkout jadi lebih cepat lain kali.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-[2.5rem] border border-oat shadow-sm p-7 relative">
              {addr.is_default && (
                <span className="absolute top-7 right-7 flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest">
                  <Star className="w-3 h-3 fill-current" /> Utama
                </span>
              )}
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">{addr.label}</p>
              <h4 className="text-base font-black text-primary mb-1">{addr.recipient_name}</h4>
              <p className="text-xs text-secondary font-bold mb-3">{addr.phone}</p>
              <p className="text-sm text-secondary font-medium leading-relaxed mb-6">{addr.full_address}</p>

              <div className="flex items-center gap-2">
                {!addr.is_default && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="flex-1 py-3 rounded-[1.2rem] bg-cream text-secondary text-[10px] font-black uppercase tracking-widest hover:bg-oat transition-all"
                  >
                    Jadikan Utama
                  </button>
                )}
                <button
                  onClick={() => openEditModal(addr)}
                  className="p-3 rounded-[1.2rem] bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-3 rounded-[1.2rem] bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 sm:p-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black font-heading text-primary uppercase italic tracking-tight">
                {editId ? 'Edit Alamat' : 'Alamat Baru'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-full bg-cream text-secondary hover:text-primary transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Label Alamat</label>
                <input
                  type="text" required value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Rumah, Kantor, dll"
                  className="w-full px-6 py-4 rounded-[1.2rem] bg-cream border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Nama Penerima</label>
                <input
                  type="text" required value={form.recipient_name}
                  onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                  className="w-full px-6 py-4 rounded-[1.2rem] bg-cream border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Nomor WhatsApp</label>
                <input
                  type="tel" required value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-6 py-4 rounded-[1.2rem] bg-cream border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Alamat Lengkap</label>
                <textarea
                  rows={3} required value={form.full_address}
                  onChange={(e) => setForm({ ...form, full_address: e.target.value })}
                  placeholder="Jalan, No. Rumah, RT/RW, Kecamatan, Kota, Kode Pos"
                  className="w-full px-6 py-4 rounded-[1.2rem] bg-cream border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-medium transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 rounded-[1.5rem] bg-cream text-secondary text-xs font-black uppercase tracking-widest hover:bg-oat transition-all">
                  Batal
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="flex-[2] py-4 rounded-[1.5rem] gradient-primary text-white text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN ALAMAT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
