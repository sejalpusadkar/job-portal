import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/authService';
import registerBg from '../../assets/register-bg.webp';
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
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/login');
        } catch (err) {
            if (!err.response) {
                setError('Something went wrong. Please try again.');
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

export default Register;
