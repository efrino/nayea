import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Package, 
  Truck, 
  CheckCircle, 
  XSquare, 
  Search, 
  Filter, 
  ChevronRight,
  User,
  ExternalLink,
  Clock
} from 'lucide-react';
import { getOrders } from '../../services/api';
import { supabase } from '../../lib/supabase';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchOrders();
    
    // Real-time synchronization
    const channel = supabase
      .channel('admin_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await getOrders();
    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      // fetchOrders is called via realtime channel
    } catch (err) {
      alert("Gagal memperbarui status: " + err.message);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toString().includes(searchTerm);
    
    const matchesFilter = 
      statusFilter === 'ALL' || 
      order.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
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
      {/* Header Space */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-heading text-gray-900 leading-tight">Manajemen Pesanan</h2>
          <p className="mt-1 text-gray-500">Kelola operasional pengiriman dan pantau status pesanan masuk.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
              <Package className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{orders.length} TOTAL PESANAN</span>
           </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Pesanan, Pelanggan, atau ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-50 bg-white shadow-premium focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          {['ALL', 'pending', 'paid', 'shipped', 'cancelled'].map(f => (
            <button
               key={f}
               onClick={() => setStatusFilter(f)}
               className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border whitespace-nowrap ${statusFilter === f ? 'bg-gray-900 text-white border-transparent' : 'bg-white text-gray-400 border-gray-50'}`}
            >
               {f.replace('ALL', 'Semua')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-6">
        {loading && orders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] shadow-premium">
            <div className="animate-spin h-8 w-8 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Sinkronisasi pesanan...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] shadow-premium border border-gray-50">
             <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-100" />
             <p className="text-gray-400 font-medium">Data pesanan belum tersedia.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 group hover:border-indigo-100 transition-all duration-500 overflow-hidden relative"
            >
              {/* Background Accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none transform translate-x-10 -translate-y-10 rounded-full ${getStatusStyle(order.status).split(' ')[0]}`}></div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side: Order Meta */}
                <div className="lg:w-1/4 space-y-4">
                   <div className="flex items-center justify-between lg:justify-start lg:gap-4">
                      <div className={`p-4 rounded-3xl ${getStatusStyle(order.status)} shadow-inner`}>
                         <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Order Ref</p>
                         <h3 className="text-xl font-black font-heading text-gray-900 uppercase">#{order.id?.toString().slice(-6)}</h3>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 p-3 rounded-2xl w-fit">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                   </div>
                </div>

                {/* Center: Items Preview */}
                <div className="flex-1 space-y-4">
                   <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-300" />
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400">Order Items</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.order_items?.map((item, idx) => (
                         <div key={idx} className="flex items-center gap-3 bg-gray-50 p-4 rounded-3xl border border-transparent hover:border-gray-100 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-white flex-shrink-0 flex items-center justify-center font-black text-gray-300 shadow-sm text-xs">
                               {item.quantity}x
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm font-bold text-gray-800 truncate">{item.product?.name || 'Item Terhapus'}</p>
                               <p className="text-[10px] text-gray-400 font-medium">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                            </div>
                         </div>
                      ))}
                      {(!order.order_items || order.order_items.length === 0) && (
                         <p className="text-xs text-gray-400 italic">Data item tidak ditemukan.</p>
                      )}
                   </div>
                </div>

                {/* Right Side: Customer & Fulfillment */}
                <div className="lg:w-1/4 space-y-6">
                   <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/50 relative overflow-hidden group/cust">
                      <User className="absolute -right-2 -bottom-2 w-16 h-16 text-indigo-500 opacity-5 group-hover/cust:scale-110 transition-transform" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Customer Detail</p>
                      <p className="text-sm font-black text-gray-900 truncate">{order.customer_name}</p>
                      <p className="text-xs font-medium text-indigo-600 mt-1">{order.customer_phone}</p>
                   </div>

                   <div className="space-y-3 px-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fulfillment Status</p>
                      <div className="relative">
                         <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className={`w-full appearance-none px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer outline-none shadow-sm ${getStatusStyle(order.status)}`}
                         >
                            <option value="pending">PENDING</option>
                            <option value="paid">PAID / VERIFIED</option>
                            <option value="shipped">SHIPPED</option>
                            <option value="cancelled">CANCELLED</option>
                         </select>
                         <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 opacity-40 pointer-events-none" />
                      </div>
                   </div>
                   
                   <div className="pt-2 flex items-center justify-between px-2">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Grand Total</p>
                         <p className="text-xl font-black text-emerald-600">{formatPrice(order.total_amount)}</p>
                      </div>
                      <button className="p-4 rounded-2xl bg-gray-900 text-white shadow-xl hover:bg-black active:scale-90 transition-all">
                         <ExternalLink className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
