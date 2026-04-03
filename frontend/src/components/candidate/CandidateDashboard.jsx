import React, { useEffect, useState } from 'react';
import {
    Avatar,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Drawer,
    Grid,
    LinearProgress,
    Stack,
    TextField,
    Typography,
    Alert,
    IconButton,
    Tooltip,
    Chip,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import {
    getProfile,
    updateProfile,
    getMatchedJobs,
    getApplications,
    applyForJob,
    uploadProfilePhoto,
    uploadResume,
} from '../../services/candidateService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboard.css';
import { getAllJobs } from '../../services/jobService';
import { DEFAULT_KEYWORD_SUGGESTIONS, DEFAULT_SKILL_SUGGESTIONS } from '../../utils/suggestions';
import PostsFeed from '../posts/PostsFeed';
import { resolveUploadUrl } from '../../utils/url';

const splitCsv = (text) =>
    (text || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

const displayFilenameFromUrl = (url) => {
    const u = (url || '').trim();
    if (!u) return '';
    try {
        const full = resolveUploadUrl(u);
        const last = full.split('?')[0].split('#')[0].split('/').pop() || '';
        return decodeURIComponent(last);
    } catch {
        const last = u.split('?')[0].split('#')[0].split('/').pop() || '';
        return last;
    }
};

const CandidateDashboard = () => {
    const { user, logout } = useAuth();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        education: '',
        professionalSummary: '',
        profilePhotoDataUrl: '',
        resumeUrl: '',
        experienceYears: 0,
        skillsText: '',
        keywordsText: '',
    });

    const [matchedJobs, setMatchedJobs] = useState([]);
    const [allJobs, setAllJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [saving, setSaving] = useState(false);
    const [profileOpen, setProfileOpen] = useState(true);
    const [resumeUploading, setResumeUploading] = useState(false);
    const [skillOptions, setSkillOptions] = useState(DEFAULT_SKILL_SUGGESTIONS);
    const [keywordOptions, setKeywordOptions] = useState(DEFAULT_KEYWORD_SUGGESTIONS);

    const loadAll = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const [p, mj, apps, jobs] = await Promise.all([
                getProfile(),
                getMatchedJobs(),
                getApplications(),
                getAllJobs(),
            ]);
            setProfile(p.data);
            setForm({
                fullName: p.data.fullName || '',
                phone: p.data.phone || '',
                education: p.data.education || '',
                professionalSummary: p.data.professionalSummary || '',
                profilePhotoDataUrl: p.data.profilePhotoDataUrl || '',
                resumeUrl: p.data.resumeUrl || '',
                experienceYears: p.data.experienceYears ?? 0,
                skillsText: (p.data.skills || []).join(', '),
                keywordsText: (p.data.keywords || []).join(', '),
            });
            setMatchedJobs(mj.data || []);
            setApplications(apps.data || []);
            setAllJobs(jobs.data || []);

            const jobSkills = new Set();
            const jobKeywords = new Set();
            (jobs.data || []).forEach((j) => {
                (j.requiredSkills || []).forEach((s) => jobSkills.add(String(s)));
                (j.keywords || []).forEach((k) => jobKeywords.add(String(k)));
            });
            setSkillOptions(Array.from(new Set([...DEFAULT_SKILL_SUGGESTIONS, ...jobSkills])).sort((a, b) => a.localeCompare(b)));
            setKeywordOptions(Array.from(new Set([...DEFAULT_KEYWORD_SUGGESTIONS, ...jobKeywords])).sort((a, b) => a.localeCompare(b)));
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Failed to load candidate data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                fullName: form.fullName,
                phone: form.phone,
                education: form.education,
                professionalSummary: form.professionalSummary,
                profilePhotoDataUrl: form.profilePhotoDataUrl,
                experienceYears: Number(form.experienceYears) || 0,
                skills: splitCsv(form.skillsText),
                keywords: splitCsv(form.keywordsText),
            };
            const updated = await updateProfile(payload);
            setProfile(updated.data);
            await loadAll();
            setSuccess('Profile saved. You can now browse and apply to jobs.');
            setProfileOpen(false);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Profile update failed');
        } finally {
            setSaving(false);
        }
    };

    const onApply = async (jobId) => {
        setError('');
        try {
            await applyForJob(jobId);
            const apps = await getApplications();
            setApplications(apps.data || []);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Apply failed');
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    const computeCompleteness = () => {
        const checks = [
            (form.fullName || '').trim().length >= 2,
            (form.phone || '').trim().length >= 7,
            (form.education || '').trim().length > 0,
            Number(form.experienceYears) >= 0,
            splitCsv(form.skillsText).length > 0,
            splitCsv(form.keywordsText).length > 0,
            (form.professionalSummary || '').trim().length >= 30,
            (form.profilePhotoDataUrl || '').trim().length > 0,
            (form.resumeUrl || '').trim().length > 0,
        ];
        const done = checks.filter(Boolean).length;
        return Math.round((done / checks.length) * 100);
    };

    const completeness = computeCompleteness();
    const appliedJobIds = new Set((applications || []).map((a) => String(a.jobId)));

    const onPickPhoto = async (file) => {
        if (!file) return;
        setError('');
        setSuccess('');
        try {
            const res = await uploadProfilePhoto(file);
            const url = res.data?.url || '';
            setForm((prev) => ({ ...prev, profilePhotoDataUrl: url }));
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Photo upload failed');
        }
    };

    const onPickResume = async (file) => {
        if (!file) return;
        setError('');
        setSuccess('');
        setResumeUploading(true);
        try {
            const res = await uploadResume(file);
            const url = res.data?.url || '';
            setForm((prev) => ({ ...prev, resumeUrl: url }));
            setSuccess('Resume uploaded successfully.');
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Resume upload failed');
        } finally {
            setResumeUploading(false);
        }
    };

    return (
        <Box className="jp-dashboard">
            <Box className="jp-dashboard__inner">
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                    <Typography variant="h4" className="jp-dashboard__title">
                        Candidate Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Signed in as {user?.email}
                    </Typography>
                    <Box sx={{ mt: 1, maxWidth: 520 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                Profile completeness
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {completeness}%
                            </Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={completeness} />
                    </Box>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={profileOpen ? 'Hide profile panel' : 'Show profile panel'}>
                        <IconButton
                            onClick={() => setProfileOpen((v) => !v)}
                            aria-label="toggle profile panel"
                            sx={{
                                border: '1px solid rgba(0, 113, 227, 0.28)',
                                background: 'rgba(255,255,255,0.65)',
                            }}
                        >
                            {profileOpen ? <ChevronLeftRoundedIcon /> : <ChevronRightRoundedIcon />}
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

            <Drawer
                anchor="left"
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
                variant={isDesktop ? 'persistent' : 'temporary'}
                ModalProps={{ keepMounted: true }}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 420 },
                        p: 2,
                        background: 'rgba(255,255,255,0.78)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderRight: '1px solid rgba(15, 23, 42, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="h6">Profile</Typography>
                    <Tooltip title="Close">
                        <IconButton onClick={() => setProfileOpen(false)}>
                            <ChevronLeftRoundedIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, pb: 2 }}>
                    <Stack spacing={2} sx={{ minWidth: 0 }}>
                        {(saving || resumeUploading) && <LinearProgress />}
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                            <Avatar
                                src={resolveUploadUrl(form.profilePhotoDataUrl) || undefined}
                                sx={{ width: 72, height: 72, border: '1px solid rgba(15,23,42,0.12)' }}
                            />
                            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                    <Tooltip title="Upload profile photo">
                                        <IconButton component="label">
                                            <PhotoCameraOutlinedIcon />
                                            <input
                                                hidden
                                                accept="image/*"
                                                type="file"
                                                onChange={(e) => onPickPhoto(e.target.files?.[0])}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remove photo">
                                        <span>
                                            <IconButton
                                                disabled={!form.profilePhotoDataUrl}
                                                onClick={() => setForm((p) => ({ ...p, profilePhotoDataUrl: '' }))}
                                            >
                                                <DeleteOutlineIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Typography variant="body2" color="text.secondary">
                                        Photo
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Stack>

                        <TextField label="Email" value={profile?.email || ''} disabled fullWidth />
                        <TextField
                            label="Full Name"
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Phone"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Professional Summary"
                            value={form.professionalSummary}
                            onChange={(e) => setForm({ ...form, professionalSummary: e.target.value })}
                            placeholder="2 to 4 lines about your background, strengths, and what roles you're seeking."
                            fullWidth
                            multiline
                            minRows={4}
                        />
                        <TextField
                            label="Education"
                            value={form.education}
                            onChange={(e) => setForm({ ...form, education: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Experience (Years)"
                            type="number"
                            value={form.experienceYears}
                            onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                            fullWidth
                        />

                        <Box
                            sx={{
                                border: '1px solid rgba(15,23,42,0.10)',
                                borderRadius: 2,
                                p: 1.25,
                                background: 'rgba(255,255,255,0.55)',
                            }}
                        >
                            <Stack spacing={1}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                    <DescriptionOutlinedIcon fontSize="small" />
                                    <Typography variant="body2">Resume / CV</Typography>
                                </Stack>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                    title={form.resumeUrl ? displayFilenameFromUrl(form.resumeUrl) : ''}
                                    sx={{ maxWidth: '100%' }}
                                >
                                    {form.resumeUrl ? `Uploaded: ${displayFilenameFromUrl(form.resumeUrl)}` : 'Not uploaded'}
                                </Typography>

                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={1}
                                    alignItems="stretch"
                                    sx={{ mt: 0.5 }}
                                >
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        component="label"
                                        disabled={resumeUploading}
                                        fullWidth
                                    >
                                        Upload
                                        <input
                                            hidden
                                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            type="file"
                                            onChange={(e) => onPickResume(e.target.files?.[0])}
                                        />
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        disabled={!form.resumeUrl}
                                        fullWidth
                                        onClick={() => {
                                            const url = resolveUploadUrl(form.resumeUrl);
                                            if (url) window.open(url, '_blank', 'noopener,noreferrer');
                                        }}
                                    >
                                        View
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>

                        <Autocomplete
                        multiple
                        freeSolo
                        options={skillOptions}
                        value={splitCsv(form.skillsText)}
                        filterOptions={(options, state) => {
                            const q = (state.inputValue || '').trim().toLowerCase();
                            if (!q) return options.slice(0, 20);
                            return options
                                .filter((o) => String(o).toLowerCase().startsWith(q))
                                .slice(0, 20);
                        }}
                        onChange={(_, values) => {
                            const clean = (values || []).map((v) => String(v).trim()).filter(Boolean);
                            setForm((p) => ({ ...p, skillsText: clean.join(', ') }));
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Skills (type to search)"
                                placeholder="Start typing: Ja..., Spr..., Rea..."
                                fullWidth
                            />
                        )}
                    />
                    <Autocomplete
                        multiple
                        freeSolo
                        options={keywordOptions}
                        value={splitCsv(form.keywordsText)}
                        filterOptions={(options, state) => {
                            const q = (state.inputValue || '').trim().toLowerCase();
                            if (!q) return options.slice(0, 20);
                            return options
                                .filter((o) => String(o).toLowerCase().startsWith(q))
                                .slice(0, 20);
                        }}
                        onChange={(_, values) => {
                            const clean = (values || []).map((v) => String(v).trim()).filter(Boolean);
                            setForm((p) => ({ ...p, keywordsText: clean.join(', ') }));
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Keywords (type to search)"
                                placeholder="Start typing: java..., react..., backend..."
                                fullWidth
                            />
                        )}
                    />
                    </Stack>
                </Box>

                <Box
                    sx={{
                        position: 'sticky',
                        bottom: 0,
                        pt: 1,
                        pb: 1,
                        background: 'rgba(255,255,255,0.88)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        borderTop: '1px solid rgba(15,23,42,0.10)',
                    }}
                >
                    <Button variant="contained" onClick={onSave} disabled={saving} size="large" fullWidth>
                        {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                </Box>
            </Drawer>

            <Box
                sx={{
                    transition: 'margin 220ms ease',
                    ml: isDesktop && profileOpen ? '440px' : 0,
                }}
            >
                {!profileOpen && (
                    <Box sx={{ position: 'fixed', left: 16, top: 130, zIndex: 2 }}>
                        <Tooltip title="Open profile panel">
                            <IconButton
                                onClick={() => setProfileOpen(true)}
                                sx={{
                                    border: '1px solid rgba(0, 113, 227, 0.28)',
                                    background: 'rgba(255,255,255,0.75)',
                                }}
                            >
                                <ChevronRightRoundedIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}

                <Grid container spacing={2}>
                    <Grid item xs={12} md={12}>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Matched Jobs
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {matchedJobs.length === 0 ? (
                                <Typography color="text.secondary">
                                    No matched jobs yet. Add skills and keywords to improve matching.
                                </Typography>
                            ) : (
                                <Stack spacing={1.5}>
                                    {matchedJobs.map((job) => (
                                        <Card key={job.id} variant="outlined">
                                            <CardContent>
                                                <Stack
                                                    direction={{ xs: 'column', sm: 'row' }}
                                                    justifyContent="space-between"
                                                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                                                    spacing={1}
                                                >
                                                    <Box>
                                                        <Typography variant="subtitle1">
                                                            {job.title}
                                                        </Typography>
                                                        {!!job.companyName && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {job.companyName}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="body2" color="text.secondary">
                                                            Match: {job.matchScorePercent}% (skills {job.exactSkillMatches}, keywords {job.keywordMatches})
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => onApply(job.id)}
                                                        disabled={appliedJobIds.has(String(job.id))}
                                                    >
                                                        {appliedJobIds.has(String(job.id)) ? 'Applied' : 'Apply (1 click)'}
                                                    </Button>
                                                </Stack>
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
                                All Jobs
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            {allJobs.length === 0 ? (
                                <Typography color="text.secondary">
                                    No jobs posted yet.
                                </Typography>
                            ) : (
                                <Stack spacing={1.5}>
                                    {allJobs.map((job) => (
                                        <Card key={`all-${job.id}`} variant="outlined">
                                            <CardContent>
                                                <Stack
                                                    direction={{ xs: 'column', sm: 'row' }}
                                                    justifyContent="space-between"
                                                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                                                    spacing={1}
                                                >
                                                    <Box>
                                                        <Typography variant="subtitle1">{job.title}</Typography>
                                                        {!!job.companyName && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {job.companyName}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="body2" color="text.secondary">
                                                            Min Exp: {job.minExperienceYears} yrs
                                                        </Typography>
                                                        {Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                Skills: {job.requiredSkills.slice(0, 6).join(', ')}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => onApply(job.id)}
                                                        disabled={appliedJobIds.has(String(job.id))}
                                                    >
                                                        {appliedJobIds.has(String(job.id)) ? 'Applied' : 'Apply'}
                                                    </Button>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            )}
                        </CardContent>
                    </Card>

                    <Box sx={{ mb: 2 }}>
                        <PostsFeed title="Company Posts" canPost={false} />
                    </Box>

                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Applications
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {applications.length === 0 ? (
                                <Typography color="text.secondary">
                                    You have not applied to any jobs yet.
                                </Typography>
                            ) : (
                                <Stack spacing={1}>
                                    {applications.map((a) => (
                                        <Card key={a.id} variant="outlined">
                                            <CardContent>
                                                <Typography variant="subtitle2">
                                                    {a.jobTitle}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Status: {a.status}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                    </Grid>
                </Grid>
            </Box>
            </Box>
        </Box>
    );
};

export default CandidateDashboard;
