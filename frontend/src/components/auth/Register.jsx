import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/authService';
import registerBg from '../../assets/register-bg.webp';
import API from '../../services/api';
import {
    TextField,
    Button,
    Alert,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Typography
} from '@mui/material';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'CANDIDATE',
        fullName: '',
        phone: '',
        companyName: '',
        contactPerson: '',
        adminRegistrationCode: ''
    });
    const [error, setError] = useState('');
    const [backendStatus, setBackendStatus] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    React.useEffect(() => {
        let mounted = true;
        API.get('auth/ping')
            .then(() => {
                if (mounted) setBackendStatus('Backend: connected');
            })
            .catch((e) => {
                const msg =
                    e.response?.status
                        ? `Backend: ${e.response.status} ${e.response.statusText || ''}`.trim()
                        : 'Backend: not reachable';
                if (mounted) setBackendStatus(msg);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/login');
        } catch (err) {
            // Helpful debug: show what URL was actually used (proxy/baseURL issues).
            // You can remove later once stable.
            // eslint-disable-next-line no-console
            console.error('REGISTER failed', {
                status: err.response?.status,
                url: err.config?.baseURL ? `${err.config.baseURL}${err.config.url}` : err.config?.url,
                data: err.response?.data,
            });
            if (!err.response) {
                setError(
                    `Registration failed: cannot reach backend API. Set REACT_APP_API_BASE_URL (production) or start backend locally. (API base: ${process.env.REACT_APP_API_BASE_URL || '/api/'})`
                );
                return;
            }
            const status = err.response?.status;
            const msg = err.response?.data?.message || err.response?.data || 'Registration failed';
            if (status === 409) {
                setError(
                    `${msg}. This email is already registered. Please login instead (or use a different email).`
                );
                return;
            }
            setError(msg);
        }
    };

    return (
        <div style={{
            backgroundImage: `url(${registerBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'left',
            justifyContent: 'left',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '40px',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                animation: 'fadeIn 0.1s ease-in'
            }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Create Account
                </Typography>
                {backendStatus && (
                    <Alert severity={backendStatus.includes('connected') ? 'success' : 'warning'}>
                        {backendStatus}
                    </Alert>
                )}
                {error && (
                    <Alert
                        severity="error"
                        action={
                            error.toLowerCase().includes('already registered') ? (
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() => navigate('/login')}
                                >
                                    Go to Login
                                </Button>
                            ) : null
                        }
                    >
                        {error}
                    </Alert>
                )}
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        fullWidth
                        margin="normal"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Role</InputLabel>
                        <Select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            label="Role"
                        >
                            <MenuItem value="CANDIDATE">Candidate</MenuItem>
                            <MenuItem value="RECRUITER">Recruiter</MenuItem>
                            <MenuItem value="ADMIN">Admin</MenuItem>
                        </Select>
                    </FormControl>

                    {formData.role === 'CANDIDATE' && (
                        <>
                            <TextField
                                label="Full Name"
                                name="fullName"
                                fullWidth
                                margin="normal"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                            <TextField
                                label="Phone"
                                name="phone"
                                fullWidth
                                margin="normal"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </>
                    )}

                    {formData.role === 'RECRUITER' && (
                        <>
                            <TextField
                                label="Company Name"
                                name="companyName"
                                fullWidth
                                margin="normal"
                                value={formData.companyName}
                                onChange={handleChange}
                                required
                            />
                            <TextField
                                label="Contact Person"
                                name="contactPerson"
                                fullWidth
                                margin="normal"
                                value={formData.contactPerson}
                                onChange={handleChange}
                                required
                            />
                            <TextField
                                label="Phone"
                                name="phone"
                                fullWidth
                                margin="normal"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </>
                    )}

                    {formData.role === 'ADMIN' && (
                        <>
                            <TextField
                                label="Admin Registration Code"
                                name="adminRegistrationCode"
                                fullWidth
                                margin="normal"
                                value={formData.adminRegistrationCode}
                                onChange={handleChange}
                                required
                                helperText="For local development the default code is ADMIN123 (can be changed in backend config)."
                            />
                        </>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        sx={{
                            mt: 3,
                            transition: 'transform 0.2s, background-color 0.2s',
                            '&:hover': {
                                transform: 'scale(1.02)',
                                backgroundColor: 'primary.dark'
                            }
                        }}
                    >
                        Register
                    </Button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

// Add fade-in animation (you can also put this in a global CSS file)
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

export default Register;
