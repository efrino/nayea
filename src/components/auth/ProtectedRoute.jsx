import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const isAdmin = session?.user?.user_metadata?.role === 'admin';

    if (!session) {
        // Not logged in at all, send to admin login
        return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
    }

    if (!isAdmin) {
        // Logged in, but not an admin (Customer). Send them back to the storefront.
        return <Navigate to="/" replace />;
    }

    return children;
}
