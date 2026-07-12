import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import StoreLayout from './components/layout/StoreLayout';
import LoginModal from './components/auth/LoginModal';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Route-level code splitting: each page only downloads when actually
// visited, instead of one bundle with every storefront + admin page
// (including ffmpeg-adjacent admin tooling) upfront for every visitor.
const Home = lazy(() => import('./pages/storefront/Home'));
const Catalog = lazy(() => import('./pages/storefront/Catalog'));
const ProductDetail = lazy(() => import('./pages/storefront/ProductDetail'));
const Cart = lazy(() => import('./pages/storefront/Cart'));
const Wishlist = lazy(() => import('./pages/storefront/Wishlist'));
const Checkout = lazy(() => import('./pages/storefront/Checkout'));
const StoreLogin = lazy(() => import('./pages/storefront/StoreLogin'));
const StoreRegister = lazy(() => import('./pages/storefront/StoreRegister'));
const Profile = lazy(() => import('./pages/storefront/Profile'));
const ForgotPassword = lazy(() => import('./pages/storefront/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/storefront/ResetPassword'));
const PrivacyPolicy = lazy(() => import('./pages/storefront/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/storefront/TermsConditions'));
const About = lazy(() => import('./pages/storefront/About'));
const Faq = lazy(() => import('./pages/storefront/Faq'));
const Shipping = lazy(() => import('./pages/storefront/Shipping'));
const Contact = lazy(() => import('./pages/storefront/Contact'));

const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin Imports — never touched by a storefront visitor, so keeping these
// lazy means their code (and the admin-only deps they pull in) never even
// gets requested unless someone navigates to /admin.
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Products = lazy(() => import('./pages/admin/Products'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const Banners = lazy(() => import('./pages/admin/Banners'));
const Chat = lazy(() => import('./pages/admin/Chat'));
const Users = lazy(() => import('./pages/admin/Users'));
const Vouchers = lazy(() => import('./pages/admin/Vouchers'));
const Documents = lazy(() => import('./pages/admin/Documents'));
const InvoiceView = lazy(() => import('./pages/admin/InvoiceView'));

function RouteLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          {/* Global Login Modal — must be inside BrowserRouter for Link/useNavigate */}
          <LoginModal />

          <Suspense fallback={<RouteLoading />}>
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
                <Route path="profile" element={<Profile />} />
                <Route path="login" element={<StoreLogin />} />
                <Route path="register" element={<StoreRegister />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="privacy-policy" element={<PrivacyPolicy />} />
                <Route path="terms-conditions" element={<TermsConditions />} />
                <Route path="about" element={<About />} />
                <Route path="faq" element={<Faq />} />
                <Route path="shipping" element={<Shipping />} />
                <Route path="contact" element={<Contact />} />
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
                <Route path="users" element={<Users />} />
                <Route path="vouchers" element={<Vouchers />} />
                <Route path="documents" element={<Documents />} />
              </Route>

              {/* Standalone invoice view — no AdminLayout chrome, cleaner to print */}
              <Route path="/admin/orders/:id/invoice" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />

              {/* Catch-all 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
