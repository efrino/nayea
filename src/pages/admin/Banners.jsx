import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Upload, Video, Image, ExternalLink, Eye, EyeOff, Layers } from 'lucide-react';
import { getBanners, createBanner, updateBanner, deleteBanner, uploadFile } from '../../services/api';

const isVideoUrl = (url) => {
  if (!url) return false;
  const lower = url.split('?')[0].toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.gif');
};

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    active: true
  });

  const getSmartHref = (urlStr) => {
    if (!urlStr) return '#';
    let url = urlStr.trim();
    if (url.match(/^https?:\/\//)) return url;
    if (url.match(/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/)) return `https://${url}`;
    if (!url.startsWith('/')) return `/${url}`;
    return url;
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    setLoading(true);
    const { data } = await getBanners();
    if (data) setBanners(data);
    setLoading(false);
  }

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setFormData({
        id: banner.id,
        title: banner.title || '',
        description: banner.description || '',
        image_url: banner.image_url,
        link_url: banner.link_url || '',
        active: banner.active
      });
    } else {
      setFormData({ id: null, title: '', description: '', image_url: '', link_url: '', active: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ id: null, title: '', description: '', image_url: '', link_url: '', active: true });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.gif');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`Ukuran file terlalu besar. Maksimal ${isVideo ? '50MB untuk video' : '5MB untuk gambar'}.`);
      return;
    }
    setUploading(true);
    const { url, error } = await uploadFile(file, 'banners');
    setUploading(false);
    if (error) alert("Gagal mengupload media: " + error.message);
    else if (url) setFormData({ ...formData, image_url: url });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url) {
      alert("Harap upload gambar banner");
      return;
    }
    const payload = {
      title: formData.title,
      description: formData.description,
      link_url: formData.link_url,
      image_url: formData.image_url,
      active: formData.active
    };
    if (formData.id) {
      const { error } = await updateBanner(formData.id, payload);
      if (error) alert("Gagal memperbarui banner: " + error.message);
    } else {
      const { error } = await createBanner(payload);
      if (error) alert("Gagal menambah banner: " + error.message);
    }
    handleCloseModal();
    fetchBanners();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus banner ini?")) {
      const { error } = await deleteBanner(id);
      if (error) alert("Gagal menghapus: " + error.message);
      else fetchBanners();
    }
  };

  const handleToggleActive = async (banner) => {
    const { error } = await updateBanner(banner.id, { active: !banner.active });
    if (error) alert("Gagal update status: " + error.message);
    else fetchBanners();
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-heading text-gray-900 leading-tight italic uppercase tracking-tighter">PROMO BANNERS</h2>
          <p className="mt-1 text-gray-500">Kelola visual promosi dan penawaran spesial di homepage.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="gradient-primary text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" />
          Tambah Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest">Memuat Media...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] shadow-premium border-2 border-dashed border-gray-100">
            <Layers className="w-16 h-16 mx-auto mb-4 text-gray-100" />
            <p className="text-gray-400 font-bold uppercase tracking-widest italic">Belum ada banner promosi.</p>
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-[2.5rem] shadow-premium border border-gray-50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className="aspect-[21/9] relative overflow-hidden bg-gray-50">
                {isVideoUrl(banner.image_url) ? (
                  <video src={banner.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" autoPlay loop muted playsInline />
                ) : (
                  <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                   <button onClick={() => handleOpenModal(banner)} className="p-3 bg-white rounded-2xl text-blue-600 shadow-xl hover:scale-110 transition-transform active:scale-90"><Edit2 className="w-5 h-5" /></button>
                   <button onClick={() => handleDelete(banner.id)} className="p-3 bg-white rounded-2xl text-rose-500 shadow-xl hover:scale-110 transition-transform active:scale-90"><Trash2 className="w-5 h-5" /></button>
                </div>
                {!banner.active && (
                   <div className="absolute top-4 left-4 px-4 py-2 bg-gray-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2">
                      <EyeOff className="w-3.5 h-3.5" /> Hidden
                   </div>
                )}
              </div>
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                   <h3 className="text-lg font-black font-heading text-gray-900 leading-tight group-hover:text-primary transition-colors">{banner.title}</h3>
                   <button 
                    onClick={() => handleToggleActive(banner)}
                    className={`p-2 rounded-xl border transition-all ${banner.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                   >
                      {banner.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                   </button>
                </div>
                <p className="text-sm text-gray-400 font-medium mb-6 line-clamp-2 leading-relaxed">{banner.description || 'Tidak ada deskripsi'}</p>
                <div className="flex items-center justify-between">
                   {banner.link_url ? (
                     <a href={getSmartHref(banner.link_url)} target="_blank" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4">
                        Tinjau Tautan <ExternalLink className="w-3 h-3" />
                     </a>
                   ) : <div />}
                   <span className="text-[8px] font-bold text-gray-200 uppercase tracking-widest italic group-hover:text-gray-300 transition-colors">#{banner.id.toString().slice(-4)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-gray-50 bg-white flex items-center justify-between">
               <h3 className="text-2xl font-black font-heading text-gray-900 tracking-tight">{formData.id ? 'UPDATE BANNER' : 'NEW BANNER'}</h3>
               <button onClick={handleCloseModal} className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
               <div className="relative aspect-[21/9] rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center overflow-hidden group cursor-pointer hover:border-primary/50 transition-all">
                  {formData.image_url ? (
                     <>
                        {isVideoUrl(formData.image_url) ? (
                           <video src={formData.image_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                        ) : (
                           <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <p className="text-white text-xs font-black uppercase tracking-widest">Ganti Media</p>
                        </div>
                     </>
                  ) : (
                     <div className="text-center group-hover:scale-110 transition-transform">
                        <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Pilih JPG / Video MP4</p>
                     </div>
                  )}
                  <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} disabled={uploading} />
                  {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><p className="text-primary font-black animate-pulse">UPLOADING...</p></div>}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Judul Promo <span className="text-rose-500 font-bold">*</span></label>
                     <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Ramadhan Sale" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tautan / Link</label>
                     <input type="text" value={formData.link_url} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} placeholder="/catalog" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm transition-all" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Slogan / Deskripsi</label>
                  <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Jelaskan promo ini dalam satu kalimat manis..." className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm transition-all resize-none" />
               </div>

               <div className="flex items-center gap-3">
                  <button type="button" onClick={handleCloseModal} className="flex-1 py-4 bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">Tutup</button>
                  <button type="submit" disabled={uploading || !formData.image_url} className="flex-[2] py-4 gradient-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30 hover:shadow-2xl active:scale-95 transition-all">Simpan Perubahan</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
