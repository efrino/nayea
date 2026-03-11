import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import { getBanners, createBanner, updateBanner, deleteBanner, uploadFile } from '../../services/api';

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
    if (url.match(/^https?:\/\//)) {
      return url;
    } else if (url.match(/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/)) {
      return `https://${url}`;
    } else if (!url.startsWith('/')) {
      return `/${url}`;
    }
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

    setUploading(true);
    // Kita gunakan bucket 'banners' sesuai dengan schema kita
    const { url, error } = await uploadFile(file, 'banners');
    setUploading(false);

    if (error) {
      alert("Gagal mengupload gambar: " + error.message);
    } else if (url) {
      setFormData({ ...formData, image_url: url });
    }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Banners</h2>
          <p className="mt-1 text-sm text-gray-500">Kelola banner promo yang tayang di halaman depan.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none transition-colors"
        >
          <Plus className="-ml-1 mr-2 w-5 h-5" aria-hidden="true" />
          Tambah Banner
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Informasi Banner</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">Memuat banner...</td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">Belum ada banner yang ditambahkan.</td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-4">
                        <img src={banner.image_url} alt="Banner Preview" className="h-16 w-32 object-cover rounded-md bg-gray-100 shadow-sm border border-gray-200" />
                        <div>
                          <p className="font-semibold text-gray-900">{banner.title}</p>
                          <p className="text-gray-500 text-xs truncate w-48">{banner.description || 'Tidak ada deskripsi'}</p>
                          {banner.link_url && <a href={getSmartHref(banner.link_url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs mt-1 block">Buka Tautan</a>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors
                        ${banner.active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                      >
                        {banner.active ? 'Aktif' : 'Non-Aktif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => handleOpenModal(banner)} className="text-blue-500 hover:text-blue-700 transition-colors">
                        <Edit2 className="w-5 h-5 inline-block" />
                      </button>
                      <button onClick={() => handleDelete(banner.id)} className="text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="w-5 h-5 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 overflow-hidden bg-black bg-opacity-60 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] sm:my-8">

            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-900" id="modal-title">
                {formData.id ? 'Edit Banner' : 'Tambah Banner Baru'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Modal Body (Scrollable) */}
              <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300">

                {/* Upload Image Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Gambar Banner <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 p-5 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center cursor-pointer relative">
                    {formData.image_url ? (
                      <div className="mb-4">
                        <img src={formData.image_url} alt="Preview" className="mx-auto h-36 w-auto object-cover rounded-md shadow border border-gray-200" />
                        <p className="text-xs text-green-600 mt-3 font-semibold">✓ Gambar tersimpan</p>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                        <p className="text-sm text-gray-600 font-medium">Buka folder & pilih file</p>
                        <p className="text-xs text-gray-400 mt-1">Format webp, png, jpg. Max 5MB</p>
                        <p className="text-xs text-blue-600 font-medium mt-2 bg-blue-50 py-1.5 px-3 rounded-md inline-block border border-blue-100">
                          Rekomendasi Desktop: 1920x800px (Rasio 21:9)
                        </p>
                      </div>
                    )}

                    <input
                      type="file"
                      id="file-upload"
                      accept="image/jpeg, image/png, image/webp"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />

                    {uploading && (
                      <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                        <p className="text-sm text-primary font-bold animate-pulse">Mengupload gambar...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Banner <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-shadow"
                    placeholder="Contoh: Promo Ramadhan 50%"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Singkat (Opsional)</label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-shadow"
                    placeholder="Gunakan kode promo KAMIBERKAH saat checkout"
                  />
                </div>

                {/* Link URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tautan / Link URL (Opsional)</label>
                  <input
                    type="text"
                    value={formData.link_url || ''}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-shadow"
                    placeholder="https://nayea.id/catalog (link produk atau whatsapp)"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                  <input
                    id="active"
                    name="active"
                    type="checkbox"
                    checked={formData.active || false}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-3 block text-sm font-medium text-gray-900 cursor-pointer">
                    Tayangkan Banner ini (Aktif)
                  </label>
                </div>
              </div>

              {/* Action Buttons (Fixed Footer) */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-gray-300 shadow-sm px-5 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading || !formData.image_url}
                  className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-5 py-2.5 bg-primary text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Simpan Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
