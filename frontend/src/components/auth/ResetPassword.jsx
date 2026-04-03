import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { resetPassword, validateResetToken } from '../../services/authService';

const useQuery = () => {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
};

const ResetPassword = () => {
    const q = useQuery();
    const navigate = useNavigate();

    const [email, setEmail] = useState(q.get('email') || '');
    const [token, setToken] = useState(q.get('token') || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);

    React.useEffect(() => {
        const e = (q.get('email') || '').trim();
        const t = (q.get('token') || '').trim();
        if (!e || !t) return;
        setValidating(true);
        setTokenValid(false);
        setError('');
        validateResetToken({ email: e, token: t })
            .then(() => setTokenValid(true))
            .catch((err) => {
                setError(err.response?.data?.message || err.response?.data || 'Link expired or invalid');
            })
            .finally(() => setValidating(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (newPassword !== confirm) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await resetPassword({ email, token, newPassword });
            setSuccess('Password updated. You can now log in.');
            setTimeout(() => navigate('/login'), 800);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Reset failed');
        } finally {
            setLoading(false);
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
                    maxWidth: 420,
                    bgcolor: 'rgba(255,255,255,0.96)',
                    borderRadius: 2,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
                    p: 4,
                }}
            >
                <Typography variant="h4" align="center" gutterBottom>
                    Reset Password
                </Typography>

                {validating && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Validating reset link...
                    </Alert>
                )}
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Reset Token"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            required
                            fullWidth
                            helperText="Paste the token from the reset link/email."
                        />
                        <TextField
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Confirm Password"
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            fullWidth
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading || validating || (!!q.get('token') && !tokenValid)}
                        >
                            {loading ? 'Updating...' : 'Update Password'}
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

export default ResetPassword;
