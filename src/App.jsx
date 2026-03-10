import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StoreLayout from './components/layout/StoreLayout';
import Home from './pages/storefront/Home';
import Catalog from './pages/storefront/Catalog';
import ProductDetail from './pages/storefront/ProductDetail';
import Cart from './pages/storefront/Cart';
import Checkout from './pages/storefront/Checkout';

// Admin Imports
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Banners from './pages/admin/Banners';
import Chat from './pages/admin/Chat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Storefront Routes */}
        <Route path="/" element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="banners" element={<Banners />} />
          <Route path="chat" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
