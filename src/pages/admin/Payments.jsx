import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  CreditCard, 
  Search, 
  ExternalLink, 
  CheckCircle, 
  XSquare, 
  Clock, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Payments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
    
    // Subscribe to changes
    const channel = supabase
      .channel('payments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      // Update payment_status and also the main order status if paid
      const updates = { 
        payment_status: newStatus 
      };
      
      if (newStatus === 'paid') {
        updates.status = 'paid';
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
      // fetchOrders will be triggered by subscription
    } catch (err) {
      alert('Error updating status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toString().includes(searchTerm);
    
    const matchesFilter = 
      statusFilter === 'ALL' || 
      order.payment_status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_verification': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'unpaid': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Manajemen Pembayaran
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kelola konfirmasi pembayaran transfer bank manual dari customer.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          <Clock className="w-3.5 h-3.5" />
          Real-time Update Active
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama customer atau ID pesanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent appearance-none transition-all outline-none text-sm bg-white"
          >
            <option value="ALL">Semua Status</option>
            <option value="unpaid">Belum Bayar</option>
            <option value="pending_verification">Pending Verifikasi</option>
            <option value="paid">Sudah Bayar</option>
          </select>
        </div>
        <button 
          onClick={fetchOrders}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Perlu Verifikasi</p>
            <p className="text-xl font-bold text-gray-900">
              {orders.filter(o => o.payment_status === 'pending_verification').length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Terverifikasi</p>
            <p className="text-xl font-bold text-gray-900">
              {orders.filter(o => o.payment_status === 'paid').length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Belum Bayar</p>
            <p className="text-xl font-bold text-gray-900">
              {orders.filter(o => o.payment_status === 'unpaid').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="p-20 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Memuat data pembayaran...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-20 text-center text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Tidak ada data pembayaran yang ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-900">ID & Tanggal</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Total Tagihan</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Metode</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-900 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">#{order.id?.toString().slice(-4).toUpperCase() || 'N/A'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.customer_phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-primary">{formatPrice(order.total_amount)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Sudah termasuk ongkir</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 uppercase text-[10px] font-bold tracking-wider">{order.payment_method?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.payment_status)}`}>
                        {order.payment_status === 'pending_verification' ? 'Pending Verif' : 
                         order.payment_status === 'paid' ? 'Terbayar' : 'Belum Bayar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.payment_status !== 'paid' && (
                          <button
                            onClick={() => updatePaymentStatus(order.id, 'paid')}
                            disabled={updatingId === order.id}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            title="Tandai Sudah Bayar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {order.payment_status === 'paid' && (
                          <button
                            onClick={() => updatePaymentStatus(order.id, 'unpaid')}
                            disabled={updatingId === order.id}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition-all border border-gray-200 disabled:opacity-50"
                            title="Batalkan Status Bayar"
                          >
                            <XSquare className="w-4 h-4" />
                          </button>
                        )}
                        <a 
                          href={`https://wa.me/${order.customer_phone?.replace(/[^\d+]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-primary hover:bg-primary-dark text-white p-2 rounded-lg transition-all shadow-sm active:scale-95"
                          title="Hubungi Customer via WhatsApp"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
