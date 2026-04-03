import React, { useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography,
    Chip,
    Badge,
    IconButton,
    Tooltip,
} from '@mui/material';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { me } from '../../services/authService';
import '../../styles/dashboard.css';
import '../../styles/stitchRecruiter.css';
import {
    createJob,
    deleteJob,
    emailCandidate,
    getJobApplications,
    getMatchedCandidates,
    listMyJobs,
    getRecruiterNotifications,
    updateJob,
    updateApplicationStatus,
} from '../../services/recruiterService';
import {
    createRecruiterPost,
    getRecruiterProfile,
    updateRecruiterProfile,
    uploadRecruiterPhoto,
} from '../../services/recruiterProfileService';
import PostsFeed from '../posts/PostsFeed';
import { resolveUploadUrl } from '../../utils/url';

const splitCsv = (text) =>
    (text || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

const RecruiterDashboard = () => {
    const { user, updateUser, logout } = useAuth();
    const nav = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [matchedCandidates, setMatchedCandidates] = useState([]);
    const [applications, setApplications] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [editingJobId, setEditingJobId] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [profileCandidate, setProfileCandidate] = useState(null);
    const [createJobOpen, setCreateJobOpen] = useState(false);
    const [profilePanelOpen, setProfilePanelOpen] = useState(true);

    const [postDialogOpen, setPostDialogOpen] = useState(false);
    const [postCaption, setPostCaption] = useState('');
    const [postFile, setPostFile] = useState(null);
    const [posting, setPosting] = useState(false);
    const [postsReloadKey, setPostsReloadKey] = useState(0);
    const [section, setSection] = useState('dashboard'); // dashboard | jobs | candidates | posts | analytics | settings

    const [profileForm, setProfileForm] = useState({
        email: '',
        companyName: '',
        contactPerson: '',
        phone: '',
        position: '',
        professionalSummary: '',
        profilePhotoUrl: '',
    });
    const [profileSaving, setProfileSaving] = useState(false);

    const [jobForm, setJobForm] = useState({
        title: '',
        description: '',
        minExperienceYears: 0,
        requiredSkillsText: '',
        keywordsText: '',
        status: 'ACTIVE',
    });

    const [emailForm, setEmailForm] = useState({
        applicationId: '',
        subject: '',
        message: '',
    });

    const refreshJobs = async () => {
        const res = await listMyJobs();
        setJobs(res.data || []);
    };

    const refreshNotifications = async () => {
        const res = await getRecruiterNotifications();
        setNotifications(res.data || []);
    };

    const refreshSelectedJobData = async (jobId) => {
        if (!jobId) return;
        const [mc, apps] = await Promise.all([getMatchedCandidates(jobId), getJobApplications(jobId)]);
        setMatchedCandidates(mc.data || []);
        setApplications(apps.data || []);
    };

    useEffect(() => {
        const boot = async () => {
            setLoading(true);
            setError('');
            setSuccess('');
            try {
                const meRes = await me();
                if (meRes?.data) {
                    updateUser({
                        id: meRes.data.id,
                        email: meRes.data.email,
                        role: meRes.data.role,
                        recruiterApproved: !!meRes.data.recruiterApproved,
                    });
                }

                // If recruiter isn't approved, don't hit recruiter APIs that will 403.
                if (!meRes?.data?.recruiterApproved) return;

                await refreshJobs();
                await refreshNotifications();
                const rp = await getRecruiterProfile();
                setProfileForm({
                    email: rp.data.email || '',
                    companyName: rp.data.companyName || '',
                    contactPerson: rp.data.contactPerson || '',
                    phone: rp.data.phone || '',
                    position: rp.data.position || '',
                    professionalSummary: rp.data.professionalSummary || '',
                    profilePhotoUrl: rp.data.profilePhotoUrl || '',
                });
            } catch (e) {
                setError(e.response?.data?.message || e.response?.data || 'Failed to load recruiter data');
            } finally {
                setLoading(false);
            }
        };
        boot();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onPickRecruiterPhoto = async (file) => {
        if (!file) return;
        setError('');
        setSuccess('');
        try {
            const res = await uploadRecruiterPhoto(file);
            const url = res.data?.url || '';
            setProfileForm((p) => ({ ...p, profilePhotoUrl: url }));
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Photo upload failed');
        }
    };

    const onSaveRecruiterProfile = async () => {
        setError('');
        setSuccess('');
        setProfileSaving(true);
        try {
            const payload = {
                companyName: profileForm.companyName,
                contactPerson: profileForm.contactPerson,
                phone: profileForm.phone,
                position: profileForm.position,
                professionalSummary: profileForm.professionalSummary,
                profilePhotoUrl: profileForm.profilePhotoUrl,
            };
            await updateRecruiterProfile(payload);
            setSuccess('Recruiter profile saved.');
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Profile save failed');
        } finally {
            setProfileSaving(false);
        }
    };

    const onCreatePostFromHeader = async () => {
        const cap = postCaption.trim();
        if (!cap && !postFile) {
            setError('Write a caption or upload an image.');
            return;
        }
        setPosting(true);
        setError('');
        setSuccess('');
        try {
            await createRecruiterPost(cap, postFile);
            setPostCaption('');
            setPostFile(null);
            setPostDialogOpen(false);
            setSuccess('Posted successfully.');
            setPostsReloadKey((k) => k + 1);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Post failed');
        } finally {
            setPosting(false);
        }
    };

    useEffect(() => {
        const run = async () => {
            setError('');
            try {
                await refreshSelectedJobData(selectedJobId);
            } catch (e) {
                setError(e.response?.data?.message || e.response?.data || 'Failed to load job details');
            }
        };
        if (selectedJobId && user?.recruiterApproved) run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedJobId]);

    useEffect(() => {
        // Auto-select a job after jobs load so matched candidates/applications populate immediately.
        if (!user?.recruiterApproved) return;
        if (selectedJobId) return;
        if (!jobs || jobs.length === 0) return;
        setSelectedJobId(String(jobs[0].id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobs, user?.recruiterApproved]);

    const onCreateJob = async () => {
        setError('');
        setSuccess('');
        try {
            const payload = {
                title: jobForm.title,
                description: jobForm.description,
                minExperienceYears: Number(jobForm.minExperienceYears) || 0,
                requiredSkills: splitCsv(jobForm.requiredSkillsText),
                keywords: splitCsv(jobForm.keywordsText),
                status: jobForm.status,
            };
            if (editingJobId) {
                await updateJob(editingJobId, payload);
                setSuccess('Job updated.');
            } else {
                const created = await createJob(payload);
                setSuccess('Job created.');
                const newId = created?.data?.id;
                if (newId) {
                    setSelectedJobId(String(newId));
                    await refreshSelectedJobData(String(newId));
                }
            }
            setJobForm({
                title: '',
                description: '',
                minExperienceYears: 0,
                requiredSkillsText: '',
                keywordsText: '',
                status: 'ACTIVE',
            });
            setEditingJobId(null);
            await refreshJobs();
            await refreshNotifications();
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Job creation failed');
        }
    };

    const onDeleteJob = async (jobId) => {
        setError('');
        setSuccess('');
        try {
            await deleteJob(jobId);
            if (String(selectedJobId) === String(jobId)) {
                setSelectedJobId('');
                setMatchedCandidates([]);
                setApplications([]);
            }
            if (String(editingJobId) === String(jobId)) {
                setEditingJobId(null);
                setJobForm({
                    title: '',
                    description: '',
                    minExperienceYears: 0,
                    requiredSkillsText: '',
                    keywordsText: '',
                    status: 'ACTIVE',
                });
            }
            await refreshJobs();
            await refreshNotifications();
            setSuccess('Job deleted.');
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Delete failed');
        }
    };

    const onUpdateAppStatus = async (applicationId, status) => {
        setError('');
        setSuccess('');
        try {
            await updateApplicationStatus(applicationId, status);
            await refreshSelectedJobData(selectedJobId);
            await refreshNotifications();
            setSuccess(`Application updated: ${status}`);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Status update failed');
        }
    };

    const openCandidateProfile = (c) => {
        setProfileCandidate(c || null);
        setProfileOpen(true);
    };

    const onSendEmail = async () => {
        setError('');
        setSuccess('');
        try {
            await emailCandidate(emailForm.applicationId, emailForm.subject, emailForm.message);
            setEmailForm({ applicationId: '', subject: '', message: '' });
            setSuccess('Email sent (or queued).');
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Email send failed');
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="jp-dashboard">
            <Box className="jp-dashboard__inner">
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                    <Typography variant="h4" className="jp-dashboard__title">
                        Recruiter Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Signed in as {user?.email}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={createJobOpen ? 'Hide job form' : 'Create job'}>
                        <IconButton
                            onClick={() => setCreateJobOpen((v) => !v)}
                            sx={{
                                border: '1px solid rgba(0, 113, 227, 0.28)',
                                background: 'rgba(255,255,255,0.65)',
                            }}
                        >
                            <WorkOutlineRoundedIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Create post">
                        <IconButton
                            onClick={() => setPostDialogOpen(true)}
                            sx={{
                                border: '1px solid rgba(0, 113, 227, 0.28)',
                                background: 'rgba(255,255,255,0.65)',
                            }}
                        >
                            <AddCircleOutlineRoundedIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Notifications">
                        <IconButton
                            sx={{
                                border: '1px solid rgba(0, 113, 227, 0.28)',
                                background: 'rgba(255,255,255,0.65)',
                            }}
                            onClick={() => nav('/recruiter-notifications')}
                        >
                            <Badge color="primary" badgeContent={selectedJobId ? applications.length : 0} max={99}>
                                <NotificationsNoneRoundedIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={profilePanelOpen ? 'Hide profile panel' : 'Show profile panel'}>
                        <IconButton
                            onClick={() => setProfilePanelOpen((v) => !v)}
                            sx={{
                                border: '1px solid rgba(0, 113, 227, 0.28)',
                                background: 'rgba(255,255,255,0.65)',
                            }}
                        >
                            {profilePanelOpen ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        onClick={logout}
                        sx={{
                            backgroundColor: '#1976d2',
                            color: '#fff',
                            '&:hover': { backgroundColor: '#1565c0' },
                        }}
                    >
                        Logout
                    </Button>
                </Stack>
            </Stack>

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

            {!user?.recruiterApproved ? (
                <Alert severity="warning">
                    Your recruiter account is pending Admin approval. You can log in, but recruiter features
                    are disabled until approval.
                </Alert>
            ) : (
                <Grid container spacing={2}>
                    {!profilePanelOpen && (
                        <Box sx={{ position: 'fixed', right: 16, top: 130, zIndex: 2 }}>
                            <Tooltip title="Open profile panel">
                                <IconButton
                                    onClick={() => setProfilePanelOpen(true)}
                                    sx={{
                                        border: '1px solid rgba(0, 113, 227, 0.28)',
                                        background: 'rgba(255,255,255,0.75)',
                                    }}
                                >
                                    <ChevronLeftRoundedIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                    <Grid item xs={12} md={4}>
                        <Collapse in={createJobOpen} timeout="auto" unmountOnExit>
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {editingJobId ? `Edit Job (#${editingJobId})` : 'Create Job Posting'}
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Stack spacing={2}>
                                    <TextField
                                        label="Title"
                                        value={jobForm.title}
                                        onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Description"
                                        value={jobForm.description}
                                        onChange={(e) =>
                                            setJobForm({ ...jobForm, description: e.target.value })
                                        }
                                        fullWidth
                                        multiline
                                        minRows={3}
                                    />
                                    <TextField
                                        label="Min Experience (Years)"
                                        type="number"
                                        value={jobForm.minExperienceYears}
                                        onChange={(e) =>
                                            setJobForm({ ...jobForm, minExperienceYears: e.target.value })
                                        }
                                        fullWidth
                                    />
                                    <TextField
                                        label="Required Skills (comma separated)"
                                        value={jobForm.requiredSkillsText}
                                        onChange={(e) =>
                                            setJobForm({ ...jobForm, requiredSkillsText: e.target.value })
                                        }
                                        fullWidth
                                    />
                                    <TextField
                                        label="Keywords (comma separated)"
                                        value={jobForm.keywordsText}
                                        onChange={(e) =>
                                            setJobForm({ ...jobForm, keywordsText: e.target.value })
                                        }
                                        fullWidth
                                    />
                                    <TextField
                                        select
                                        label="Status"
                                        value={jobForm.status}
                                        onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}
                                        fullWidth
                                    >
                                        <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                                        <MenuItem value="CLOSED">CLOSED</MenuItem>
                                    </TextField>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                        <Button variant="contained" onClick={onCreateJob} fullWidth>
                                            {editingJobId ? 'Update Job' : 'Create Job'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setEditingJobId(null);
                                                setJobForm({
                                                    title: '',
                                                    description: '',
                                                    minExperienceYears: 0,
                                                    requiredSkillsText: '',
                                                    keywordsText: '',
                                                    status: 'ACTIVE',
                                                });
                                            }}
                                            fullWidth
                                        >
                                            Clear
                                        </Button>
                                    </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Collapse>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    My Job Postings
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {jobs.length === 0 ? (
                                    <Typography color="text.secondary">No job postings yet.</Typography>
                                ) : (
                                    <Stack spacing={1}>
                                        {jobs.map((j) => (
                                            <Card
                                                key={j.id}
                                                variant="outlined"
                                                sx={{
                                                    borderColor:
                                                        String(selectedJobId) === String(j.id)
                                                            ? 'primary.main'
                                                            : 'divider',
                                                }}
                                            >
                                                <CardContent>
                                                    <Stack
                                                        direction="row"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <Box
                                                            sx={{ cursor: 'pointer' }}
                                                            onClick={() => setSelectedJobId(j.id)}
                                                        >
                                                            <Typography variant="subtitle1">{j.title}</Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {j.status} · min exp {j.minExperienceYears}
                                                            </Typography>
                                                        </Box>
                                                        <Stack direction="row" spacing={1}>
                                                            <Button
                                                                variant="outlined"
                                                                onClick={() => {
                                                                    setEditingJobId(j.id);
                                                                    setJobForm({
                                                                        title: j.title || '',
                                                                        description: j.description || '',
                                                                        minExperienceYears: j.minExperienceYears ?? 0,
                                                                        requiredSkillsText: (j.requiredSkills || []).join(', '),
                                                                        keywordsText: (j.keywords || []).join(', '),
                                                                        status: j.status || 'ACTIVE',
                                                                    });
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                color="error"
                                                                variant="outlined"
                                                                onClick={() => onDeleteJob(j.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </Stack>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Matched Candidates {selectedJobId ? `(Job #${selectedJobId})` : ''}
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {!selectedJobId ? (
                                    <Typography color="text.secondary">
                                        Select a job posting to view matched candidates.
                                    </Typography>
                                ) : matchedCandidates.length === 0 ? (
                                    <Typography color="text.secondary">No matches found yet.</Typography>
                                ) : (
                                    <Stack spacing={1}>
                                        {matchedCandidates.map((c) => (
                                            <Card key={c.candidateUserId} variant="outlined">
                                                <CardContent>
                                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                                                        <Avatar src={resolveUploadUrl(c.profilePhotoDataUrl) || undefined} />
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="subtitle1" noWrap>
                                                                {c.fullName || 'Candidate'} ({c.candidateEmail})
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ flex: 1 }} />
                                                        <Button
                                                            size="small"
                                                            variant="text"
                                                            onClick={() => openCandidateProfile(c)}
                                                        >
                                                            View Profile
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            disabled={!c.resumeUrl}
                                                            onClick={() => {
                                                                const url = resolveUploadUrl(c.resumeUrl);
                                                                if (url) window.open(url, '_blank', 'noopener,noreferrer');
                                                            }}
                                                        >
                                                            View Resume
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            disabled={!c.applicationId}
                                                            onClick={() => onUpdateAppStatus(c.applicationId, 'SHORTLISTED')}
                                                        >
                                                            Shortlist
                                                        </Button>
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Match: {c.matchScorePercent}% (skills {c.exactSkillMatches}, keywords {c.keywordMatches}) · exp {c.experienceYears} years
                                                    </Typography>
                                                    {!c.applicationId && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Not applied yet. Shortlisting is enabled after the candidate applies.
                                                        </Typography>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>

                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Applications
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {!selectedJobId ? (
                                    <Typography color="text.secondary">
                                        Select a job posting to view applications.
                                    </Typography>
                                ) : applications.length === 0 ? (
                                    <Typography color="text.secondary">No applications yet.</Typography>
                                ) : (
                                    <Stack spacing={1}>
                                        {applications.map((a) => (
                                            <Card key={a.applicationId} variant="outlined">
                                                <CardContent>
                                                    <Stack
                                                        direction={{ xs: 'column', sm: 'row' }}
                                                        justifyContent="space-between"
                                                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                                                        spacing={1}
                                                    >
                                                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                                                            <Avatar src={resolveUploadUrl(a.profilePhotoDataUrl) || undefined} />
                                                            <Box sx={{ minWidth: 0 }}>
                                                                <Typography variant="subtitle1" noWrap>
                                                                    {a.candidateName || 'Candidate'} ({a.candidateEmail})
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Status: {a.status}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ flex: 1 }} />
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                disabled={!a.resumeUrl}
                                                                onClick={() => {
                                                                    const url = resolveUploadUrl(a.resumeUrl);
                                                                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                                                                }}
                                                            >
                                                                Resume
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="text"
                                                                onClick={() =>
                                                                    setEmailForm((p) => ({
                                                                        ...p,
                                                                        applicationId: String(a.applicationId),
                                                                        subject:
                                                                            p.subject ||
                                                                            `Update on your application (Job #${selectedJobId})`,
                                                                    }))
                                                                }
                                                            >
                                                                Email
                                                            </Button>
                                                        </Stack>
                                                        <Stack direction="row" spacing={1}>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() =>
                                                                    onUpdateAppStatus(a.applicationId, 'SHORTLISTED')
                                                                }
                                                            >
                                                                Shortlist
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                color="error"
                                                                onClick={() =>
                                                                    onUpdateAppStatus(a.applicationId, 'REJECTED')
                                                                }
                                                            >
                                                                Reject
                                                            </Button>
                                                        </Stack>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Email Candidate
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

	                                <Stack spacing={2}>
	                                    <TextField
	                                        select
	                                        label="Application"
	                                        value={emailForm.applicationId}
	                                        onChange={(e) =>
	                                            setEmailForm({ ...emailForm, applicationId: e.target.value })
	                                        }
	                                        fullWidth
	                                        disabled={!selectedJobId || applications.length === 0}
	                                    >
	                                        {applications.map((a) => (
	                                            <MenuItem key={`app-${a.applicationId}`} value={String(a.applicationId)}>
	                                                #{a.applicationId} · {a.candidateEmail} · {a.status}
	                                            </MenuItem>
	                                        ))}
	                                    </TextField>
                                    <TextField
                                        label="Subject"
                                        value={emailForm.subject}
                                        onChange={(e) =>
                                            setEmailForm({ ...emailForm, subject: e.target.value })
                                        }
                                        fullWidth
                                    />
                                    <TextField
                                        label="Message"
                                        value={emailForm.message}
                                        onChange={(e) =>
                                            setEmailForm({ ...emailForm, message: e.target.value })
                                        }
                                        fullWidth
                                        multiline
                                        minRows={3}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={onSendEmail}
                                        disabled={!emailForm.applicationId || !emailForm.subject || !emailForm.message}
                                    >
                                        Send Email
                                    </Button>
                                    <Typography variant="caption" color="text.secondary">
                                        Note: Email sending requires SMTP config in backend `application.properties`.
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {profilePanelOpen && (
                        <Grid item xs={12} md={3}>
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Recruiter Profile
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Stack spacing={2} sx={{ minWidth: 0 }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Avatar
                                                src={resolveUploadUrl(profileForm.profilePhotoUrl) || undefined}
                                                sx={{ width: 56, height: 56, border: '1px solid rgba(15,23,42,0.12)' }}
                                            />
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Tooltip title="Upload profile photo">
                                                    <IconButton component="label">
                                                        <PhotoCameraOutlinedIcon />
                                                        <input
                                                            hidden
                                                            accept="image/*"
                                                            type="file"
                                                            onChange={(e) => onPickRecruiterPhoto(e.target.files?.[0])}
                                                        />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Remove photo">
                                                    <span>
                                                        <IconButton
                                                            disabled={!profileForm.profilePhotoUrl}
                                                            onClick={() => setProfileForm((p) => ({ ...p, profilePhotoUrl: '' }))}
                                                        >
                                                            <DeleteOutlineIcon />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>

                                        <TextField label="Email" value={profileForm.email || ''} disabled fullWidth />
                                        <TextField
                                            label="Company Name"
                                            value={profileForm.companyName}
                                            onChange={(e) => setProfileForm((p) => ({ ...p, companyName: e.target.value }))}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Contact Person"
                                            value={profileForm.contactPerson}
                                            onChange={(e) => setProfileForm((p) => ({ ...p, contactPerson: e.target.value }))}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Phone"
                                            value={profileForm.phone}
                                            onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Position In Company"
                                            value={profileForm.position}
                                            onChange={(e) => setProfileForm((p) => ({ ...p, position: e.target.value }))}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Professional Summary"
                                            value={profileForm.professionalSummary}
                                            onChange={(e) =>
                                                setProfileForm((p) => ({ ...p, professionalSummary: e.target.value }))
                                            }
                                            fullWidth
                                            multiline
                                            minRows={3}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={onSaveRecruiterProfile}
                                            disabled={profileSaving}
                                            fullWidth
                                        >
                                            {profileSaving ? 'Saving...' : 'Save Profile'}
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>

                            <PostsFeed title="Posts" canPost={false} reloadKey={postsReloadKey} />
                        </Grid>
                    )}
                </Grid>
            )}
            </Box>

            <Dialog open={postDialogOpen} onClose={() => setPostDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Create Post</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <TextField
                            label="Caption"
                            value={postCaption}
                            onChange={(e) => setPostCaption(e.target.value)}
                            fullWidth
                            multiline
                            minRows={3}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
                            <Button variant="outlined" component="label" fullWidth>
                                {postFile ? 'Change Image' : 'Upload Image'}
                                <input
                                    hidden
                                    accept="image/*"
                                    type="file"
                                    onChange={(e) => setPostFile(e.target.files?.[0] || null)}
                                />
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                fullWidth
                                disabled={!postFile}
                                onClick={() => setPostFile(null)}
                            >
                                Remove Image
                            </Button>
                        </Stack>
                        {postFile && (
                            <Typography variant="caption" color="text.secondary">
                                Selected: {postFile.name}
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPostDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={onCreatePostFromHeader} disabled={posting}>
                        {posting ? 'Posting...' : 'Post'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Candidate Profile</DialogTitle>
                <DialogContent dividers>
                    {!profileCandidate ? (
                        <Typography color="text.secondary">No candidate selected.</Typography>
                    ) : (
                        <Stack spacing={2}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                    src={resolveUploadUrl(profileCandidate.profilePhotoDataUrl) || undefined}
                                    sx={{ width: 64, height: 64 }}
                                />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="h6" noWrap>
                                        {profileCandidate.fullName || 'Candidate'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                        {profileCandidate.candidateEmail}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Experience
                                    </Typography>
                                    <Typography>{profileCandidate.experienceYears} years</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Application
                                    </Typography>
                                    <Typography>
                                        {profileCandidate.applicationId
                                            ? `${profileCandidate.applicationStatus || 'APPLIED'} (#${profileCandidate.applicationId})`
                                            : 'Not applied'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">
                                        Phone
                                    </Typography>
                                    <Typography>{profileCandidate.phone || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">
                                        Education
                                    </Typography>
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                        {profileCandidate.education || '-'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">
                                        Professional Summary
                                    </Typography>
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                        {profileCandidate.professionalSummary || '-'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Skills
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                                    {(profileCandidate.skills || []).slice(0, 30).map((s, idx) => (
                                        <Chip key={`s-${idx}`} label={String(s)} size="small" sx={{ mb: 1 }} />
                                    ))}
                                    {(!profileCandidate.skills || profileCandidate.skills.length === 0) && (
                                        <Typography color="text.secondary">-</Typography>
                                    )}
                                </Stack>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Keywords
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                                    {(profileCandidate.keywords || []).slice(0, 30).map((k, idx) => (
                                        <Chip key={`k-${idx}`} label={String(k)} size="small" sx={{ mb: 1 }} />
                                    ))}
                                    {(!profileCandidate.keywords || profileCandidate.keywords.length === 0) && (
                                        <Typography color="text.secondary">-</Typography>
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        disabled={!profileCandidate?.resumeUrl}
                        onClick={() => {
                            const url = resolveUploadUrl(profileCandidate?.resumeUrl);
                            if (url) window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                    >
                        View Resume
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!profileCandidate?.applicationId}
                        onClick={() => {
                            if (!profileCandidate?.applicationId) return;
                            onUpdateAppStatus(profileCandidate.applicationId, 'SHORTLISTED');
                        }}
                    >
                        Shortlist
                    </Button>
                    <Button onClick={() => setProfileOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RecruiterDashboard;
