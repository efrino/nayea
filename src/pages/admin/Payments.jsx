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
  AlertCircle,
  TrendingUp,
  ArrowRight,
  MessageCircle
} from 'lucide-react';

export default function Payments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel('admin_payments_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const getStatusOverlay = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending_verification': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'unpaid': return 'bg-gray-50 text-gray-400 border-gray-100';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
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
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-heading text-gray-900 leading-tight">Verifikasi Pembayaran</h2>
          <p className="mt-1 text-gray-500">Pantau dan konfirmasi transfer manual secara real-time.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm animate-pulse-slow">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Tracking Active</span>
           </div>
        </div>
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Perlu Verifikasi', val: orders.filter(o => o.payment_status === 'pending_verification').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Total Terbayar', val: orders.filter(o => o.payment_status === 'paid').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Belum Bayar', val: orders.filter(o => o.payment_status === 'unpaid').length, icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-50' },
          { label: 'Total Transaksi', val: orders.length, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-premium border border-gray-50 hover:-translate-y-1 transition-transform">
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center`}>
                   <s.icon className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
                   <p className="text-2xl font-black font-heading text-gray-900 leading-none mt-1">{s.val}</p>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Filters & Control */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Customer atau Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-50 bg-white shadow-premium focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          {['ALL', 'pending_verification', 'paid', 'unpaid'].map(f => (
            <button
               key={f}
               onClick={() => setStatusFilter(f)}
               className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border whitespace-nowrap ${statusFilter === f ? 'gradient-primary text-white border-transparent' : 'bg-white text-gray-400 border-gray-50'}`}
            >
               {f.replace('_', ' ').replace('ALL', 'Semua')}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {loading && orders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] shadow-premium">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Menyesuaikan rekaman data...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] shadow-premium border border-gray-50">
             <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-100" />
             <p className="text-gray-400 font-medium italic italic">Tidak ada transaksi yang sesuai kriteria.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-[2rem] p-6 shadow-premium border border-gray-50 flex flex-col lg:flex-row items-center gap-6 group hover:shadow-xl transition-all duration-500"
            >
              {/* Order Avatar / Icon */}
              <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform ${getStatusOverlay(order.payment_status)}`}>
                 <CreditCard className="w-6 h-6" />
              </div>

              {/* Order Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                   <h3 className="text-lg font-black font-heading text-gray-900">#{order.id?.toString().slice(-6).toUpperCase()}</h3>
                   <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border ${getStatusOverlay(order.payment_status)}`}>
                     {order.payment_status?.replace('_', ' ')}
                   </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 font-medium italic">
                   <div className="flex items-center gap-1.5 uppercase tracking-tighter">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                   </div>
                   <div className="text-gray-200">|</div>
                   <div className="uppercase tracking-tighter">{order.payment_method?.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex flex-col items-center lg:items-end flex-1 min-w-[150px]">
                 <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{order.customer_name}</p>
                 <p className="text-xs text-gray-400 font-medium">{order.customer_phone}</p>
              </div>

              {/* Amount */}
              <div className="bg-gray-50 px-6 py-4 rounded-2xl flex flex-col items-center lg:items-end min-w-[150px]">
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">Total Bill</p>
                 <p className="text-lg font-black text-gray-900 mt-1">{formatPrice(order.total_amount)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                 {order.payment_status !== 'paid' ? (
                   <button 
                     onClick={() => updatePaymentStatus(order.id, 'paid')}
                     disabled={updatingId === order.id}
                     className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                   >
                     <CheckCircle className="w-5 h-5" />
                     <span className="text-xs font-black uppercase tracking-widest">Sahkan</span>
                   </button>
                 ) : (
                   <button 
                     onClick={() => updatePaymentStatus(order.id, 'unpaid')}
                     disabled={updatingId === order.id}
                     className="bg-white border border-gray-100 text-gray-400 p-4 rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all group/btn"
                     title="Batalkan Verifikasi"
                   >
                     <XSquare className="w-5 h-5" />
                   </button>
                 )}

                 <a 
                    href={`https://wa.me/${order.customer_phone?.replace(/[^\d+]/g, '')}`}
                    target="_blank"
                    className="bg-gray-900 hover:bg-black text-white p-4 rounded-2xl shadow-xl transition-all active:scale-95 group/wa"
                 >
                    <MessageCircle className="w-5 h-5 group-hover/wa:rotate-12 transition-transform" />
                 </a>
                 
                 <button className="p-4 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 transition-all">
                    <ArrowRight className="w-5 h-5" />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
