import React, { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Stack,
    TextField,
    Typography,
    MenuItem,
    Alert,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import { useNavigate, useParams } from 'react-router-dom';
import { resolveUploadUrl } from '../../utils/url';
import { listMyJobs } from '../../services/recruiterService';
import { getCandidateProfileForRecruiter } from '../../services/recruiterService';
import { listCandidatePosts } from '../../services/candidatePostService';
import { scheduleInterview } from '../../services/interviewService';
import '../../styles/atsRecruiter.css';

const fmtWhen = (iso) => {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return '';
    }
};

const empty = (v) => (v == null ? '' : String(v));

const RecruiterCandidateProfilePage = () => {
    const nav = useNavigate();
    const { candidateUserId } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [jobs, setJobs] = useState([]);

    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [scheduleErr, setScheduleErr] = useState('');
    const [scheduleOk, setScheduleOk] = useState('');
    const [scheduleSaving, setScheduleSaving] = useState(false);
    const [sched, setSched] = useState({
        jobId: '',
        type: 'HR',
        mode: 'ONLINE',
        scheduledAtLocal: '',
        meetingLink: '',
        notes: '',
    });

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [p, ps, js] = await Promise.all([
                getCandidateProfileForRecruiter(candidateUserId),
                listCandidatePosts(candidateUserId),
                listMyJobs(),
            ]);
            setProfile(p.data);
            setPosts(ps.data || []);
            setJobs(js.data || []);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [candidateUserId]);

    const about = empty(profile?.professionalSummary).trim();
    const skills = useMemo(() => Array.from(profile?.skills || []), [profile]);

    const projectPosts = useMemo(() => posts.filter((p) => String(p.type).toUpperCase() === 'PROJECT'), [posts]);
    const certPosts = useMemo(() => posts.filter((p) => String(p.type).toUpperCase() === 'CERTIFICATION'), [posts]);
    const achievementPosts = useMemo(() => posts.filter((p) => String(p.type).toUpperCase() === 'ACHIEVEMENT'), [posts]);
    const allPosts = posts;

    const onSchedule = async () => {
        setScheduleErr('');
        setScheduleOk('');
        if (!sched.jobId) {
            setScheduleErr('Please select a job.');
            return;
        }
        if (!sched.scheduledAtLocal) {
            setScheduleErr('Please pick date and time.');
            return;
        }
        setScheduleSaving(true);
        try {
            const scheduledAt = new Date(sched.scheduledAtLocal).toISOString();
            await scheduleInterview({
                jobId: Number(sched.jobId),
                candidateUserId: Number(candidateUserId),
                type: sched.type,
                mode: sched.mode,
                scheduledAt,
                meetingLink: sched.meetingLink,
                notes: sched.notes,
            });
            setScheduleOk('Interview scheduled. Candidate will be notified.');
        } catch (e) {
            setScheduleErr(e.response?.data?.message || e.response?.data || 'Failed to schedule interview');
        } finally {
            setScheduleSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!profile) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{error || 'Profile not found'}</Alert>
                <Button sx={{ mt: 2 }} variant="contained" onClick={() => nav('/recruiter-dashboard')}>
                    Back
                </Button>
            </Box>
        );
    }

    const resumeUrl = resolveUploadUrl(profile.resumeUrl || '');
    const photoUrl = resolveUploadUrl(profile.profilePhotoDataUrl || '');

    return (
        <div className="ats-shell" style={{ minHeight: '100vh' }}>
            <aside className="ats-sidebar" aria-label="Recruiter navigation">
                <div className="ats-brand">
                    <div className="ats-brand__mark">R</div>
                    <div className="ats-brand__text">
                        <div className="ats-brand__title">Recruiter</div>
                        <div className="ats-brand__sub">Candidate Profile</div>
                    </div>
                </div>
                <div className="ats-nav" role="navigation">
                    <button className="ats-nav__item" onClick={() => nav('/recruiter-dashboard?section=dashboard')} type="button">
                        Dashboard
                    </button>
                    <button className="ats-nav__item" onClick={() => nav('/recruiter-dashboard?section=jobs')} type="button">
                        Jobs
                    </button>
                    <button className="ats-nav__item is-active" onClick={() => {}} type="button">
                        Candidates
                    </button>
                    <button className="ats-nav__item" onClick={() => nav('/recruiter-dashboard?section=interviews')} type="button">
                        Interviews
                    </button>
                    <button className="ats-nav__item" onClick={() => nav('/recruiter-dashboard?section=settings')} type="button">
                        Settings
                    </button>
                </div>
            </aside>

            <main className="ats-main" style={{ padding: 28 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Button
                            startIcon={<ArrowBackRoundedIcon />}
                            variant="outlined"
                            onClick={() => nav(-1)}
                            sx={{ borderRadius: '14px' }}
                        >
                            Back
                        </Button>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                            Candidate Profile
                        </Typography>
                    </Stack>
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {String(error)}
                    </Alert>
                )}

                <Box
                    sx={{
                        background: 'rgba(255,255,255,0.78)',
                        border: '1px solid rgba(15,23,42,0.10)',
                        borderRadius: '16px',
                        boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
                        p: 2.5,
                    }}
                >
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
                        <Avatar
                            src={photoUrl || undefined}
                            sx={{ width: 84, height: 84, bgcolor: 'rgba(31,58,138,0.10)', color: '#1f3a8a', fontWeight: 900 }}
                        >
                            {(profile.fullName || '?').slice(0, 1).toUpperCase()}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                                {profile.fullName || profile.email}
                            </Typography>
                            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: 0.8, flexWrap: 'wrap' }}>
                                <Chip
                                    icon={<WorkOutlineRoundedIcon />}
                                    label={profile.roleTitle || 'Role not set'}
                                    sx={{ borderRadius: '999px', fontWeight: 800 }}
                                />
                                <Chip
                                    icon={<LocationOnOutlinedIcon />}
                                    label={profile.location || 'Location not set'}
                                    sx={{ borderRadius: '999px', fontWeight: 800 }}
                                />
                                <Chip
                                    label={`${Number(profile.experienceYears || 0)} yrs experience`}
                                    sx={{ borderRadius: '999px', fontWeight: 800 }}
                                />
                            </Stack>

                            <Stack direction="row" spacing={2.5} sx={{ mt: 1.2, flexWrap: 'wrap' }}>
                                <Typography variant="body2" sx={{ color: 'rgba(15,23,42,0.72)' }}>
                                    Phone: {profile.phone || 'Not provided'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(15,23,42,0.72)' }}>
                                    Email: {profile.email || 'Hidden'}
                                </Typography>
                            </Stack>
                        </Box>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ width: { xs: '100%', md: 'auto' } }}>
                            <Button
                                variant="outlined"
                                startIcon={<MailOutlineRoundedIcon />}
                                onClick={() => window.open(`mailto:${profile.email || ''}`, '_blank', 'noopener,noreferrer')}
                                sx={{ borderRadius: '14px' }}
                            >
                                Message
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<EventAvailableRoundedIcon />}
                                onClick={() => setScheduleOpen(true)}
                                sx={{ borderRadius: '14px', background: '#1f3a8a', fontWeight: 900 }}
                            >
                                Schedule Interview
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadRoundedIcon />}
                                disabled={!resumeUrl}
                                onClick={() => window.open(resumeUrl, '_blank', 'noopener,noreferrer')}
                                sx={{ borderRadius: '14px' }}
                            >
                                Download Resume
                            </Button>
                        </Stack>
                    </Stack>
                </Box>

                <Box sx={{ mt: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.25fr 0.75fr' }, gap: 2.5 }}>
                    <Box sx={{ display: 'grid', gap: 2.5 }}>
                        <Box sx={{ p: 2.2, borderRadius: '16px', border: '1px solid rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.78)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                About
                            </Typography>
                            <Divider sx={{ my: 1.2 }} />
                            <Typography sx={{ color: 'rgba(15,23,42,0.78)' }}>
                                {about || 'No summary added yet.'}
                            </Typography>
                        </Box>

                        <Box sx={{ p: 2.2, borderRadius: '16px', border: '1px solid rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.78)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                Skills
                            </Typography>
                            <Divider sx={{ my: 1.2 }} />
                            {skills.length === 0 ? (
                                <Typography sx={{ color: 'rgba(15,23,42,0.70)' }}>No skills added yet.</Typography>
                            ) : (
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                    {skills.map((s) => (
                                        <Chip key={s} label={s} sx={{ borderRadius: '999px', fontWeight: 800, mb: 1 }} />
                                    ))}
                                </Stack>
                            )}
                        </Box>

                        <Box sx={{ p: 2.2, borderRadius: '16px', border: '1px solid rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.78)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                Experience
                            </Typography>
                            <Divider sx={{ my: 1.2 }} />
                            <Typography sx={{ color: 'rgba(15,23,42,0.70)' }}>
                                Experience details (company, role, duration) are coming next. For now, use “About” and posts to highlight achievements.
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gap: 2.5 }}>
                        <Box sx={{ p: 2.2, borderRadius: '16px', border: '1px solid rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.78)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                Projects
                            </Typography>
                            <Divider sx={{ my: 1.2 }} />
                            {projectPosts.length === 0 ? (
                                <Typography sx={{ color: 'rgba(15,23,42,0.70)' }}>No project updates yet.</Typography>
                            ) : (
                                <Stack spacing={1.2}>
                                    {projectPosts.map((p) => (
                                        <Box key={p.id} sx={{ p: 1.4, borderRadius: '14px', border: '1px solid rgba(15,23,42,0.10)' }}>
                                            <Typography sx={{ fontWeight: 900 }}>{p.type}</Typography>
                                            <Typography sx={{ color: 'rgba(15,23,42,0.76)', mt: 0.6 }}>{p.content}</Typography>
                                            {p.linkUrl ? (
                                                <Typography sx={{ mt: 0.6 }}>
                                                    <a href={p.linkUrl} target="_blank" rel="noreferrer">
                                                        {p.linkUrl}
                                                    </a>
                                                </Typography>
                                            ) : null}
                                            <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.55)' }}>
                                                {fmtWhen(p.createdAt)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>

                        <Box sx={{ p: 2.2, borderRadius: '16px', border: '1px solid rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.78)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                Certifications
                            </Typography>
                            <Divider sx={{ my: 1.2 }} />
                            {certPosts.length === 0 ? (
                                <Typography sx={{ color: 'rgba(15,23,42,0.70)' }}>No certifications posted yet.</Typography>
                            ) : (
                                <Stack spacing={1.2}>
                                    {certPosts.map((p) => (
                                        <Box key={p.id} sx={{ p: 1.4, borderRadius: '14px', border: '1px solid rgba(15,23,42,0.10)' }}>
                                            <Typography sx={{ fontWeight: 900 }}>{p.type}</Typography>
                                            <Typography sx={{ color: 'rgba(15,23,42,0.76)', mt: 0.6 }}>{p.content}</Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.55)' }}>
                                                {fmtWhen(p.createdAt)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ mt: 2.5, p: 2.2, borderRadius: '16px', border: '1px solid rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.78)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Achievements / Posts
                    </Typography>
                    <Divider sx={{ my: 1.2 }} />
                    {achievementPosts.length === 0 && allPosts.length === 0 ? (
                        <Typography sx={{ color: 'rgba(15,23,42,0.70)' }}>No posts yet.</Typography>
                    ) : (
                        <Stack spacing={1.4}>
                            {allPosts.map((p) => (
                                <Box key={p.id} sx={{ p: 1.8, borderRadius: '16px', border: '1px solid rgba(15,23,42,0.10)' }}>
                                    <Stack direction="row" spacing={1.2} alignItems="center">
                                        <Avatar src={photoUrl || undefined} sx={{ width: 34, height: 34 }}>
                                            {(profile.fullName || '?').slice(0, 1).toUpperCase()}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>{profile.fullName || profile.email}</Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.60)' }}>
                                                {fmtWhen(p.createdAt)}
                                            </Typography>
                                        </Box>
                                        <Chip label={p.type} sx={{ borderRadius: '999px', fontWeight: 900 }} />
                                    </Stack>
                                    <Typography sx={{ mt: 1.1, color: 'rgba(15,23,42,0.82)', whiteSpace: 'pre-wrap' }}>
                                        {p.content}
                                    </Typography>
                                    {p.imageUrl ? (
                                        <Box sx={{ mt: 1.2 }}>
                                            <img
                                                alt="Post"
                                                src={resolveUploadUrl(p.imageUrl)}
                                                style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 14 }}
                                            />
                                        </Box>
                                    ) : null}
                                    {p.linkUrl ? (
                                        <Typography sx={{ mt: 1 }}>
                                            <a href={p.linkUrl} target="_blank" rel="noreferrer">
                                                {p.linkUrl}
                                            </a>
                                        </Typography>
                                    ) : null}
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>

                <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 950 }}>Schedule Interview</DialogTitle>
                    <DialogContent>
                        {scheduleErr ? (
                            <Alert severity="error" sx={{ mb: 1.2 }}>
                                {String(scheduleErr)}
                            </Alert>
                        ) : null}
                        {scheduleOk ? (
                            <Alert severity="success" sx={{ mb: 1.2 }}>
                                {String(scheduleOk)}
                            </Alert>
                        ) : null}

                        <Stack spacing={1.4} sx={{ mt: 0.6 }}>
                            <TextField
                                select
                                label="Job"
                                value={sched.jobId}
                                onChange={(e) => setSched((p) => ({ ...p, jobId: e.target.value }))}
                                fullWidth
                            >
                                {(jobs || []).map((j) => (
                                    <MenuItem key={j.id} value={String(j.id)}>
                                        {j.title}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4}>
                                <TextField
                                    select
                                    label="Type"
                                    value={sched.type}
                                    onChange={(e) => setSched((p) => ({ ...p, type: e.target.value }))}
                                    fullWidth
                                >
                                    <MenuItem value="HR">HR</MenuItem>
                                    <MenuItem value="TECHNICAL">Technical</MenuItem>
                                </TextField>
                                <TextField
                                    select
                                    label="Mode"
                                    value={sched.mode}
                                    onChange={(e) => setSched((p) => ({ ...p, mode: e.target.value }))}
                                    fullWidth
                                >
                                    <MenuItem value="ONLINE">Online</MenuItem>
                                    <MenuItem value="ONSITE">Onsite</MenuItem>
                                </TextField>
                            </Stack>

                            <TextField
                                label="Date & Time"
                                type="datetime-local"
                                value={sched.scheduledAtLocal}
                                onChange={(e) => setSched((p) => ({ ...p, scheduledAtLocal: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />

                            <TextField
                                label="Meeting Link (optional)"
                                value={sched.meetingLink}
                                onChange={(e) => setSched((p) => ({ ...p, meetingLink: e.target.value }))}
                                fullWidth
                            />
                            <TextField
                                label="Notes (optional)"
                                value={sched.notes}
                                onChange={(e) => setSched((p) => ({ ...p, notes: e.target.value }))}
                                fullWidth
                                multiline
                                minRows={3}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={() => setScheduleOpen(false)} sx={{ borderRadius: '12px' }}>
                            Close
                        </Button>
                        <Button
                            onClick={onSchedule}
                            disabled={scheduleSaving}
                            variant="contained"
                            sx={{ borderRadius: '12px', background: '#1f3a8a', fontWeight: 950 }}
                        >
                            {scheduleSaving ? 'Scheduling...' : 'Schedule'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </main>
        </div>
    );
};

export default RecruiterCandidateProfilePage;
