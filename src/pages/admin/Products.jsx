import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Upload, 
  XCircle, 
  ArrowLeft, 
  ArrowRight, 
  Video,
  Package,
  Layers,
  Search,
  ChevronRight,
  Filter,
  AlertCircle
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadFile } from '../../services/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [isPreorder, setIsPreorder] = useState(false);
  const [weight, setWeight] = useState('500'); // grams
  const [material, setMaterial] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [colors, setColors] = useState([]);
  const [newColor, setNewColor] = useState('');
  const [mediaItems, setMediaItems] = useState([]); 
  const [videoFile, setVideoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await getProducts();
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newItems = files.map(file => ({
        isNew: true,
        url: URL.createObjectURL(file),
        file: file
      }));
      setMediaItems(prev => [...prev, ...newItems]);
    }
  };

  const removeImage = (indexToRemove) => {
    setMediaItems(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const moveImage = (index, direction) => {
    const newItems = [...mediaItems];
    if (direction === 'left' && index > 0) {
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      setMediaItems(newItems);
    } else if (direction === 'right' && index < newItems.length - 1) {
      [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
      setMediaItems(newItems);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoUrl('');
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditId(product.id);
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price ? product.price.toString() : '');
      setStock(product.stock !== undefined ? product.stock.toString() : '0');
      setIsPreorder(product.is_preorder || false);
      setWeight(product.weight !== undefined ? product.weight.toString() : '500');
      setMaterial(product.material || '');
      setVideoUrl(product.video_url || '');
      setColors(product.colors || []);
      let existingImages = product.images && product.images.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);
      setMediaItems(existingImages.map(url => ({ isNew: false, url, file: null })));
      setVideoFile(null);
    } else {
      setEditId(null);
      setName('');
      setDescription('');
      setPrice('');
      setStock('0');
      setIsPreorder(false);
      setWeight('500');
      setMaterial('');
      setVideoUrl('');
      setColors([]);
      setMediaItems([]);
      setVideoFile(null);
    }
    setNewColor('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const uploadPromises = mediaItems.map(item => {
        if (item.isNew && item.file) {
          return uploadFile(item.file, 'products').then(res => {
            if (res.error) throw res.error;
            return res.url;
          });
        }
        return Promise.resolve(item.url);
      });

      let finalVideoUrl = videoUrl;
      if (videoFile) {
        uploadPromises.push(
          uploadFile(videoFile, 'products').then(res => {
            if (res.error) throw res.error;
            finalVideoUrl = res.url;
            return 'VIDEO_UPLOAD';
          })
        );
      }

      const uploadResults = await Promise.all(uploadPromises);
      const finalImageArray = videoFile ? uploadResults.slice(0, -1) : uploadResults;

      const productData = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10) || 0,
        is_preorder: isPreorder,
        material,
        video_url: videoFile ? finalVideoUrl : videoUrl,
        colors,
        weight: parseInt(weight, 10) || 500,
        images: finalImageArray,
        image_url: finalImageArray.length > 0 ? finalImageArray[0] : null
      };

      let error;
      if (editId) {
        const res = await updateProduct(editId, productData);
        error = res.error;
      } else {
        const res = await createProduct(productData);
        error = res.error;
      }

      if (error) throw error;
      closeModal();
      fetchProducts();
    } catch (error) {
      alert('Error saving product: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus produk ini secara permanen?')) {
      const { error } = await deleteProduct(id);
      if (!error) {
        fetchProducts();
      } else {
        alert('Gagal menghapus produk.');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const addColor = () => {
    if (newColor.trim() && !colors.includes(newColor.trim())) {
      setColors([...colors, newColor.trim()]);
      setNewColor('');
    }
  };

  const removeColor = (colorToRemove) => {
    setColors(colors.filter(c => c !== colorToRemove));
  };

  const formatPrice = (p) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-heading text-gray-900">Katalog Produk</h2>
          <p className="mt-1 text-gray-500">Total {products.length} produk tersedia di etalase Anda.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nama produk..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto gradient-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-premium border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50">
                <th className="px-8 py-5 font-bold">Informasi Produk</th>
                <th className="px-8 py-5 font-bold">Harga</th>
                <th className="px-8 py-5 font-bold">Stok</th>
                <th className="px-8 py-5 font-bold">Berat</th>
                <th className="px-8 py-5 font-bold">Status</th>
                <th className="px-8 py-5 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                    <span className="text-sm text-gray-400 font-medium">Memuat katalog...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-gray-400 font-medium italic">
                    Belum ada produk atau hasil pencarian nihil.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300">
                          {product.image_url ? (
                            <img className="w-full h-full object-cover" src={product.image_url} alt={product.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{product.name}</p>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">{product.material || 'Material Belum Diatur'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-gray-900">{formatPrice(product.price)}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${product.stock < 5 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="text-sm font-bold text-gray-700">{product.stock}</span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase">pcs</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-500">
                      {product.weight || 500} <span className="text-[10px] uppercase opacity-60">gr</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 inline-flex text-[10px] font-bold rounded-lg border
                        ${!product.is_preorder ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {!product.is_preorder ? 'READY STOCK' : 'PRE-ORDER'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(product)} 
                          className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)} 
                          className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90"
                          title="Hapus Produk"
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

      {/* Modern Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={closeModal}></div>

          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 min-h-[600px] max-h-[90vh]">
            {/* Sidebar Modal - Visual Preview */}
            <div className="hidden md:flex md:w-1/3 gradient-primary p-10 flex-col justify-between text-white relative flex-shrink-0">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <Package className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black font-heading leading-tight italic">
                  {editId ? 'UPDATE ITEM' : 'READY TO SELL?'}
                </h3>
                <p className="mt-4 text-emerald-50/80 text-sm font-medium leading-relaxed">
                  Lengkapi detail produk Anda agar customer semakin yakin untuk berbelanja di Nayea.id. 🌿
                </p>
              </div>
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10">
                  <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">1</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Info Dasar</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-transparent">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold">2</span>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-60 text-emerald-100">Media Gallery</span>
                </div>
              </div>
            </div>

            {/* Main Form Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white">
              <div className="flex justify-between items-center mb-10">
                <h4 className="text-2xl font-black font-heading text-gray-900 tracking-tight">Detail Produk</h4>
                <button onClick={closeModal} className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Visual Image/Video Area */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                       <Layers className="w-4 h-4 text-primary" /> Media & Galeri
                    </label>
                    <label htmlFor="file-upload" className="text-xs font-bold text-primary hover:underline cursor-pointer">
                      + Tambah Foto
                      <input id="file-upload" type="file" multiple className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                    {mediaItems.length === 0 ? (
                      <label htmlFor="file-upload" className="w-32 h-32 rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50 text-gray-300 flex-shrink-0 cursor-pointer hover:bg-white hover:border-primary/50 hover:text-primary transition-all group">
                         <Plus className="w-8 h-8 mb-1 group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-black uppercase">Foto</span>
                      </label>
                    ) : (
                      mediaItems.map((item, idx) => (
                        <div key={idx} className="relative w-32 h-32 rounded-[2rem] overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm group">
                          <img src={item.url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <button type="button" onClick={() => removeImage(idx)} className="p-2 rounded-full bg-white text-rose-500 shadow-lg">
                               <X className="w-4 h-4" />
                             </button>
                             {idx > 0 && (
                               <button type="button" onClick={() => moveImage(idx, 'left')} className="p-2 rounded-full bg-white text-primary shadow-lg">
                                 <ArrowLeft className="w-4 h-4" />
                               </button>
                             )}
                          </div>
                          {idx === 0 && <span className="absolute bottom-2 left-2 right-2 bg-primary/90 text-white text-[8px] font-black uppercase text-center py-1 rounded-full shadow-lg">Cover Utama</span>}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Primary Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Nama Produk</label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g. Bergo Maryam Pashmina"
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Material / Kain</label>
                    <input 
                      type="text" 
                      value={material} 
                      onChange={(e) => setMaterial(e.target.value)} 
                      placeholder="e.g. Silk, Crinkle, Ceruty"
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Deskripsi LENGKAP</label>
                  <textarea 
                    rows={4} 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Jelaskan keunggulan hijab ini kepada customer..."
                    className="w-full px-6 py-4 rounded-3xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm transition-all resize-none shadow-sm"
                  />
                </div>

                {/* Pricing & Stock Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Harga (Rp)</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                       <input 
                        type="number" 
                        required 
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)} 
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-bold transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Total Stok</label>
                    <input 
                      type="number" 
                      required 
                      value={stock} 
                      onChange={(e) => setStock(e.target.value)} 
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm font-bold transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2 text-right flex flex-col items-end">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Tipe Jualan</label>
                    <div className="mt-2 flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${!isPreorder ? 'text-emerald-500' : 'text-gray-300'}`}>Ready</span>
                      <button 
                        type="button"
                        onClick={() => setIsPreorder(!isPreorder)}
                        className={`w-12 h-6 rounded-full p-1 relative transition-colors ${isPreorder ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      >
                         <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${isPreorder ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${isPreorder ? 'text-amber-500' : 'text-gray-300'}`}>PO</span>
                    </div>
                  </div>
                </div>

                {/* Extra Details (Weight, Colors) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" /> Berat & Varian Warna
                    </label>
                    <div className="flex items-center gap-4">
                       <input 
                        type="number" 
                        value={weight} 
                        onChange={(e) => setWeight(e.target.value)} 
                        placeholder="Berat (gr)"
                        className="w-24 px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-xs transition-all shadow-sm"
                       />
                       <div className="flex-1 flex gap-2">
                          <input 
                            type="text" 
                            value={newColor} 
                            onChange={(e) => setNewColor(e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
                            placeholder="Warna baru..."
                            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-transparent outline-none text-xs shadow-sm"
                          />
                          <button type="button" onClick={addColor} className="p-3 rounded-xl bg-gray-900 text-white"><ArrowRight className="w-4 h-4" /></button>
                       </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                          {color}
                          <button type="button" onClick={() => removeColor(color)} className="ml-2"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-xs font-black uppercase tracking-widest text-gray-400">Video Produk (MP4/WEBM)</label>
                     {videoUrl ? (
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100 italic">
                           <div className="flex items-center gap-2 text-emerald-700 text-xs">
                              <Video className="w-4 h-4" /> <span>Video Terpilih</span>
                           </div>
                           <button type="button" onClick={removeVideo} className="text-emerald-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     ) : (
                       <label htmlFor="video-upload" className="w-full flex items-center justify-center p-8 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 hover:bg-white hover:border-primary/50 text-gray-400 transition-all cursor-pointer group shadow-sm">
                          <Video className="w-8 h-8 mr-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold uppercase tracking-tight">Upload Video</span>
                          <input id="video-upload" type="file" className="sr-only" accept="video/mp4,video/webm" onChange={handleVideoChange} />
                       </label>
                     )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-8 flex flex-col-reverse sm:flex-row gap-4">
                  <button 
                    type="button" 
                    onClick={closeModal} 
                    className="flex-1 py-4 rounded-2xl bg-gray-50 text-gray-500 text-sm font-bold hover:bg-gray-100 transition-all active:scale-95"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-[2] py-4 rounded-2xl gradient-primary text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'MENYIMPAN...' : editId ? 'PERBARUI PRODUK' : 'SIMPAN PRODUK'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
