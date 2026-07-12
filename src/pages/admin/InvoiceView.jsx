import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { getOrderById } from '../../services/api';

const STATUS_LABEL = {
  pending: 'MENUNGGU PEMBAYARAN',
  paid: 'LUNAS',
  shipped: 'DIKIRIM',
  cancelled: 'DIBATALKAN',
};

export default function InvoiceView() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await getOrderById(id);
      if (error) setError(error.message);
      else setOrder(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-500 font-medium">{error || 'Pesanan tidak ditemukan.'}</p>
        <Link to="/admin/orders" className="text-primary font-bold hover:underline">Kembali ke Orders</Link>
      </div>
    );
  }

  const items = order.order_items || [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const shipping = Number(order.shipping_cost) || 0;
  const discount = Number(order.discount_amount) || 0;

  return (
    <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
      {/* Toolbar — hidden when printing */}
      <div className="max-w-3xl mx-auto px-6 mb-6 flex items-center justify-between print:hidden">
        <Link to="/admin/orders" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Orders
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 gradient-primary text-white rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-all"
        >
          <Printer className="w-4 h-4" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* Invoice sheet */}
      <div className="max-w-3xl mx-auto bg-white shadow-lg print:shadow-none rounded-2xl print:rounded-none p-10 sm:p-14">
        <div className="flex items-start justify-between mb-10 pb-8 border-b-2 border-gray-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight italic">NAYEA<span className="text-primary not-italic">.</span>ID</h1>
            <p className="text-xs text-gray-500 mt-1">Jakarta, Indonesia</p>
            <p className="text-xs text-gray-500">hello@nayea.id</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900">Invoice</h2>
            <p className="text-xs text-gray-500 mt-1">#{order.id?.toString().slice(-8).toUpperCase()}</p>
            <p className="text-xs text-gray-500">
              {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-gray-900 text-white">
              {STATUS_LABEL[order.status] || order.status?.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ditagihkan Kepada</p>
            <p className="text-sm font-bold text-gray-900">{order.customer_name}</p>
            <p className="text-sm text-gray-500">{order.customer_phone}</p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{order.shipping_address}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Pengiriman</p>
            <p className="text-sm text-gray-700">{order.shipping_courier || '—'}</p>
            {order.tracking_number && (
              <p className="text-sm text-gray-500 mt-1">Resi: <span className="font-mono font-bold">{order.tracking_number}</span></p>
            )}
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-4 mb-1">Metode Pembayaran</p>
            <p className="text-sm text-gray-700">{order.payment_method === 'bank_transfer' ? 'Transfer Bank Manual' : order.payment_method}</p>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-900 text-left">
              <th className="py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Produk</th>
              <th className="py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Qty</th>
              <th className="py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Harga</th>
              <th className="py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-4 text-sm font-bold text-gray-900">{item.product?.name || 'Produk tidak tersedia'}</td>
                <td className="py-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                <td className="py-4 text-sm text-gray-600 text-right">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                <td className="py-4 text-sm font-bold text-gray-900 text-right">
                  Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-10">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Ongkos Kirim</span>
              <span>Rp {shipping.toLocaleString('id-ID')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Diskon {order.voucher_code ? `(${order.voucher_code})` : ''}</span>
                <span>−Rp {discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t-2 border-gray-900">
              <span>Total</span>
              <span>Rp {Number(order.total_amount).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">Terima kasih sudah berbelanja di Nayea.id</p>
        </div>
      </div>
    </div>
  );
}
