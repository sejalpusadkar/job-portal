import React, { useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Menu,
    MenuItem,
    Snackbar,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { useAuth } from '../../context/AuthContext';
import {
    approveRecruiter,
    deleteUser,
    getMetrics,
    getPendingRecruiters,
    listApplications,
    listJobs,
    listUsers,
    rejectRecruiter,
} from '../../services/adminService';
import '../../styles/adminPanel.css';

const initials = (text) => {
    const t = String(text || '').trim();
    if (!t) return '?';
    const parts = t.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || '';
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
    return (a + b).toUpperCase();
};

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

    const [page, setPage] = useState('dashboard'); // dashboard | users | jobs | applications

    const [metrics, setMetrics] = useState(null);
    const [pendingRecruiters, setPendingRecruiters] = useState([]);
    const [users, setUsers] = useState([]);
    const [recentJobs, setRecentJobs] = useState([]);
    const [recentApplications, setRecentApplications] = useState([]);

    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: null, email: '' });
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [userMenuTarget, setUserMenuTarget] = useState(null);
    const [recruiterProfileOpen, setRecruiterProfileOpen] = useState(false);
    const [recruiterProfile, setRecruiterProfile] = useState(null);

    const loadAll = async () => {
        setLoading(true);
        setError('');
        try {
            const [m, pr, u, jobs, apps] = await Promise.all([
                getMetrics(),
                getPendingRecruiters(),
                listUsers(),
                listJobs(20),
                listApplications(20),
            ]);
            setMetrics(m.data);
            setPendingRecruiters(pr.data || []);
            setUsers(u.data || []);
            setRecentJobs(jobs.data || []);
            setRecentApplications(apps.data || []);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const onApprove = async (id) => {
        setError('');
        try {
            await approveRecruiter(id);
            setToast({ open: true, severity: 'success', message: 'Recruiter approved' });
            await loadAll();
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Approve failed');
        }
    };

    const onReject = async (id) => {
        setError('');
        try {
            await rejectRecruiter(id);
            setToast({ open: true, severity: 'info', message: 'Recruiter rejected' });
            await loadAll();
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Reject failed');
        }
    };

    const onDeleteUser = async (id) => {
        setError('');
        try {
            await deleteUser(id);
            setToast({ open: true, severity: 'success', message: 'User deleted' });
            await loadAll();
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Delete failed');
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    const adminName = (user?.email ? user.email.split('@')[0] : 'Admin').replaceAll('.', ' ');

    const statCards = [
        {
            key: 'totalUsers',
            label: 'Total Users',
            value: metrics?.totalUsers ?? 0,
            icon: <GroupOutlinedIcon fontSize="small" />,
            onClick: () => setPage('users'),
        },
        {
            key: 'totalCandidates',
            label: 'Candidates',
            value: metrics?.totalCandidates ?? 0,
            icon: <BadgeOutlinedIcon fontSize="small" />,
            onClick: () => setPage('users'),
        },
        {
            key: 'totalRecruiters',
            label: 'Recruiters',
            value: metrics?.totalRecruiters ?? 0,
            icon: <BusinessOutlinedIcon fontSize="small" />,
            onClick: () => setPage('dashboard'),
        },
        {
            key: 'pendingRecruiters',
            label: 'Pending Approvals',
            value: metrics?.pendingRecruiters ?? 0,
            icon: <HourglassTopRoundedIcon fontSize="small" />,
            onClick: () => setPage('dashboard'),
        },
        {
            key: 'totalApplications',
            label: 'Applications',
            value: metrics?.totalApplications ?? 0,
            icon: <AssignmentTurnedInOutlinedIcon fontSize="small" />,
            onClick: () => setPage('applications'),
        },
    ];

    const filteredUsers = (users || []).filter((u) =>
        String(u.email || '').toLowerCase().includes(search.trim().toLowerCase()),
    );

    return (
        <div className="ap-page">
            <div className="ap-shell">
                <aside className="ap-sidebar">
                    <div className="ap-sidehead">
                        <div className="ap-sidehead__title">Admin</div>
                        <div className="ap-sidehead__sub">{user?.email}</div>
                    </div>

                    <div className="ap-nav">
                        <div
                            className={`ap-nav__item ${page === 'dashboard' ? 'is-active' : ''}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => setPage('dashboard')}
                        >
                            <span style={{ display: 'grid', placeItems: 'center' }}>
                                <DashboardOutlinedIcon fontSize="small" />
                            </span>
                            <span className="ap-nav__label">Dashboard</span>
                        </div>
                        <div
                            className={`ap-nav__item ${page === 'users' ? 'is-active' : ''}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => setPage('users')}
                        >
                            <span style={{ display: 'grid', placeItems: 'center' }}>
                                <PeopleAltOutlinedIcon fontSize="small" />
                            </span>
                            <span className="ap-nav__label">Users</span>
                        </div>
                        <div
                            className={`ap-nav__item ${page === 'jobs' ? 'is-active' : ''}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => setPage('jobs')}
                        >
                            <span style={{ display: 'grid', placeItems: 'center' }}>
                                <WorkOutlineRoundedIcon fontSize="small" />
                            </span>
                            <span className="ap-nav__label">Jobs</span>
                        </div>
                        <div
                            className={`ap-nav__item ${page === 'applications' ? 'is-active' : ''}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => setPage('applications')}
                        >
                            <span style={{ display: 'grid', placeItems: 'center' }}>
                                <AssignmentTurnedInOutlinedIcon fontSize="small" />
                            </span>
                            <span className="ap-nav__label">Applications</span>
                        </div>
                    </div>
                </aside>

                <main className="ap-main">
                    <div className="ap-topbar">
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <h1 className="ap-title">Welcome back, {adminName}</h1>
                            <div className="ap-sub">Here’s what’s happening today</div>
                        </Box>

                        <Tooltip title="Notifications (coming soon)">
                            <IconButton
                                sx={{
                                    border: '1px solid rgba(15,23,42,0.10)',
                                    borderRadius: '14px',
                                    width: 40,
                                    height: 40,
                                    background: 'rgba(255,255,255,0.78)',
                                }}
                            >
                                <NotificationsNoneRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Button
                            onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
                            sx={{
                                border: '1px solid rgba(15,23,42,0.10)',
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.78)',
                                color: 'rgba(15,23,42,0.90)',
                                textTransform: 'none',
                                fontWeight: 900,
                            }}
                            startIcon={
                                <Avatar sx={{ width: 26, height: 26, bgcolor: 'rgba(31,58,138,0.10)', color: '#1f3a8a', fontWeight: 900 }}>
                                    {initials(adminName)}
                                </Avatar>
                            }
                        >
                            {adminName}
                        </Button>
                        <Menu
                            anchorEl={profileMenuAnchor}
                            open={Boolean(profileMenuAnchor)}
                            onClose={() => setProfileMenuAnchor(null)}
                        >
                            <MenuItem
                                onClick={() => {
                                    setProfileMenuAnchor(null);
                                    logout();
                                }}
                            >
                                Logout
                            </MenuItem>
                        </Menu>
                    </div>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

                    <div className="ap-content">
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {String(error)}
                            </Alert>
                        )}

                        {page === 'dashboard' ? (
                            <Stack spacing={2}>
                                <div className="ap-card ap-pad">
                                    <div className="ap-stats">
                                        {statCards.map((c) => (
                                            <div
                                                key={c.key}
                                                className="ap-stat"
                                                role="button"
                                                tabIndex={0}
                                                onClick={c.onClick}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        c.onClick?.();
                                                    }
                                                }}
                                                aria-label={`${c.label}: ${c.value}`}
                                                title="Open"
                                            >
                                                <div className="ap-stat__top">
                                                    <div className="ap-stat__label">{c.label}</div>
                                                    <div style={{ color: 'rgba(15,23,42,0.55)' }}>{c.icon}</div>
                                                </div>
                                                <div className="ap-stat__value">{c.value}</div>
                                                <div className="ap-stat__meta">
                                                    View <MoreHorizRoundedIcon fontSize="inherit" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="ap-grid">
                                    <div className="ap-card ap-pad">
                                        <div className="ap-users-head" style={{ marginBottom: 10 }}>
                                            <div>
                                                <div className="ap-section-title">
                                                    Pending Recruiter Approvals ({pendingRecruiters.length})
                                                </div>
                                                <div className="ap-sub" style={{ marginTop: 0 }}>
                                                    Primary workflow: approve or reject recruiter registrations
                                                </div>
                                            </div>
                                        </div>
                                        <Divider sx={{ mb: 2 }} />

                                        {pendingRecruiters.length === 0 ? (
                                            <div className="ap-muted">No pending approvals.</div>
                                        ) : (
                                            <Stack spacing={1.25}>
                                                {pendingRecruiters.map((r) => (
                                                    <div key={r.userId} className="ap-approval">
                                                        <div className="ap-approval__top">
                                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                                                                <Avatar
                                                                    sx={{
                                                                        width: 40,
                                                                        height: 40,
                                                                        bgcolor: 'rgba(11,95,255,0.10)',
                                                                        color: 'rgba(11,95,255,0.95)',
                                                                        fontWeight: 950,
                                                                        border: '1px solid rgba(11,95,255,0.18)',
                                                                    }}
                                                                >
                                                                    {initials(r.contactPerson || r.companyName || r.email)}
                                                                </Avatar>
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <div className="ap-approval__name">
                                                                        {r.contactPerson || 'Recruiter'}
                                                                    </div>
                                                                    <div className="ap-approval__email">{r.email}</div>
                                                                </Box>
                                                            </Stack>
                                                            <div className="ap-badge">Pending</div>
                                                        </div>

                                                        <div className="ap-muted" style={{ fontSize: 12, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                <BusinessOutlinedIcon fontSize="inherit" /> {r.companyName || '—'}
                                                            </span>
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                <PhoneIphoneOutlinedIcon fontSize="inherit" /> {r.phone || '—'}
                                                            </span>
                                                        </div>

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                            <span
                                                                className="ap-link"
                                                                onClick={() => {
                                                                    setRecruiterProfile(r);
                                                                    setRecruiterProfileOpen(true);
                                                                }}
                                                                role="button"
                                                                tabIndex={0}
                                                            >
                                                                View Profile
                                                            </span>
                                                            <div style={{ display: 'flex', gap: 10 }}>
                                                                <Button
                                                                    variant="contained"
                                                                    onClick={() => onApprove(r.userId)}
                                                                    startIcon={<CheckCircleOutlineRoundedIcon />}
                                                                    sx={{
                                                                        bgcolor: '#1f3a8a',
                                                                        '&:hover': { bgcolor: '#1d4ed8' },
                                                                        textTransform: 'none',
                                                                        fontWeight: 900,
                                                                        borderRadius: '14px',
                                                                    }}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    variant="outlined"
                                                                    color="error"
                                                                    onClick={() => onReject(r.userId)}
                                                                    startIcon={<CancelOutlinedIcon />}
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        fontWeight: 900,
                                                                        borderRadius: '14px',
                                                                    }}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </Stack>
                                        )}
                                    </div>

                                    <div className="ap-card ap-pad">
                                        <div className="ap-users-head">
                                            <div>
                                                <div className="ap-section-title">Users</div>
                                                <div className="ap-sub" style={{ marginTop: 0 }}>
                                                    Manage candidate and recruiter accounts
                                                </div>
                                            </div>
                                            <IconButton
                                                onClick={() => setPage('users')}
                                                sx={{
                                                    border: '1px solid rgba(15,23,42,0.10)',
                                                    borderRadius: '14px',
                                                    width: 40,
                                                    height: 40,
                                                    background: 'rgba(255,255,255,0.78)',
                                                }}
                                                title="Open Users"
                                            >
                                                <PeopleAltOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </div>
                                        <Divider sx={{ my: 2 }} />

                                        <TextField
                                            size="small"
                                            fullWidth
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search users..."
                                        />
                                        <Divider sx={{ my: 2 }} />

                                        {filteredUsers.length === 0 ? (
                                            <div className="ap-muted">No users found.</div>
                                        ) : (
                                            <div className="ap-scroll">
                                                <Stack spacing={1}>
                                                    {filteredUsers.slice(0, 50).map((u) => (
                                                        <div className="ap-userrow" key={u.id}>
                                                            <Avatar
                                                                sx={{
                                                                    width: 36,
                                                                    height: 36,
                                                                    bgcolor: 'rgba(31,58,138,0.10)',
                                                                    color: '#1f3a8a',
                                                                    fontWeight: 950,
                                                                    border: '1px solid rgba(31,58,138,0.12)',
                                                                }}
                                                            >
                                                                {initials(u.email)}
                                                            </Avatar>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div className="ap-userrow__email">{u.email}</div>
                                                                <div className="ap-userrow__meta">
                                                                    <span className="ap-rolepill">{String(u.role)}</span>
                                                                    <span className={`ap-statuspill ${u.enabled ? '' : 'is-blocked'}`}>
                                                                        {u.enabled ? 'Active' : 'Blocked'}
                                                                    </span>
                                                                    {String(u.role) === 'RECRUITER' ? (
                                                                        <span className="ap-statuspill">
                                                                            Approved: {u.recruiterApproved ? 'Yes' : 'No'}
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 6 }}>
                                                                <IconButton
                                                                    title="More"
                                                                    onClick={(e) => {
                                                                        setUserMenuTarget(u);
                                                                        setUserMenuAnchor(e.currentTarget);
                                                                    }}
                                                                >
                                                                    <MoreHorizRoundedIcon />
                                                                </IconButton>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </Stack>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Stack>
                        ) : null}

                        {page === 'users' ? (
                            <div className="ap-card ap-pad">
                                <div className="ap-section-title">Users</div>
                                <div className="ap-sub">Search, review and delete users</div>
                                <Divider sx={{ my: 2 }} />
                                <TextField
                                    size="small"
                                    fullWidth
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search users..."
                                />
                                <Divider sx={{ my: 2 }} />
                                {filteredUsers.length === 0 ? (
                                    <div className="ap-muted">No users found.</div>
                                ) : (
                                    <div className="ap-scroll" style={{ maxHeight: 720 }}>
                                        <Stack spacing={1}>
                                            {filteredUsers.map((u) => (
                                                <div className="ap-userrow" key={`u-${u.id}`}>
                                                    <Avatar
                                                        sx={{
                                                            width: 36,
                                                            height: 36,
                                                            bgcolor: 'rgba(31,58,138,0.10)',
                                                            color: '#1f3a8a',
                                                            fontWeight: 950,
                                                            border: '1px solid rgba(31,58,138,0.12)',
                                                        }}
                                                    >
                                                        {initials(u.email)}
                                                    </Avatar>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div className="ap-userrow__email">{u.email}</div>
                                                        <div className="ap-userrow__meta">
                                                            <span className="ap-rolepill">{String(u.role)}</span>
                                                            <span className={`ap-statuspill ${u.enabled ? '' : 'is-blocked'}`}>
                                                                {u.enabled ? 'Active' : 'Blocked'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <IconButton
                                                            title="Delete"
                                                            onClick={() =>
                                                                setDeleteConfirm({
                                                                    open: true,
                                                                    userId: u.id,
                                                                    email: u.email,
                                                                })
                                                            }
                                                        >
                                                            <DeleteOutlineRoundedIcon color="error" />
                                                        </IconButton>
                                                        <IconButton
                                                            title="More"
                                                            onClick={(e) => {
                                                                setUserMenuTarget(u);
                                                                setUserMenuAnchor(e.currentTarget);
                                                            }}
                                                        >
                                                            <MoreHorizRoundedIcon />
                                                        </IconButton>
                                                    </div>
                                                </div>
                                            ))}
                                        </Stack>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {page === 'jobs' ? (
                            <div className="ap-card ap-pad">
                                <div className="ap-section-title">Jobs</div>
                                <div className="ap-sub">Recent job postings</div>
                                <Divider sx={{ my: 2 }} />
                                {recentJobs.length === 0 ? (
                                    <div className="ap-muted">No jobs.</div>
                                ) : (
                                    <Stack spacing={1}>
                                        {recentJobs.map((j) => (
                                            <div key={j.id} className="ap-approval">
                                                <div className="ap-approval__top">
                                                    <div style={{ minWidth: 0 }}>
                                                        <div className="ap-approval__name">{j.title}</div>
                                                        <div className="ap-approval__email">{j.recruiterEmail}</div>
                                                    </div>
                                                    <div className="ap-badge">{String(j.status)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </Stack>
                                )}
                            </div>
                        ) : null}

                        {page === 'applications' ? (
                            <div className="ap-card ap-pad">
                                <div className="ap-section-title">Applications</div>
                                <div className="ap-sub">Recent application activity</div>
                                <Divider sx={{ my: 2 }} />
                                {recentApplications.length === 0 ? (
                                    <div className="ap-muted">No applications.</div>
                                ) : (
                                    <Stack spacing={1}>
                                        {recentApplications.map((a) => (
                                            <div key={a.id} className="ap-approval">
                                                <div className="ap-approval__top">
                                                    <div style={{ minWidth: 0 }}>
                                                        <div className="ap-approval__name">{a.jobTitle}</div>
                                                        <div className="ap-approval__email">{a.candidateEmail}</div>
                                                    </div>
                                                    <div className="ap-badge">{String(a.status)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </Stack>
                                )}
                            </div>
                        ) : null}
                    </div>
                </main>
            </div>

            <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={() => {
                    setUserMenuAnchor(null);
                    setUserMenuTarget(null);
                }}
            >
                <MenuItem
                    onClick={() => {
                        if (userMenuTarget) {
                            setDeleteConfirm({ open: true, userId: userMenuTarget.id, email: userMenuTarget.email });
                        }
                        setUserMenuAnchor(null);
                    }}
                >
                    <DeleteOutlineRoundedIcon fontSize="small" style={{ marginRight: 8, color: '#ef4444' }} />
                    Delete
                </MenuItem>
            </Menu>

            <Dialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, userId: null, email: '' })}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Delete User?</DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        This will permanently delete{' '}
                        <b>{deleteConfirm.email || 'this user'}</b>.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm({ open: false, userId: null, email: '' })}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={async () => {
                            const id = deleteConfirm.userId;
                            setDeleteConfirm({ open: false, userId: null, email: '' });
                            if (id) await onDeleteUser(id);
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={recruiterProfileOpen}
                onClose={() => {
                    setRecruiterProfileOpen(false);
                    setRecruiterProfile(null);
                }}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Recruiter Profile</DialogTitle>
                <DialogContent dividers>
                    {!recruiterProfile ? (
                        <Typography color="text.secondary">No profile selected.</Typography>
                    ) : (
                        <Stack spacing={2}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: 'rgba(11,95,255,0.10)',
                                        color: 'rgba(11,95,255,0.95)',
                                        fontWeight: 950,
                                    }}
                                >
                                    {initials(recruiterProfile.contactPerson || recruiterProfile.companyName || recruiterProfile.email)}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="h6" noWrap>
                                        {recruiterProfile.contactPerson || 'Recruiter'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                        {recruiterProfile.email}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1 }} />
                                <div className="ap-badge">Pending</div>
                            </Stack>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Company
                                    </Typography>
                                    <Typography>{recruiterProfile.companyName || '—'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Phone
                                    </Typography>
                                    <Typography>{recruiterProfile.phone || '—'}</Typography>
                                </Grid>
                            </Grid>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRecruiterProfileOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={toast.open}
                autoHideDuration={2500}
                onClose={() => setToast((t) => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setToast((t) => ({ ...t, open: false }))}
                    severity={toast.severity}
                    sx={{ width: '100%' }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default AdminDashboard;
