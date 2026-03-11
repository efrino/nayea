import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Upload, XCircle, ArrowLeft, ArrowRight, Video } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadFile } from '../../services/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [isPreorder, setIsPreorder] = useState(false);

  // Advanced Tokopedia-style Product Features
  const [material, setMaterial] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [colors, setColors] = useState([]);
  const [newColor, setNewColor] = useState('');

  // Multi-Image Handling
  const [mediaItems, setMediaItems] = useState([]); // Array of { isNew: boolean, url: string, file: File | null }

  // Video Handling
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
      setMaterial(product.material || '');
      setVideoUrl(product.video_url || '');
      setColors(product.colors || []);

      // Legacy support for single image_url vs new images array
      let existingImages = [];
      if (product.images && product.images.length > 0) {
        existingImages = product.images;
      } else if (product.image_url) {
        existingImages = [product.image_url];
      }
      setMediaItems(existingImages.map(url => ({ isNew: false, url, file: null })));
      setVideoFile(null);
    } else {
      setEditId(null);
      setName('');
      setDescription('');
      setPrice('');
      setStock('0');
      setIsPreorder(false);
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
      // 1. Upload NEW images and video in parallel
      const uploadPromises = mediaItems.map(item => {
        if (item.isNew && item.file) {
          return uploadFile(item.file, 'products').then(res => {
            if (res.error) throw res.error;
            return res.url;
          });
        }
        return Promise.resolve(item.url); // keep existing URL
      });

      let finalVideoUrl = videoUrl;
      if (videoFile) {
        uploadPromises.push(
          uploadFile(videoFile, 'products').then(res => {
            if (res.error) throw res.error;
            finalVideoUrl = res.url;
            return 'VIDEO_UPLOAD'; // marker flag
          })
        );
      }

      const uploadResults = await Promise.all(uploadPromises);

      // Separate image URLs from the video marker if it exists
      const finalImageArray = videoFile ? uploadResults.slice(0, -1) : uploadResults;

      // 2. Save product to database with advanced fields
      const productData = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10) || 0,
        is_preorder: isPreorder,
        material,
        video_url: videoFile ? finalVideoUrl : videoUrl,
        colors,
        images: finalImageArray,
        image_url: finalImageArray.length > 0 ? finalImageArray[0] : null // Keep backwards compatibility with old UI if needed
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
    if (window.confirm('Are you sure you want to delete this product?')) {
      const { error } = await deleteProduct(id);
      if (!error) {
        fetchProducts();
      } else {
        alert('Failed to delete product.');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('0');
    setIsPreorder(false);
    setMaterial('');
    setVideoUrl('');
    setColors([]);
    setNewColor('');
    setMediaItems([]);
    setVideoFile(null);
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your product catalog, pricing, and inventory.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
        >
          <Plus className="-ml-1 mr-2 w-5 h-5" aria-hidden="true" />
          Add Product
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No products found. Add your first product!
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md overflow-hidden">
                          {product.image_url ? (
                            <img className="h-10 w-10 object-cover" src={product.image_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center text-gray-400">No Img</div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(product.price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${!product.is_preorder ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {!product.is_preorder ? 'Ready Stock' : 'Pre-Order'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:text-blue-800 transition-colors"><Edit2 className="w-4 h-4 inline-block" /></button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 className="w-4 h-4 inline-block" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closeModal}></div>

            <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900">{editId ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Multi-Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Images (Gallery)</label>
                  <p className="text-xs text-gray-500 mb-2">Urutan dapat diatur. Gambar pertama akan menjadi cover.</p>
                  <div className="mt-1 flex flex-col items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative">
                    <div className="flex flex-wrap justify-center gap-4 mb-4">
                      {mediaItems.length > 0 ? (
                        mediaItems.map((item, idx) => (
                          <div key={idx} className="relative w-28 h-28 border rounded-md bg-white group shadow-sm transition-all hover:shadow-md">
                            <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded z-10 font-bold">
                              {idx + 1}
                            </span>
                            <img src={item.url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover rounded-md" />

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1 rounded-md">
                              <div className="flex justify-between">
                                <button
                                  type="button"
                                  onClick={() => moveImage(idx, 'left')}
                                  disabled={idx === 0}
                                  className={`p-1 bg-white/90 rounded text-gray-800 transition-colors ${idx === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:text-blue-600'}`}
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveImage(idx, 'right')}
                                  disabled={idx === mediaItems.length - 1}
                                  className={`p-1 bg-white/90 rounded text-gray-800 transition-colors ${idx === mediaItems.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:text-blue-600'}`}
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="self-center p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No images uploaded yet.</div>
                      )}
                    </div>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors">
                          <Upload className="w-4 h-4" /> Tambah Gambar
                        </span>
                        <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">PNG, JPG, WEBP up to 5MB.</p>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
                  <input type="text" id="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Real-Pict Video (Optional)</label>
                  <div className="mt-1 flex items-center gap-4">
                    {videoUrl ? (
                      <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 border rounded-md w-full justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-700 truncate">
                          <Video className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="truncate">{videoFile ? videoFile.name : 'Existing Video Uploaded'}</span>
                        </div>
                        <button type="button" onClick={removeVideo} className="text-red-500 hover:text-red-700 p-1">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full flex items-center px-4 pt-4 pb-4 border-2 border-gray-300 border-dashed rounded-md relative bg-gray-50 hover:bg-gray-100 transition-colors">
                        <label htmlFor="video-upload" className="relative cursor-pointer w-full text-center flex flex-col items-center">
                          <Video className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-500">Pilih File Video MP4/WEBM</span>
                          <p className="text-xs text-gray-500 mt-1">Maksimal 50MB.</p>
                          <input id="video-upload" name="video-upload" type="file" className="sr-only" accept="video/mp4,video/webm" onChange={handleVideoChange} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Material */}
                <div>
                  <label htmlFor="material" className="block text-sm font-medium text-gray-700">Material / Fabric (Optional)</label>
                  <input type="text" id="material" placeholder="e.g., Premium Ceruty Babydoll" value={material} onChange={(e) => setMaterial(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                </div>

                {/* Colors Manager */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color Variants</label>
                  <div className="flex gap-2">
                    <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }} placeholder="e.g., Hitam, Maroon" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                    <button type="button" onClick={addColor} className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {colors.map((color, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {color}
                        <button type="button" onClick={() => removeColor(color)} className="ml-1.5 inline-flex items-center justify-center text-blue-400 hover:text-blue-500 focus:outline-none"><XCircle className="w-4 h-4" /></button>
                      </span>
                    ))}
                    {colors.length === 0 && <span className="text-xs text-gray-500 italic">No color variants added.</span>}
                  </div>
                </div>

                {/* Price & Stock Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (Rp)</label>
                    <input type="number" id="price" required min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                  </div>
                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
                    <input type="number" id="stock" required min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                  </div>
                </div>

                {/* Preorder Checkbox */}
                <div className="flex items-center mt-4">
                  <input id="preorder" type="checkbox" checked={isPreorder} onChange={(e) => setIsPreorder(e.target.checked)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" />
                  <label htmlFor="preorder" className="ml-2 block text-sm text-gray-900">This is a Pre-order item</label>
                </div>

                {/* Submit */}
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : editId ? 'Update Product' : 'Save Product'}
                  </button>
                  <button type="button" onClick={closeModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                    Cancel
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
