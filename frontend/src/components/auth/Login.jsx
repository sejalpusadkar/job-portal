import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../services/authService';
import { TextField, Button, Alert } from '@mui/material';
import loginBg from '../../assets/login-bg.webp';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setInfo('');
        try {
            const response = await login({ email, password });
            const { token, email: userEmail, role, id, recruiterApproved } = response.data;
            authLogin({ email: userEmail, role, id, recruiterApproved: !!recruiterApproved }, token);

            if (role === 'CANDIDATE') navigate('/candidate-dashboard');
            else if (role === 'RECRUITER') navigate('/recruiter-dashboard');
            else if (role === 'ADMIN') navigate('/admin-dashboard');
        } catch (err) {
            if (!err.response) {
                setError('Something went wrong. Please try again.');
                return;
            }
            setError(err.response?.data?.message || 'Invalid email or password');
        }
    };

    return (
        <div style={{
            backgroundImage: `url(${loginBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '40px',
                borderRadius: '8px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                animation: 'fadeIn 0.8s ease-in'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
                {error && <Alert severity="error">{error}</Alert>}
                {info && <Alert severity="success">{info}</Alert>}
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        margin="normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        sx={{
                            mt: 2,
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'scale(1.02)',
                                backgroundColor: 'primary.dark'
                            }
                        }}
                    >
                        Login
                    </Button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '10px' }}>
                    <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                        <Button variant="text">Forgot password?</Button>
                    </Link>
                </p>
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
