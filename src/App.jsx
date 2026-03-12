import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import StoreLayout from './components/layout/StoreLayout';
import Home from './pages/storefront/Home';
import Catalog from './pages/storefront/Catalog';
import ProductDetail from './pages/storefront/ProductDetail';
import Cart from './pages/storefront/Cart';
import Wishlist from './pages/storefront/Wishlist';
import Checkout from './pages/storefront/Checkout';
import StoreLogin from './pages/storefront/StoreLogin';
import StoreRegister from './pages/storefront/StoreRegister';
import LoginModal from './components/auth/LoginModal';

import AuthCallback from './pages/auth/AuthCallback';
import NotFound from './pages/NotFound';

// Admin Imports
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Payments from './pages/admin/Payments';
import Banners from './pages/admin/Banners';
import Chat from './pages/admin/Chat';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          {/* Global Login Modal — must be inside BrowserRouter for Link/useNavigate */}
          <LoginModal />

          <Routes>
            {/* Auth Callback Route */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Storefront Routes */}
            <Route path="/" element={<StoreLayout />}>
              <Route index element={<Home />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="login" element={<StoreLogin />} />
              <Route path="register" element={<StoreRegister />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="orders" element={<Orders />} />
              <Route path="payments" element={<Payments />} />
              <Route path="banners" element={<Banners />} />
              <Route path="chat" element={<Chat />} />
            </Route>

            {/* Catch-all 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
