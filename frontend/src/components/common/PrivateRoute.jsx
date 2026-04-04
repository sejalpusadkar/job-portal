import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const defaultPathForRole = (role) => {
    const r = String(role || '').toUpperCase();
    if (r === 'ADMIN') return '/admin-dashboard';
    if (r === 'RECRUITER') return '/recruiter-dashboard';
    return '/candidate-dashboard';
};

const PrivateRoute = ({ children, allowedRoles }) => {
    const { user, loading, logout } = useAuth();

    if (loading) return <div>Loading...</div>;

    const token = localStorage.getItem('token');
    if (!token || !user) return <Navigate to="/login" replace />;

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to={defaultPathForRole(user.role)} replace />;
    }

    // Recruiters must be approved by admin before using recruiter-only pages.
    // Show a safe, non-crashing screen instead of a blank dashboard.
    if (user.role === 'RECRUITER' && allowedRoles?.includes('RECRUITER') && user.recruiterApproved === false) {
        return (
            <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
                <div style={{ maxWidth: 520, width: '100%' }}>
                    <h2 style={{ margin: 0 }}>Recruiter Account Pending Approval</h2>
                    <p style={{ marginTop: 8, color: 'rgba(0,0,0,0.65)' }}>
                        Your recruiter account needs admin approval before you can access the recruiter dashboard.
                        Please try again later.
                    </p>
                    <button
                        onClick={logout}
                        style={{
                            marginTop: 12,
                            background: '#1976d2',
                            color: '#fff',
                            border: 0,
                            borderRadius: 10,
                            padding: '10px 14px',
                            cursor: 'pointer',
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default PrivateRoute;
