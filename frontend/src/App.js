import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import CandidateDashboard from './components/candidate/CandidateDashboardModern';
import CandidateRecruiterProfilePage from './components/candidate/CandidateRecruiterProfilePage';
import RecruiterDashboard from './components/recruiter/RecruiterDashboardAts';
import RecruiterNotifications from './components/recruiter/RecruiterNotifications';
import RecruiterCandidateProfilePage from './components/recruiter/RecruiterCandidateProfilePage';
import AdminDashboard from './components/admin/AdminDashboard';
import PrivateRoute from './components/common/PrivateRoute';
import { API_BASE_URL } from './utils/url';

function App() {
    // Wake up Railway backend to reduce cold-start delays.
    // Do not block UI; ignore errors silently.
    useEffect(() => {
        const origin = (API_BASE_URL || '').trim().replace(/\/+$/, '');
        if (!origin) return;
        fetch(`${origin}/api/auth/ping`).catch(() => {});
    }, []);

    return (
        <AuthProvider>
            <BrowserRouter
                future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route 
                        path="/candidate-dashboard" 
                        element={
                            <PrivateRoute allowedRoles={['CANDIDATE']}>
                                <CandidateDashboard />
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/recruiter-dashboard" 
                        element={
                            <PrivateRoute allowedRoles={['RECRUITER']}>
                                <RecruiterDashboard />
                            </PrivateRoute>
                        } 
                    />
                    <Route
                        path="/recruiter/candidates/:candidateUserId"
                        element={
                            <PrivateRoute allowedRoles={['RECRUITER']}>
                                <RecruiterCandidateProfilePage />
                            </PrivateRoute>
                        }
                    />
                    <Route 
                        path="/recruiter-notifications" 
                        element={
                            <PrivateRoute allowedRoles={['RECRUITER']}>
                                <RecruiterNotifications />
                            </PrivateRoute>
                        } 
                    />
                    <Route
                        path="/candidate/recruiters/:recruiterUserId"
                        element={
                            <PrivateRoute allowedRoles={['CANDIDATE']}>
                                <CandidateRecruiterProfilePage />
                            </PrivateRoute>
                        }
                    />
                    <Route 
                        path="/admin-dashboard" 
                        element={
                            <PrivateRoute allowedRoles={['ADMIN']}>
                                <AdminDashboard />
                            </PrivateRoute>
                        } 
                    />
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
