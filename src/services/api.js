import { supabase } from '../lib/supabase';

// ==========================================
// STORAGE SERVICES
// ==========================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Upload a file to Supabase Storage
 * @param {File} file - File gambar yang akan di-upload
 * @param {string} bucket - Nama bucket di Supabase (default: 'products')
 * @returns {Promise<{url: string|null, error: any}>}
 */
export async function uploadFile(file, bucket = 'products') {
  if (!file) return { url: null, error: new Error('No file provided') };

  // Validasi Tipe File
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { 
      url: null, 
      error: new Error('Tipe file tidak valid. Harap gunakan JPG, PNG, WEBP, atau GIF.') 
    };
  }

  // Validasi Ukuran File
  if (file.size > MAX_FILE_SIZE) {
    return { 
      url: null, 
      error: new Error('Ukuran file terlalu besar. Maksimal 5MB.') 
    };
  }

  try {
    // Buat nama file yang unik agar tidak menimpa file dengan nama sama
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file ke bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    // Dapatkan URL publik untuk file yang di-upload
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { url: null, error };
  }
}

// ==========================================
// PRODUCT SERVICES
// ==========================================

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function createProduct(productData) {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();
    
  return { data, error };
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
    
  return { error };
}

// ==========================================
// ORDER SERVICES
// ==========================================

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(*))')
    .order('created_at', { ascending: false });
    
  return { data, error };
}

/**
 * Buat pesanan baru beserta detail itemnya
 * @param {Object} orderData - Data pesanan dari form checkout
 * @param {Array} cartItems - Daftar item di keranjang
 */
export async function createOrder(orderData, cartItems) {
  try {
    // 1. Insert header pesanan
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Siapkan data order_items berdasarkan ID order yang baru dibuat
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    // 3. Insert semua item secara batch
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Optional: Kita bisa menambahkan logika untuk UPDATE stock product di sini 
    // dengan memanggil RPC atau fungsi updateProduct secara batch.
    
    return { data: order, error: null };
  } catch (error) {
    console.error("Error creating order:", error);
    return { data: null, error };
  }
}
