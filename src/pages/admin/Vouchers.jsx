import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Tag, Percent, Banknote, Eye, EyeOff } from 'lucide-react';
import { getVouchers, createVoucher, updateVoucher, deleteVoucher } from '../../services/api';

const emptyForm = {
  code: '',
  type: 'percentage',
  value: '',
  min_purchase: '0',
  max_discount: '',
  usage_limit: '',
  expires_at: '',
  active: true,
};

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  async function fetchVouchers() {
    setLoading(true);
    const { data } = await getVouchers();
    if (data) setVouchers(data);
    setLoading(false);
  }

  const openAddModal = () => {
    setEditId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (v) => {
    setEditId(v.id);
    setForm({
      code: v.code,
      type: v.type,
      value: v.value?.toString() || '',
      min_purchase: v.min_purchase?.toString() || '0',
      max_discount: v.max_discount?.toString() || '',
      usage_limit: v.usage_limit?.toString() || '',
      expires_at: v.expires_at ? v.expires_at.slice(0, 10) : '',
      active: v.active,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        code: form.code.trim(),
        type: form.type,
        value: parseFloat(form.value),
        min_purchase: parseFloat(form.min_purchase) || 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        active: form.active,
      };

      const { error } = editId ? await updateVoucher(editId, payload) : await createVoucher(payload);
      if (error) throw error;

      closeModal();
      fetchVouchers();
    } catch (err) {
      alert('Gagal menyimpan voucher: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus voucher ini?')) return;
    const { error } = await deleteVoucher(id);
    if (error) alert('Gagal menghapus voucher: ' + error.message);
    else fetchVouchers();
  };

  const handleToggleActive = async (v) => {
    const { error } = await updateVoucher(v.id, { active: !v.active });
    if (error) alert('Gagal update status: ' + error.message);
    else fetchVouchers();
  };

  const formatValue = (v) =>
    v.type === 'percentage' ? `${v.value}%` : `Rp ${Number(v.value).toLocaleString('id-ID')}`;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-heading text-gray-900 leading-tight">Kode Voucher</h2>
          <p className="mt-1 text-gray-500">Kelola kode promo diskon untuk checkout customer.</p>
        </div>
        <button
          onClick={openAddModal}
          className="gradient-primary text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Voucher
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-premium border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50">
                <th className="px-8 py-5 font-bold">Kode</th>
                <th className="px-8 py-5 font-bold">Nilai</th>
                <th className="px-8 py-5 font-bold">Min. Belanja</th>
                <th className="px-8 py-5 font-bold">Pemakaian</th>
                <th className="px-8 py-5 font-bold">Kedaluwarsa</th>
                <th className="px-8 py-5 font-bold">Status</th>
                <th className="px-8 py-5 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-8 py-20 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                    <span className="text-sm text-gray-400 font-medium">Memuat voucher...</span>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-20 text-center text-gray-400 font-medium italic">
                    Belum ada voucher dibuat.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                          {v.type === 'percentage' ? <Percent className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                        </div>
                        <p className="text-sm font-black text-gray-900 tracking-widest">{v.code}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-emerald-600">{formatValue(v)}</td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-500">
                      {v.min_purchase > 0 ? `Rp ${Number(v.min_purchase).toLocaleString('id-ID')}` : '—'}
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-500">
                      {v.used_count}{v.usage_limit ? ` / ${v.usage_limit}` : ' / ∞'}
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-500">
                      {v.expires_at ? new Date(v.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak ada'}
                    </td>
                    <td className="px-8 py-5">
                      <button
                        onClick={() => handleToggleActive(v)}
                        className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                          v.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}
                      >
                        {v.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {v.active ? 'AKTIF' : 'NONAKTIF'}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(v)}
                          className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                          title="Edit Voucher"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90"
                          title="Hapus Voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-2xl font-black font-heading text-gray-900 tracking-tight flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" /> {editId ? 'UPDATE VOUCHER' : 'NEW VOUCHER'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Kode Voucher <span className="text-rose-500">*</span></label>
                <input
                  type="text" required value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. NAYEA10"
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-black tracking-widest uppercase transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tipe Diskon</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-bold transition-all"
                  >
                    <option value="percentage">Persen (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Nilai {form.type === 'percentage' ? '(%)' : '(Rp)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number" required min="0" step="0.01" value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder={form.type === 'percentage' ? '10' : '20000'}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-bold transition-all"
                  />
                </div>
              </div>

              {form.type === 'percentage' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Maksimal Potongan (Rp, opsional)</label>
                  <input
                    type="number" min="0" value={form.max_discount}
                    onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                    placeholder="Tanpa batas"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-bold transition-all"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Min. Belanja (Rp)</label>
                  <input
                    type="number" min="0" value={form.min_purchase}
                    onChange={(e) => setForm({ ...form, min_purchase: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-bold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Kuota Pemakaian</label>
                  <input
                    type="number" min="0" value={form.usage_limit}
                    onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                    placeholder="Tanpa batas"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Berlaku Sampai (opsional)</label>
                <input
                  type="date" value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-bold transition-all"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-5 h-5 rounded accent-primary"
                />
                <span className="text-xs font-bold text-gray-600">Aktifkan voucher ini sekarang</span>
              </label>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 rounded-2xl bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                  Batal
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="flex-[2] py-4 rounded-2xl gradient-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'MENYIMPAN...' : editId ? 'PERBARUI VOUCHER' : 'SIMPAN VOUCHER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
