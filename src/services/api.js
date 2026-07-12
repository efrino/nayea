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
 * Satu pesanan lengkap (dipakai di halaman Invoice admin)
 */
export async function getOrderById(id) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(*))")
    .eq("id", id)
    .single();

  return { data, error };
}

/**
 * Riwayat pesanan milik satu customer saja (dipakai di halaman Profil)
 */
export async function getMyOrders(userId) {
  if (!userId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

// ==========================================
// ADDRESS BOOK SERVICES
// ==========================================

export async function getAddresses(userId) {
  if (!userId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function createAddress(addressData) {
  const { data, error } = await supabase
    .from("addresses")
    .insert([addressData])
    .select()
    .single();
  return { data, error };
}

export async function updateAddress(id, addressData) {
  const { data, error } = await supabase
    .from("addresses")
    .update(addressData)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteAddress(id) {
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  return { error };
}

/**
 * Set satu alamat jadi default, otomatis un-default alamat lain milik user yang sama
 */
export async function setDefaultAddress(userId, addressId) {
  const { error: clearError } = await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId);
  if (clearError) return { error: clearError };

  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId);
  return { error };
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

    // 4. Kurangi stok produk (RPC, atomic di sisi DB supaya aman dari race
    // condition kalau ada beberapa checkout bersamaan untuk produk yang sama)
    await Promise.all(
      cartItems.map((item) =>
        supabase.rpc("decrement_product_stock", {
          p_id: item.product_id,
          qty: item.quantity,
        })
      )
    );

    // 5. Tandai voucher sudah dipakai (re-validasi atomic di DB — kalau
    // ternyata kuota sudah habis tepat di saat ini, order tetap jalan,
    // cuma voucher-nya tidak ke-consume; ini best-effort, bukan blocking)
    if (orderData.voucher_code) {
      await supabase.rpc("consume_voucher", { p_code: orderData.voucher_code });
    }

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

// ==========================================
// USER MANAGEMENT SERVICES (superadmin only)
// These call Vercel serverless functions that use the Supabase service
// role key server-side — that key must never reach the client bundle.
// ==========================================

async function authorizedFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  // A plain `vite dev` server (no Vercel functions runtime) doesn't know
  // about /api/*, and falls back to serving index.html with a 200 status —
  // which would otherwise look like a successful-but-empty response. Catch
  // that case explicitly instead of silently returning no data.
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return {
      data: null,
      error: new Error(
        `Endpoint ${url} tidak mengembalikan JSON (dapat ${res.status}). Ini biasanya berarti serverless function tidak berjalan di server saat ini — coba akses lewat deployment Vercel, bukan "vite dev" biasa.`
      ),
    };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(json.error || `Request failed (${res.status})`) };
  }
  return { data: json, error: null };
}

export async function listAllUsers() {
  const { data, error } = await authorizedFetch("/api/admin-list-users");
  return { data: data?.users || null, error };
}

export async function setUserRole(userId, role) {
  const { data, error } = await authorizedFetch("/api/admin-set-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role }),
  });
  return { data: data?.user || null, error };
}

// ==========================================
// PRODUCT REVIEW SERVICES
// ==========================================

export async function getProductReviews(productId) {
  const { data, error } = await supabase.rpc("get_product_reviews", {
    p_product_id: productId,
  });
  return { data: data || [], error };
}

/**
 * A customer can review a product only once, and only if they have a
 * paid/shipped order that includes it (mirrors the "verified buyer" RLS
 * check on insert — this is just for deciding whether to show the form).
 */
export async function canReviewProduct(userId, productId) {
  if (!userId) return { data: false, error: null };

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) return { data: false, error: null };

  const { data: purchases, error } = await supabase
    .from("order_items")
    .select("id, orders!inner(status, user_id)")
    .eq("product_id", productId);

  if (error) return { data: false, error };

  const hasVerifiedPurchase = (purchases || []).some(
    (item) =>
      item.orders?.user_id === userId &&
      ["paid", "shipped"].includes(item.orders?.status)
  );

  return { data: hasVerifiedPurchase, error: null };
}

export async function createReview(reviewData) {
  const { data, error } = await supabase
    .from("reviews")
    .insert([reviewData])
    .select()
    .single();
  return { data, error };
}

export async function updateReview(id, reviewData) {
  const { data, error } = await supabase
    .from("reviews")
    .update(reviewData)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteReview(id) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  return { error };
}

// ==========================================
// VOUCHER SERVICES
// ==========================================

/**
 * Checks a voucher code against the current cart subtotal (RPC — codes
 * aren't readable directly by the client, see schema.sql for why).
 */
export async function validateVoucher(code, subtotal) {
  const { data, error } = await supabase.rpc("validate_voucher", {
    p_code: code,
    p_subtotal: subtotal,
  });
  if (error) return { data: null, error };
  return { data: data?.[0] || null, error: null };
}

export async function getVouchers() {
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function createVoucher(voucherData) {
  const { data, error } = await supabase
    .from("vouchers")
    .insert([{ ...voucherData, code: voucherData.code?.toUpperCase() }])
    .select()
    .single();
  return { data, error };
}

export async function updateVoucher(id, voucherData) {
  const payload = { ...voucherData };
  if (payload.code) payload.code = payload.code.toUpperCase();
  const { data, error } = await supabase
    .from("vouchers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteVoucher(id) {
  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  return { error };
}

// ==========================================
// EMAIL NOTIFICATION SERVICES
// Best-effort: failures here should never block the checkout/order-update
// flow that triggered them, so callers generally shouldn't await + throw.
// ==========================================

export async function sendOrderConfirmationEmail(orderId) {
  const { data, error } = await authorizedFetch("/api/send-order-confirmation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  return { data, error };
}

export async function sendShippingNotificationEmail(orderId) {
  const { data, error } = await authorizedFetch("/api/send-shipping-notification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  return { data, error };
}
