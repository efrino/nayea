import { supabase } from "../lib/supabase";

// ==========================================
// STORAGE SERVICES
// ==========================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * Upload a file to Supabase Storage
 * @param {File} file - File gambar/video yang akan di-upload
 * @param {string} bucket - Nama bucket di Supabase (default: 'products')
 * @returns {Promise<{url: string|null, error: any}>}
 */
export async function uploadFile(file, bucket = "products") {
  if (!file) return { url: null, error: new Error("No file provided") };

  const isVideo = file.type.startsWith("video/");
  const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

  // Validasi Tipe File
  if (!allowedTypes.includes(file.type)) {
    return {
      url: null,
      error: new Error(
        isVideo
          ? "Tipe video tidak valid (Gunakan MP4/WEBM)."
          : "Tipe file tidak valid (Gunakan JPG/PNG/WEBP).",
      ),
    };
  }

  // Validasi Ukuran File
  if (file.size > maxSize) {
    return {
      url: null,
      error: new Error(
        `Ukuran file terlalu besar. Maksimal ${isVideo ? "50MB" : "5MB"}.`,
      ),
    };
  }

  try {
    // Buat nama file yang unik agar tidak menimpa file dengan nama sama
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file ke bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    // Dapatkan URL publik untuk file yang di-upload
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { url: null, error };
  }
}

// ==========================================
// PRODUCT SERVICES
// ==========================================

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function createProduct(productData) {
  const { data, error } = await supabase
    .from("products")
    .insert([productData])
    .select()
    .single();

  return { data, error };
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);

  return { error };
}

// ==========================================
// WISHLIST SERVICES
// ==========================================

export async function getWishlists(userId) {
  if (!userId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("wishlists")
    .select("*, product:products(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function toggleWishlist(userId, productId) {
  if (!userId) return { error: new Error("User must be logged in") };

  // Periksa apakah sudah ada di wishlist
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single();

  if (existing) {
    // Hapus dari wishlist
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", existing.id);
    return { added: false, error };
  } else {
    // Tambah ke wishlist
    const { error } = await supabase
      .from("wishlists")
      .insert([{ user_id: userId, product_id: productId }]);
    return { added: true, error };
  }
}

// ==========================================
// CART SERVICES
// ==========================================

export async function getCartItems(userId) {
  if (!userId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("cart_items")
    .select("*, product:products(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function addToCart(
  userId,
  productId,
  quantity = 1,
  selectedColor = null,
) {
  if (!userId) return { error: new Error("User must be logged in") };

  // Check if this explicit variant is already in cart
  let query = supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (selectedColor) {
    query = query.eq("selected_color", selectedColor);
  } else {
    query = query.is("selected_color", null);
  }

  const { data: existing } = await query.single();

  if (existing) {
    // Increment quantity
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id)
      .select()
      .single();
    return { data, error };
  } else {
    // Create new cart row
    const { data, error } = await supabase
      .from("cart_items")
      .insert([
        {
          user_id: userId,
          product_id: productId,
          quantity,
          selected_color: selectedColor,
        },
      ])
      .select()
      .single();
    return { data, error };
  }
}

export async function updateCartItemQuantity(id, quantity) {
  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function removeFromCart(id) {
  const { error } = await supabase.from("cart_items").delete().eq("id", id);
  return { error };
}

export async function clearCart(userId) {
  if (!userId) return { error: null };
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId);
  return { error };
}

// ==========================================
// ORDER SERVICES
// ==========================================

export async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(*))")
    .order("created_at", { ascending: false });

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
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Siapkan data order_items berdasarkan ID order yang baru dibuat
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.product?.price,
    }));

    // 3. Insert semua item secara batch
    const { error: itemsError } = await supabase
      .from("order_items")
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

// ==========================================
// BANNER SERVICES
// ==========================================

export async function getBanners(activeOnly = false) {
  let query = supabase
    .from("banners")
    .select("*")
    .order("created_at", { ascending: false });
  if (activeOnly) {
    query = query.eq("active", true);
  }
  const { data, error } = await query;
  return { data, error };
}

export async function createBanner(bannerData) {
  const { data, error } = await supabase
    .from("banners")
    .insert([bannerData])
    .select()
    .single();
  return { data, error };
}

export async function updateBanner(id, updates) {
  const { data, error } = await supabase
    .from("banners")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteBanner(id) {
  const { error } = await supabase.from("banners").delete().eq("id", id);
  return { error };
}

// ==========================================
// CHAT SERVICES
// ==========================================

export async function getMessages(userId = null) {
  if (userId) {
    // Customer reading their own messages
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    return { data, error };
  } else {
    // Admin reading ALL messages with User Names (via RPC)
    const { data, error } = await supabase.rpc("get_chat_messages_with_users");
    return { data, error };
  }
}

export async function getActiveChatSessions() {
  const { data, error } = await supabase.rpc("get_chat_messages_with_users");

  if (error) return { data: null, error };

  // Extract unique user IDs
  const sessions = [...new Set(data.map((m) => m.user_id))];
  return { data: sessions, error: null };
}

export async function sendMessage(messageData) {
  const { data, error } = await supabase
    .from("messages")
    .insert([messageData])
    .select()
    .single();
  return { data, error };
}

/**
 * Mark all 'sent' customer messages for a given user as 'delivered'.
 * Called when an admin opens a chat session.
 */
export async function markMessagesDelivered(userId) {
  const { error } = await supabase
    .from("messages")
    .update({ status: "delivered" })
    .eq("user_id", userId)
    .eq("sender", "customer")
    .eq("status", "sent");
  return { error };
}

/**
 * Mark ALL customer 'sent' messages across ALL sessions as 'delivered'.
 * Called when the admin Chat panel first loads (admin is now online).
 */
export async function markAllMessagesDelivered() {
  const { error } = await supabase
    .from("messages")
    .update({ status: "delivered" })
    .eq("sender", "customer")
    .eq("status", "sent");
  return { error };
}

/**
 * Mark all customer messages for a given user as 'read'.
 * Called when an admin replies to a chat session.
 */
export async function markMessagesRead(userId) {
  const { error } = await supabase
    .from("messages")
    .update({ status: "read" })
    .eq("user_id", userId)
    .eq("sender", "customer")
    .neq("status", "read");
  return { error };
}

/**
 * Mark all ADMIN messages in the customer's session as 'read'.
 * Called when a CUSTOMER opens the chat widget — so admin sees blue ticks on their sent messages.
 */
export async function markAdminMessagesRead(userId) {
  const { error } = await supabase
    .from("messages")
    .update({ status: "read" })
    .eq("user_id", userId)
    .eq("sender", "admin")
    .neq("status", "read");
  return { error };
}

export async function markAdminMessagesDelivered(userId) {
  const { error } = await supabase
    .from("messages")
    .update({ status: "delivered" })
    .eq("user_id", userId)
    .eq("sender", "admin")
    .eq("status", "sent");
  return { error };
}
