import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { forgotPassword } from '../../services/authService';

const isValidEmail = (email) => {
    const e = String(email || '').trim();
    // Simple, practical validation (avoid overly strict RFC regex).
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
};

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const canSend = useMemo(() => isValidEmail(email) && !sending, [email, sending]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const trimmed = String(email || '').trim();
        if (!isValidEmail(trimmed)) {
            setError('Please enter a valid email address.');
            return;
        }

        setSending(true);
        try {
            const res = await forgotPassword(trimmed);
            const msg = res.data?.message || 'If this email is registered, a reset link has been sent.';
            setSuccess(msg);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Failed to send reset link');
        } finally {
            setSending(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                background: 'linear-gradient(135deg, #0b1320 0%, #12233f 40%, #0e3b3e 100%)',
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 440,
                    bgcolor: 'rgba(255,255,255,0.96)',
                    borderRadius: 2,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
                    p: 4,
                }}
            >
                <Typography variant="h4" align="center" gutterBottom>
                    Forgot Password
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
                    Enter your registered email. If it exists, we’ll send a password reset link.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <form onSubmit={onSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            fullWidth
                            helperText="Example: name@gmail.com"
                        />
                        <Button type="submit" variant="contained" disabled={!canSend}>
                            {sending ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                        <Typography variant="body2" align="center">
                            Back to <Link to="/login">Login</Link>
                        </Typography>
                    </Stack>
                </form>
            </Box>
        </Box>
    );
};

export default ForgotPassword;

