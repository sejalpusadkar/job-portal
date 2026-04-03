import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    IconButton,
    Stack,
    Typography,
    Tooltip,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/notificationService';
import '../../styles/atsRecruiter.css';
import '../../styles/candidatePortal.css';

const fmtAgo = (iso) => {
    try {
        const d = new Date(iso);
        const ms = Date.now() - d.getTime();
        const min = Math.floor(ms / 60000);
        if (min < 1) return 'Just now';
        if (min < 60) return `${min}m ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}h ago`;
        const day = Math.floor(hr / 24);
        if (day === 1) return 'Yesterday';
        return `${day}d ago`;
    } catch {
        return '';
    }
};

const NotificationIcon = ({ type }) => {
    const t = String(type || '').toUpperCase();
    const props = { fontSize: 'small' };
    if (t === 'INTERVIEW_SCHEDULED') return <ScheduleRoundedIcon {...props} />;
    if (t === 'RECRUITER_MESSAGE' || t === 'CANDIDATE_MESSAGE') return <MailOutlineRoundedIcon {...props} />;
    if (t === 'PROFILE_VIEWED') return <PersonOutlineRoundedIcon {...props} />;
    return <WarningAmberRoundedIcon {...props} />;
};

const RecruiterNotifications = () => {
    const nav = useNavigate();
    const [sp, setSp] = useSearchParams();
    const tab = sp.get('tab') || 'all';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await listNotifications(false);
            setItems(res.data || []);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const unreadCount = useMemo(() => (items || []).filter((n) => n.unread).length, [items]);
    const visible = useMemo(() => {
        if (tab === 'unread') return (items || []).filter((n) => n.unread);
        return items || [];
    }, [items, tab]);

    const goTab = (next) => {
        const nextSp = new URLSearchParams(sp);
        nextSp.set('tab', next);
        setSp(nextSp);
    };

    const onOpen = async (n) => {
        if (n?.id) {
            try {
                await markNotificationRead(n.id);
            } catch {}
            setItems((prev) => (prev || []).map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
        }
        if (n?.actionUrl) nav(n.actionUrl);
    };

    const onMarkAll = async () => {
        try {
            await markAllNotificationsRead();
        } catch {}
        setItems((prev) => (prev || []).map((x) => ({ ...x, unread: false })));
    };

    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="ats-shell" style={{ minHeight: '100vh' }}>
            <aside className="ats-sidebar">
                <div className="ats-brand">
                    <div className="ats-brand__mark">
                        <NotificationsNoneRoundedIcon fontSize="small" />
                    </div>
                    <div className="ats-brand__text">
                        <div className="ats-brand__title">Notifications</div>
                        <div className="ats-brand__sub">Recruiter inbox</div>
                    </div>
                </div>
                <div className="ats-nav" role="navigation">
                    <button className="ats-nav__item" onClick={() => nav('/recruiter-dashboard?section=dashboard')} type="button">
                        Back to Dashboard
                    </button>
                </div>
            </aside>

            <main className="ats-main" style={{ padding: 28 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                        <Button
                            startIcon={<ArrowBackRoundedIcon />}
                            variant="outlined"
                            onClick={() => nav(-1)}
                            sx={{ borderRadius: '14px' }}
                        >
                            Back
                        </Button>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                Notifications
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(15,23,42,0.62)' }}>
                                Actionable updates for your jobs and candidates
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.2} alignItems="center">
                        <Tooltip title="Mark all as read">
                            <span>
                                <IconButton
                                    disabled={unreadCount === 0}
                                    onClick={onMarkAll}
                                    sx={{
                                        border: '1px solid rgba(15,23,42,0.10)',
                                        borderRadius: '14px',
                                        width: 40,
                                        height: 40,
                                        background: 'rgba(255,255,255,0.78)',
                                    }}
                                >
                                    ✓
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>
                </Stack>

                {error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {String(error)}
                    </Alert>
                ) : null}

                <Box
                    sx={{
                        background: 'rgba(255,255,255,0.78)',
                        border: '1px solid rgba(15,23,42,0.10)',
                        borderRadius: '16px',
                        boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
                        p: 2.2,
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                        <Typography sx={{ fontWeight: 950 }}>Inbox</Typography>
                        <Stack direction="row" spacing={1}>
                            <button className={`cp-btn ${tab === 'all' ? 'cp-btn--primary' : ''}`} onClick={() => goTab('all')}>
                                All
                            </button>
                            <button className={`cp-btn ${tab === 'unread' ? 'cp-btn--primary' : ''}`} onClick={() => goTab('unread')}>
                                Unread
                            </button>
                        </Stack>
                    </Stack>
                    <Divider sx={{ mb: 1.4 }} />

                    {visible.length === 0 ? (
                        <Typography sx={{ color: 'rgba(15,23,42,0.62)' }}>No notifications to show.</Typography>
                    ) : (
                        <div className="cp-list">
                            {visible.slice(0, 100).map((n) => (
                                <div
                                    key={n.id}
                                    className={`cp-notif ${n.unread ? 'is-unread' : ''}`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onOpen(n)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onOpen(n);
                                        }
                                    }}
                                >
                                    <div className="cp-notif__icon">
                                        <NotificationIcon type={n.type} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="cp-notif__title">{n.title}</div>
                                        <div className="cp-notif__desc">{n.description}</div>
                                    </div>
                                    <div className="cp-notif__time">{fmtAgo(n.createdAt)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </Box>
            </main>
        </div>
    );
};

export default RecruiterNotifications;

