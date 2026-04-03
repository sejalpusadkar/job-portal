import React, { useEffect, useMemo, useState } from 'react';
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
    FormControlLabel,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { me } from '../../services/authService';
import '../../styles/atsRecruiter.css';
import { listNotifications } from '../../services/notificationService';
import { listRecruiterInterviews } from '../../services/interviewService';
import { listRecruiterActivities } from '../../services/recruiterActivityService';
import { getRecruiterStats } from '../../services/statsService';

import {
    createJob,
    deleteJob,
    emailCandidate,
    getJobApplications,
    getMatchedCandidates,
    listMyJobs,
    updateJob,
    updateApplicationStatus,
    uploadJobAttachment,
} from '../../services/recruiterService';
import {
    getRecruiterProfile,
    updateRecruiterProfile,
    uploadRecruiterPhoto,
} from '../../services/recruiterProfileService';
import { resolveUploadUrl } from '../../utils/url';

const splitCsv = (text) =>
    (text || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

const fmtCtc = (job) => {
    if (!job) return '';
    if (job.salaryHidden) return 'Salary not disclosed';
    const min = Number(job.minCtc || 0);
    const max = Number(job.maxCtc || 0);
    const freq = String(job.ctcFrequency || 'YEARLY').toUpperCase();
    const currency = String(job.ctcCurrency || 'INR').toUpperCase();
    const symbol = currency === 'INR' ? '₹' : currency + ' ';
    if (min <= 0 || max <= 0) return '';
    if (freq === 'MONTHLY') {
        const fmt = (k) => {
            if (k >= 100) return `${symbol}${(k / 100).toFixed(k % 100 === 0 ? 0 : 1)}L`;
            return `${symbol}${k}K`;
        };
        return `${fmt(min)} – ${fmt(max)} per month`;
    }
    return `${symbol}${min} LPA – ${symbol}${max} LPA`;
};

const bytesToLabel = (n) => {
    const v = Number(n || 0);
    if (!v) return '0 B';
    if (v < 1024) return `${v} B`;
    if (v < 1024 * 1024) return `${Math.round(v / 1024)} KB`;
    return `${(v / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtAgo = (iso) => {
    try {
        const d = new Date(iso);
        const ms = Date.now() - d.getTime();
        const min = Math.floor(ms / 60000);
        if (min < 1) return 'just now';
        if (min < 60) return `${min}m ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}h ago`;
        const days = Math.floor(hr / 24);
        return `${days}d ago`;
    } catch {
        return '';
    }
};

const NavItem = ({ active, icon, label, onClick }) => (
    <div className={`ats-nav__item ${active ? 'is-active' : ''}`} onClick={onClick} role="button" tabIndex={0}>
        <span style={{ display: 'grid', placeItems: 'center' }}>{icon}</span>
        <span className="ats-nav__label">{label}</span>
    </div>
);

const StatNavCard = ({ label, value, meta, highlighted, hint = 'View details', onActivate }) => {
    const onKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate?.();
        }
    };

    return (
        <div
            className={`ats-stat ${highlighted ? 'is-highlight' : ''} ${onActivate ? 'is-clickable' : ''}`}
            role={onActivate ? 'button' : undefined}
            tabIndex={onActivate ? 0 : undefined}
            onClick={onActivate}
            onKeyDown={onActivate ? onKeyDown : undefined}
            aria-label={onActivate ? `${label}. ${hint}` : undefined}
            title={onActivate ? hint : undefined}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div className="ats-stat__label">{label}</div>
                {onActivate ? (
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 850,
                            color: highlighted ? 'rgba(255,255,255,0.78)' : 'rgba(15,23,42,0.62)',
                            userSelect: 'none',
                        }}
                    >
                        {hint} <ArrowForwardRoundedIcon fontSize="inherit" />
                    </div>
                ) : null}
            </div>
            <div className="ats-stat__value">{value}</div>
            <div className="ats-stat__meta">{meta}</div>
        </div>
    );
};

const RecruiterDashboardAts = () => {
    const { user, updateUser, logout } = useAuth();
    const nav = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const allowedSections = useMemo(
        () => ['dashboard', 'jobs', 'candidates', 'interviews', 'settings'],
        [],
    );
    const [section, setSection] = useState(() => {
        const s = new URLSearchParams(window.location.search).get('section');
        return s && ['dashboard', 'jobs', 'candidates', 'interviews', 'settings'].includes(s)
            ? s
            : 'dashboard';
    }); // dashboard | jobs | candidates | interviews | settings
    const [globalQuery, setGlobalQuery] = useState('');

    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [matchedCandidates, setMatchedCandidates] = useState([]);
    const [applications, setApplications] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [recruiterInterviews, setRecruiterInterviews] = useState([]);
    const [activities, setActivities] = useState([]);
    const [dailyStats, setDailyStats] = useState(null);

    const [jobDialogOpen, setJobDialogOpen] = useState(false);
    const [editingJobId, setEditingJobId] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [attachmentUploading, setAttachmentUploading] = useState(false);
    const [jobForm, setJobForm] = useState({
        title: '',
        description: '',
        minExperienceYears: 0,
        minCtc: 6,
        maxCtc: 12,
        ctcCurrency: 'INR',
        ctcFrequency: 'YEARLY',
        salaryHidden: false,
        requiredSkillsText: '',
        keywordsText: '',
        status: 'ACTIVE',
        attachmentUrl: '',
        attachmentName: '',
        attachmentPreviewUrl: '',
        attachmentContentType: '',
        attachmentSize: 0,
    });

    const [profileSaving, setProfileSaving] = useState(false);
    const [profileForm, setProfileForm] = useState({
        email: '',
        companyName: '',
        contactPerson: '',
        phone: '',
        position: '',
        professionalSummary: '',
        profilePhotoUrl: '',
    });

    const [emailForm, setEmailForm] = useState({
        applicationId: '',
        subject: '',
        message: '',
    });

    const selectedJob = useMemo(
        () => jobs.find((j) => String(j.id) === String(selectedJobId)) || null,
        [jobs, selectedJobId],
    );

    const refreshJobs = async () => {
        const res = await listMyJobs();
        setJobs(res.data || []);
    };

    const refreshNotifications = async () => {
        const res = await listNotifications(true);
        setNotifications(res.data || []);
    };

    const refreshInterviews = async () => {
        const res = await listRecruiterInterviews();
        setRecruiterInterviews(res.data || []);
    };

    const refreshActivities = async () => {
        const res = await listRecruiterActivities();
        setActivities(res.data || []);
    };

    const refreshDailyStats = async () => {
        const res = await getRecruiterStats();
        setDailyStats(res.data || null);
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

                await Promise.all([refreshJobs(), refreshNotifications(), refreshInterviews(), refreshActivities()]);
                try {
                    await refreshDailyStats();
                } catch {}

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

    // Poll for real-time-ish updates (no websockets yet).
    useEffect(() => {
        if (!user?.recruiterApproved) return;
        const t = setInterval(() => {
            Promise.allSettled([refreshNotifications(), refreshInterviews(), refreshActivities()]).catch(() => {});
        }, 5000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.recruiterApproved]);

    useEffect(() => {
        if (!user?.recruiterApproved) return;
        const t = setInterval(() => {
            refreshDailyStats().catch(() => {});
        }, 24 * 60 * 60 * 1000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.recruiterApproved]);

    useEffect(() => {
        // Auto-select a job after jobs load.
        if (!user?.recruiterApproved) return;
        if (selectedJobId) return;
        if (!jobs || jobs.length === 0) return;
        setSelectedJobId(String(jobs[0].id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobs, user?.recruiterApproved]);

    // If a notification links to a specific job (e.g. ?jobId=123), honor it.
    useEffect(() => {
        const jid = searchParams.get('jobId');
        if (!jid) return;
        if (String(jid) === String(selectedJobId)) return;
        setSelectedJobId(String(jid));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

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

    // Keep section state in sync with URL (?section=...).
    useEffect(() => {
        const s = searchParams.get('section');
        if (!s) return;
        if (!allowedSections.includes(s)) return;
        if (s === section) return;
        setSection(s);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, allowedSections]);

    const goSection = (next) => {
        if (!allowedSections.includes(next)) return;
        setSection(next);
        const sp = new URLSearchParams(searchParams);
        sp.set('section', next);
        setSearchParams(sp);
    };

    const openCreateJob = () => {
        setEditingJobId(null);
        setJobForm({
            title: '',
            description: '',
            minExperienceYears: 0,
            minCtc: 6,
            maxCtc: 12,
            ctcCurrency: 'INR',
            ctcFrequency: 'YEARLY',
            salaryHidden: false,
            requiredSkillsText: '',
            keywordsText: '',
            status: 'ACTIVE',
            attachmentUrl: '',
            attachmentName: '',
            attachmentPreviewUrl: '',
            attachmentContentType: '',
            attachmentSize: 0,
        });
        setJobDialogOpen(true);
    };

    const openEditJob = (job) => {
        setEditingJobId(job?.id ?? null);
        setJobForm({
            title: job?.title || '',
            description: job?.description || '',
            minExperienceYears: job?.minExperienceYears ?? 0,
            minCtc: job?.minCtc ?? 6,
            maxCtc: job?.maxCtc ?? 12,
            ctcCurrency: job?.ctcCurrency || 'INR',
            ctcFrequency: job?.ctcFrequency || 'YEARLY',
            salaryHidden: !!job?.salaryHidden,
            requiredSkillsText: (job?.requiredSkills || []).join(', '),
            keywordsText: (job?.keywords || []).join(', '),
            status: job?.status || 'ACTIVE',
            attachmentUrl: job?.attachmentUrl || '',
            attachmentName: job?.attachmentName || '',
            attachmentPreviewUrl: '',
            attachmentContentType: '',
            attachmentSize: 0,
        });
        setJobDialogOpen(true);
    };

    const validateAttachment = (file) => {
        if (!file) return 'No file selected';
        const max = 5 * 1024 * 1024; // 5 MB
        const ct = (file.type || '').toLowerCase();
        const name = (file.name || '').toLowerCase();
        const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : '';
        const ok =
            ct === 'application/pdf' ||
            ct === 'image/jpeg' ||
            ct === 'image/png' ||
            ct === 'image/webp' ||
            (!ct && (ext === 'pdf' || ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp'));
        if (!ok) return 'Only PDF, JPG, PNG, or WEBP files are allowed';
        if (file.size > max) return 'Attachment must be under 5 MB';
        return '';
    };

    const clearAttachment = () => {
        setJobForm((p) => {
            if (p.attachmentPreviewUrl) {
                try {
                    URL.revokeObjectURL(p.attachmentPreviewUrl);
                } catch {}
            }
            return {
                ...p,
                attachmentUrl: '',
                attachmentName: '',
                attachmentPreviewUrl: '',
                attachmentContentType: '',
                attachmentSize: 0,
            };
        });
    };

    const onPickAttachment = async (file) => {
        if (!file) return;
        const err = validateAttachment(file);
        if (err) {
            setError(err);
            return;
        }
        setError('');
        setSuccess('');
        setAttachmentUploading(true);
        try {
            let preview = '';
            if ((file.type || '').startsWith('image/')) {
                preview = URL.createObjectURL(file);
            }
            const res = await uploadJobAttachment(file);
            const url = res.data?.url || '';
            const originalName = res.data?.originalName || file.name || '';
            setJobForm((p) => ({
                ...p,
                attachmentUrl: url,
                attachmentName: originalName,
                attachmentPreviewUrl: preview,
                attachmentContentType: file.type || '',
                attachmentSize: file.size || 0,
            }));
            setSuccess('Attachment uploaded.');
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Attachment upload failed');
        } finally {
            setAttachmentUploading(false);
        }
    };

    const onCreateOrUpdateJob = async () => {
        setError('');
        setSuccess('');
        try {
            const minCtc = Number(jobForm.minCtc);
            const maxCtc = Number(jobForm.maxCtc);
            if (!Number.isFinite(minCtc) || !Number.isFinite(maxCtc) || minCtc <= 0 || maxCtc <= 0) {
                setError('Please enter valid salary range');
                return;
            }
            if (minCtc > maxCtc) {
                setError('Minimum salary cannot exceed maximum');
                return;
            }
            const payload = {
                title: jobForm.title,
                description: jobForm.description,
                minExperienceYears: Number(jobForm.minExperienceYears) || 0,
                minCtc: Math.floor(minCtc),
                maxCtc: Math.floor(maxCtc),
                ctcCurrency: jobForm.ctcCurrency || 'INR',
                ctcFrequency: jobForm.ctcFrequency || 'YEARLY',
                salaryHidden: !!jobForm.salaryHidden,
                requiredSkills: splitCsv(jobForm.requiredSkillsText),
                keywords: splitCsv(jobForm.keywordsText),
                status: jobForm.status,
                attachmentUrl: jobForm.attachmentUrl || '',
                attachmentName: jobForm.attachmentName || '',
            };
            if (editingJobId) {
                await updateJob(editingJobId, payload);
                setSuccess('Job updated.');
            } else {
                const created = await createJob(payload);
                setSuccess('Job created.');
                const newId = created?.data?.id;
                if (newId) setSelectedJobId(String(newId));
            }
            setJobDialogOpen(false);
            await Promise.all([refreshJobs(), refreshNotifications(), refreshActivities()]);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Job save failed');
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
            await Promise.all([refreshJobs(), refreshNotifications()]);
            await refreshActivities();
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
            await Promise.all([refreshSelectedJobData(selectedJobId), refreshNotifications(), refreshActivities()]);
            setSuccess(`Application updated: ${status}`);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Status update failed');
        }
    };

    const openCandidateProfile = (c) => {
        const id = c?.candidateUserId;
        if (!id) return;
        nav(`/recruiter/candidates/${id}`);
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

    const filteredJobs = useMemo(() => {
        const q = globalQuery.trim().toLowerCase();
        if (!q) return jobs;
        return (jobs || []).filter((j) => String(j.title || '').toLowerCase().includes(q));
    }, [jobs, globalQuery]);

    const filteredApps = useMemo(() => {
        const q = globalQuery.trim().toLowerCase();
        if (!q) return applications;
        return (applications || []).filter((a) => {
            const hay = `${a.candidateName || ''} ${a.candidateEmail || ''} ${a.status || ''}`.toLowerCase();
            return hay.includes(q);
        });
    }, [applications, globalQuery]);

    const filteredMatched = useMemo(() => {
        const q = globalQuery.trim().toLowerCase();
        if (!q) return matchedCandidates;
        return (matchedCandidates || []).filter((c) => {
            const hay = `${c.fullName || ''} ${c.candidateEmail || ''}`.toLowerCase();
            return hay.includes(q);
        });
    }, [matchedCandidates, globalQuery]);

    const interviews = useMemo(() => recruiterInterviews || [], [recruiterInterviews]);
    const [hiresThisMonth] = useState(0); // API-ready placeholder

    const stats = useMemo(() => {
        const activeJobs =
            dailyStats?.activeJobsCount != null ? Number(dailyStats.activeJobsCount) : (jobs || []).filter((j) => j.status === 'ACTIVE').length;
        // Data-driven: APPLIED count for the selected job (updates as applications refresh).
        const newApplicants = (applications || []).filter((a) => String(a.status) === 'APPLIED').length;
        const interviewsToday =
            dailyStats?.interviewsScheduledCount != null
                ? Number(dailyStats.interviewsScheduledCount)
                : (interviews || []).filter((iv) => String(iv.status || '') === 'SCHEDULED').length;
        return { activeJobs, newApplicants, interviewsToday, hiresThisMonth };
    }, [jobs, applications, interviews, hiresThisMonth, dailyStats]);

    const agenda = useMemo(() => {
        const now = Date.now();
        return (interviews || [])
            .filter((iv) => {
                const s = String(iv.status || '');
                if (s && s !== 'SCHEDULED') return false;
                const t = new Date(iv.scheduledAt).getTime();
                return !Number.isNaN(t) && t >= now - 5 * 60 * 1000;
            })
            .slice(0, 6)
            .map((iv) => {
                const dt = new Date(iv.scheduledAt);
                return {
                    time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    title: `${iv.type === 'TECHNICAL' ? 'Technical' : 'HR'} Interview`,
                    meta: `${iv.candidateName || 'Candidate'} · ${iv.jobTitle || ''}`,
                };
            });
    }, [interviews]);

    const activityItems = useMemo(() => {
        const items = (activities || []).slice(0, 8);
        return items.map((a) => ({
            id: a.id,
            title: a.type,
            sub: a.message,
            time: fmtAgo(a.createdAt),
        }));
    }, [activities]);

    const recruiterName = profileForm.contactPerson || (user?.email ? user.email.split('@')[0] : 'Recruiter');
    const recruiterRoleLabel =
        profileForm.position?.trim() ? profileForm.position.trim() : (user?.role ? String(user.role) : 'RECRUITER');
    const recruiterMeta = user?.email || '';
    const brandTitle = profileForm.companyName?.trim() ? profileForm.companyName.trim() : recruiterName;

    const notifCount = (notifications || []).length;
    const notifBadgeCount = notifCount > 99 ? '99+' : String(notifCount);

    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="ats-page">
            <div className="ats-shell">
                <aside className="ats-sidebar">
                    <div className="ats-brand">
                        <div className="ats-brand__mark">{(brandTitle || 'JP').slice(0, 2).toUpperCase()}</div>
                        <div>
                            <div className="ats-brand__title">Welcome, {recruiterName}</div>
                            <div className="ats-brand__sub">{recruiterRoleLabel}</div>
                        </div>
                    </div>

                    <div className="ats-nav">
                        <NavItem
                            active={section === 'dashboard'}
                            icon={<DashboardOutlinedIcon fontSize="small" />}
                            label="Dashboard"
                            onClick={() => goSection('dashboard')}
                        />
                        <NavItem
                            active={section === 'jobs'}
                            icon={<WorkOutlineRoundedIcon fontSize="small" />}
                            label="Jobs"
                            onClick={() => goSection('jobs')}
                        />
                        <NavItem
                            active={section === 'candidates'}
                            icon={<PeopleAltOutlinedIcon fontSize="small" />}
                            label="Candidates"
                            onClick={() => goSection('candidates')}
                        />
                        <NavItem
                            active={section === 'interviews'}
                            icon={<CalendarMonthOutlinedIcon fontSize="small" />}
                            label="Interviews"
                            onClick={() => goSection('interviews')}
                        />
                        <NavItem
                            active={section === 'settings'}
                            icon={<SettingsOutlinedIcon fontSize="small" />}
                            label="Settings"
                            onClick={() => goSection('settings')}
                        />
                    </div>

                    <div className="ats-sidebar__cta">
                        <button className="ats-btn ats-btn--primary" onClick={openCreateJob} disabled={!user?.recruiterApproved}>
                            + Post New Job
                        </button>
                        <button className="ats-btn" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </aside>

                <main className="ats-main">
                    <div className="ats-topbar">
                        <div className="ats-search" title="Search candidates or jobs">
                            <SearchRoundedIcon fontSize="small" />
                            <input
                                value={globalQuery}
                                onChange={(e) => setGlobalQuery(e.target.value)}
                                placeholder="Search candidates, jobs..."
                            />
                        </div>

                        <div
                            className={`ats-iconbtn ${notifCount > 0 ? 'ats-badge' : ''}`}
                            data-count={notifBadgeCount}
                            onClick={() => nav('/recruiter-notifications')}
                            role="button"
                            tabIndex={0}
                            title="Notifications"
                            style={{ visibility: user?.recruiterApproved ? 'visible' : 'hidden' }}
                        >
                            <NotificationsNoneRoundedIcon fontSize="small" />
                        </div>

                        <div className="ats-profile" title={recruiterMeta}>
                            <div className="ats-avatar">
                                {resolveUploadUrl(profileForm.profilePhotoUrl) ? (
                                    <img src={resolveUploadUrl(profileForm.profilePhotoUrl)} alt="avatar" />
                                ) : null}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div className="ats-profile__name">{recruiterName}</div>
                                <div className="ats-profile__meta">
                                    {recruiterRoleLabel} · {recruiterMeta}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ats-content">
                        {error ? (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {String(error)}
                            </Alert>
                        ) : null}
                        {success ? (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                {String(success)}
                            </Alert>
                        ) : null}

                        {!user?.recruiterApproved ? (
                            <Alert severity="warning">
                                Your recruiter account is pending Admin approval. You can log in, but recruiter features
                                are disabled until approval.
                            </Alert>
                        ) : null}

                        {user?.recruiterApproved && section === 'dashboard' ? (
                            <div className="ats-card ats-card__pad">
                                <div className="ats-headerrow">
                                    <div>
                                        <h1 className="ats-h1">Daily Overview</h1>
                                        <div className="ats-sub">
                                            You have {stats.interviewsToday} interviews scheduled today and {stats.newApplicants} new applicants
                                            for the selected job.
                                        </div>
                                    </div>
                                    <div className="ats-header-actions">
                                        <button className="ats-btn ats-btn--ghost" onClick={() => setSuccess('Export queued.')}>
                                            Export Report
                                        </button>
                                        <button className="ats-btn ats-btn--ghost" onClick={() => setSuccess('Share link copied.')}>
                                            Share Stats
                                        </button>
                                    </div>
                                </div>

                                <div className="ats-stats">
                                    <StatNavCard
                                        label="Active Jobs"
                                        value={stats.activeJobs}
                                        meta={`Total jobs: ${(jobs || []).length}`}
                                        onActivate={() => goSection('jobs')}
                                    />
                                    <StatNavCard
                                        label="New Applicants"
                                        value={stats.newApplicants}
                                        meta="Real-time for selected job"
                                        highlighted
                                        onActivate={() => goSection('candidates')}
                                    />
                                    <StatNavCard
                                        label="Interviews Today"
                                        value={stats.interviewsToday}
                                        meta="Open the Interviews view"
                                        onActivate={() => goSection('interviews')}
                                    />
                                    <StatNavCard
                                        label="Hires This Month"
                                        value={stats.hiresThisMonth}
                                        meta="Connect Metrics API"
                                    />
                                </div>

                                <div className="ats-grid2">
                                    <div className="ats-card ats-card__pad">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                            <div className="ats-section-title">Recent Activity</div>
                                            <div style={{ color: 'rgba(15,23,42,0.55)', fontSize: 12, fontWeight: 700 }}>
                                                View All Activities
                                            </div>
                                        </div>
                                        <div className="ats-list" style={{ marginTop: 10 }}>
                                            {activityItems.length === 0 ? (
                                                <div style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13 }}>
                                                    No activity yet. Create a job and wait for candidates to apply.
                                                </div>
                                            ) : (
                                                activityItems.map((it) => (
                                                    <div className="ats-activity" key={it.id}>
                                                        <div className="ats-avatar" />
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="ats-activity__title">{it.sub}</div>
                                                            <div className="ats-activity__sub">{it.title}</div>
                                                        </div>
                                                        <div className="ats-activity__time">{it.time}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="ats-card ats-card__pad">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                                            <div className="ats-section-title">Today's Agenda</div>
                                            <div className="ats-tag" style={{ borderRadius: 12 }}>
                                                {new Date().toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="ats-agenda" style={{ marginTop: 10 }}>
                                            {agenda.length === 0 ? (
                                                <div style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13 }}>
                                                    No interviews scheduled. This section will populate when the Interviews API is connected.
                                                </div>
                                            ) : (
                                                agenda.map((a, idx) => (
                                                    <div className="ats-agenda__item" key={`ag-${idx}`}>
                                                        <div className="ats-agenda__time">{a.time || ''}</div>
                                                        <div>
                                                            <div className="ats-agenda__title">{a.title || ''}</div>
                                                            <div className="ats-agenda__meta">{a.meta || ''}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {user?.recruiterApproved && section === 'jobs' ? (
                            <div className="ats-card ats-card__pad">
                                <div className="ats-pipeline-head">
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <h1 className="ats-h1" style={{ fontSize: 28, margin: 0 }}>
                                                {selectedJob?.title || 'Jobs Pipeline'}
                                            </h1>
                                            <TextField
                                                size="small"
                                                select
                                                value={selectedJobId || ''}
                                                onChange={(e) => setSelectedJobId(String(e.target.value))}
                                                sx={{ minWidth: 240 }}
                                                disabled={jobs.length === 0}
                                            >
                                                {(filteredJobs || []).map((j) => (
                                                    <MenuItem key={`job-${j.id}`} value={String(j.id)}>
                                                        #{j.id} · {j.title}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </div>
                                        <div className="ats-tags">
                                            <span className="ats-tag">Remote Friendly</span>
                                            <span className="ats-tag">Min Exp: {selectedJob?.minExperienceYears ?? 0}y</span>
                                            <span className="ats-tag">{selectedJob ? fmtCtc(selectedJob) : 'Salary not disclosed'}</span>
                                            <span className="ats-tag">Status: {selectedJob?.status || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="ats-header-actions">
                                        <button className="ats-btn ats-btn--ghost" onClick={() => setSuccess('Share job link copied (demo).')}>
                                            Share Job
                                        </button>
                                        <button
                                            className="ats-btn ats-btn--primary"
                                            onClick={() => (selectedJob ? openEditJob(selectedJob) : openCreateJob())}
                                        >
                                            Manage Job
                                        </button>
                                    </div>
                                </div>

                                {jobs.length === 0 ? (
                                    <div style={{ marginTop: 14, color: 'rgba(15,23,42,0.62)' }}>
                                        No jobs yet. Click “Post New Job” in the sidebar.
                                    </div>
                                ) : (
                                    <div className="ats-kanban">
                                        {[
                                            { key: 'APPLIED', label: 'New Applicants' },
                                            { key: 'SHORTLISTED', label: 'Screening' },
                                            { key: 'TECHNICAL', label: 'Technical' },
                                            { key: 'FINAL_INTERVIEW', label: 'Final Interview' },
                                            { key: 'OFFER', label: 'Offer' },
                                        ].map((col) => {
                                            const items = (filteredApps || []).filter((a) => String(a.status) === col.key);
                                            return (
                                                <div className="ats-col" key={`col-${col.key}`}>
                                                    <div className="ats-col__title">
                                                        <span>{col.label}</span>
                                                        <span style={{ fontWeight: 900, letterSpacing: 0 }}>{items.length}</span>
                                                    </div>
                                                    <div style={{ display: 'grid', gap: 10 }}>
                                                        {items.length === 0 ? (
                                                            <div style={{ color: 'rgba(15,23,42,0.50)', fontSize: 13 }}>
                                                                No candidates.
                                                            </div>
                                                        ) : (
                                                            items.map((a) => (
                                                                <div className="ats-cand" key={`app-${a.applicationId}`}>
                                                                    <div className="ats-cand__top">
                                                                        <Avatar
                                                                            src={resolveUploadUrl(a.profilePhotoDataUrl) || undefined}
                                                                            sx={{ width: 34, height: 34 }}
                                                                        />
                                                                        <div style={{ minWidth: 0 }}>
                                                                            <p className="ats-cand__name" title={a.candidateEmail}>
                                                                                {a.candidateName || 'Candidate'}
                                                                            </p>
                                                                            <div className="ats-cand__meta">{a.candidateEmail}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="ats-cand__actions">
                                                                        <button
                                                                            className="ats-mini ats-mini--primary"
                                                                            onClick={() => {
                                                                                openCandidateProfile(a);
                                                                            }}
                                                                        >
                                                                            View
                                                                        </button>
                                                                        <button
                                                                            className="ats-mini"
                                                                            disabled={!a.resumeUrl}
                                                                            onClick={() => {
                                                                                const url = resolveUploadUrl(a.resumeUrl);
                                                                                if (url) window.open(url, '_blank', 'noopener,noreferrer');
                                                                            }}
                                                                        >
                                                                            Resume
                                                                        </button>
                                                                        {col.key === 'APPLIED' ? (
                                                                            <button
                                                                                className="ats-mini"
                                                                                onClick={() => onUpdateAppStatus(a.applicationId, 'SHORTLISTED')}
                                                                            >
                                                                                Move to Screening
                                                                            </button>
                                                                        ) : null}
                                                                        {col.key === 'SHORTLISTED' ? (
                                                                            <button
                                                                                className="ats-mini"
                                                                                onClick={() => onUpdateAppStatus(a.applicationId, 'TECHNICAL')}
                                                                            >
                                                                                Move to Technical
                                                                            </button>
                                                                        ) : null}
                                                                        {col.key === 'TECHNICAL' ? (
                                                                            <button
                                                                                className="ats-mini"
                                                                                onClick={() => onUpdateAppStatus(a.applicationId, 'FINAL_INTERVIEW')}
                                                                            >
                                                                                Move to Final
                                                                            </button>
                                                                        ) : null}
                                                                        {col.key === 'FINAL_INTERVIEW' ? (
                                                                            <button
                                                                                className="ats-mini"
                                                                                onClick={() => onUpdateAppStatus(a.applicationId, 'OFFER')}
                                                                            >
                                                                                Offer
                                                                            </button>
                                                                        ) : null}
                                                                        <button
                                                                            className="ats-mini ats-mini--danger"
                                                                            onClick={() => onUpdateAppStatus(a.applicationId, 'REJECTED')}
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {user?.recruiterApproved && section === 'candidates' ? (
                            <div className="ats-card ats-card__pad">
                                <div className="ats-headerrow" style={{ marginBottom: 12 }}>
                                    <div>
                                        <h1 className="ats-h1" style={{ fontSize: 28, margin: 0 }}>
                                            Candidates
                                        </h1>
                                        <div className="ats-sub">Matched candidates and applications for the selected job.</div>
                                    </div>
                                    <div className="ats-header-actions">
                                        <TextField
                                            size="small"
                                            select
                                            value={selectedJobId || ''}
                                            onChange={(e) => setSelectedJobId(String(e.target.value))}
                                            sx={{ minWidth: 260 }}
                                            disabled={jobs.length === 0}
                                        >
                                            {(filteredJobs || []).map((j) => (
                                                <MenuItem key={`job2-${j.id}`} value={String(j.id)}>
                                                    #{j.id} · {j.title}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </div>
                                </div>

                                <Divider sx={{ mb: 2 }} />

                                <div className="ats-grid2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <div className="ats-card ats-card__pad">
                                        <div className="ats-section-title">Matched Candidates</div>
                                        <div className="ats-list" style={{ marginTop: 10 }}>
                                            {filteredMatched.length === 0 ? (
                                                <div style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13 }}>
                                                    No matches found yet.
                                                </div>
                                            ) : (
                                                filteredMatched.slice(0, 20).map((c) => (
                                                    <div className="ats-activity" key={`mc-${c.candidateUserId}`}>
                                                        <Avatar
                                                            src={resolveUploadUrl(c.profilePhotoDataUrl) || undefined}
                                                            sx={{ width: 36, height: 36 }}
                                                        />
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="ats-activity__title">
                                                                {c.fullName || 'Candidate'} ({c.candidateEmail})
                                                            </div>
                                                            <div className="ats-activity__sub">
                                                                Match {c.matchScorePercent}% (skills {c.exactSkillMatches}, keywords {c.keywordMatches})
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                            <button
                                                                className="ats-mini ats-mini--primary"
                                                                onClick={() => openCandidateProfile(c)}
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                className="ats-mini"
                                                                disabled={!c.resumeUrl}
                                                                onClick={() => {
                                                                    const url = resolveUploadUrl(c.resumeUrl);
                                                                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                                                                }}
                                                            >
                                                                Resume
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="ats-card ats-card__pad">
                                        <div className="ats-section-title">Applications</div>
                                        <div className="ats-list" style={{ marginTop: 10 }}>
                                            {filteredApps.length === 0 ? (
                                                <div style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13 }}>
                                                    No applications yet.
                                                </div>
                                            ) : (
                                                filteredApps.slice(0, 20).map((a) => (
                                                    <div className="ats-activity" key={`a-${a.applicationId}`}>
                                                        <Avatar
                                                            src={resolveUploadUrl(a.profilePhotoDataUrl) || undefined}
                                                            sx={{ width: 36, height: 36 }}
                                                        />
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="ats-activity__title">
                                                                {a.candidateName || 'Candidate'} ({a.candidateEmail})
                                                            </div>
                                                            <div className="ats-activity__sub">Status: {a.status}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                            <button
                                                                className="ats-mini"
                                                                disabled={!a.resumeUrl}
                                                                onClick={() => {
                                                                    const url = resolveUploadUrl(a.resumeUrl);
                                                                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                                                                }}
                                                            >
                                                                Resume
                                                            </button>
                                                            <button
                                                                className="ats-mini"
                                                                onClick={() =>
                                                                    setEmailForm((p) => ({
                                                                        ...p,
                                                                        applicationId: String(a.applicationId),
                                                                        subject: p.subject || `Update on your application (Job #${selectedJobId})`,
                                                                    }))
                                                                }
                                                            >
                                                                Email
                                                            </button>
                                                            <button className="ats-mini" onClick={() => onUpdateAppStatus(a.applicationId, 'SHORTLISTED')}>
                                                                Shortlist
                                                            </button>
                                                            <button className="ats-mini ats-mini--danger" onClick={() => onUpdateAppStatus(a.applicationId, 'REJECTED')}>
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Email Candidate
                                </Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        select
                                        label="Application"
                                        value={emailForm.applicationId}
                                        onChange={(e) => setEmailForm({ ...emailForm, applicationId: e.target.value })}
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
                                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Message"
                                        value={emailForm.message}
                                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                                        fullWidth
                                        multiline
                                        minRows={3}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={onSendEmail}
                                        disabled={!emailForm.applicationId || !emailForm.subject || !emailForm.message}
                                        sx={{ backgroundColor: '#1f3a8a' }}
                                    >
                                        Send Email
                                    </Button>
                                    <Typography variant="caption" color="text.secondary">
                                        Note: Email sending requires SMTP config in backend `application.properties`.
                                    </Typography>
                                </Stack>
                            </div>
                        ) : null}

                        {user?.recruiterApproved && section === 'interviews' ? (
                            <div className="ats-card ats-card__pad">
                                <h1 className="ats-h1" style={{ fontSize: 28, margin: 0 }}>
                                    Upcoming Interviews
                                </h1>
                                <div className="ats-sub">Scheduled interviews across your job postings</div>
                                <div className="ats-agenda" style={{ marginTop: 14 }}>
                                    {interviews.length === 0 ? (
                                        <div style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13 }}>
                                            No interviews to show yet.
                                        </div>
                                    ) : (
                                        (interviews || [])
                                            .filter((iv) => String(iv.status || '') === 'SCHEDULED')
                                            .slice(0, 20)
                                            .map((iv) => {
                                                const dt = new Date(iv.scheduledAt);
                                                return (
                                                    <div className="ats-activity" key={`iv-${iv.id}`}>
                                                        <Avatar
                                                            src={resolveUploadUrl(iv.candidatePhotoDataUrl) || undefined}
                                                            sx={{ width: 36, height: 36 }}
                                                        />
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="ats-activity__title">
                                                                {iv.candidateName || 'Candidate'}{' '}
                                                                <span style={{ color: 'rgba(15,23,42,0.62)', fontWeight: 700 }}>
                                                                    {iv.candidateRoleTitle ? `· ${iv.candidateRoleTitle}` : ''}
                                                                </span>
                                                            </div>
                                                            <div className="ats-activity__sub">
                                                                {iv.jobTitle || 'Job'} · {iv.type === 'TECHNICAL' ? 'Technical' : 'HR'} ·{' '}
                                                                {iv.mode === 'ONSITE' ? 'Onsite' : 'Online'}
                                                            </div>
                                                        </div>
                                                        <div className="ats-activity__time" style={{ textAlign: 'right' }}>
                                                            <div style={{ fontWeight: 800 }}>{dt.toLocaleString()}</div>
                                                            <div style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)' }}>{iv.status}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {user?.recruiterApproved && section === 'settings' ? (
                            <div className="ats-card ats-card__pad">
                                <div className="ats-headerrow">
                                    <div>
                                        <h1 className="ats-h1" style={{ fontSize: 28, margin: 0 }}>
                                            Settings
                                        </h1>
                                        <div className="ats-sub">Recruiter profile and preferences.</div>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2 }} />

                                <Stack spacing={2} sx={{ maxWidth: 680 }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar
                                            src={resolveUploadUrl(profileForm.profilePhotoUrl) || undefined}
                                            sx={{ width: 56, height: 56, border: '1px solid rgba(15,23,42,0.12)' }}
                                        />
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Button variant="outlined" component="label" startIcon={<PhotoCameraOutlinedIcon />}>
                                                Upload photo
                                                <input
                                                    hidden
                                                    accept="image/*"
                                                    type="file"
                                                    onChange={(e) => onPickRecruiterPhoto(e.target.files?.[0])}
                                                />
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                startIcon={<DeleteOutlineIcon />}
                                                disabled={!profileForm.profilePhotoUrl}
                                                onClick={() => setProfileForm((p) => ({ ...p, profilePhotoUrl: '' }))}
                                            >
                                                Remove
                                            </Button>
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
                                        onChange={(e) => setProfileForm((p) => ({ ...p, professionalSummary: e.target.value }))}
                                        fullWidth
                                        multiline
                                        minRows={4}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={onSaveRecruiterProfile}
                                        disabled={profileSaving}
                                        sx={{ backgroundColor: '#1f3a8a' }}
                                    >
                                        {profileSaving ? 'Saving...' : 'Save Profile'}
                                    </Button>
                                </Stack>
                            </div>
                        ) : null}
                    </div>
                </main>
            </div>

            <Dialog open={jobDialogOpen} onClose={() => setJobDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingJobId ? `Manage Job (#${editingJobId})` : 'Post New Job'}</DialogTitle>
                <DialogContent dividers>
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
                            onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                            fullWidth
                            multiline
                            minRows={4}
                        />
                        <TextField
                            label="Min Experience (Years)"
                            type="number"
                            value={jobForm.minExperienceYears}
                            onChange={(e) => setJobForm({ ...jobForm, minExperienceYears: e.target.value })}
                            fullWidth
                        />

                        <Box
                            sx={{
                                border: '1px solid rgba(15,23,42,0.10)',
                                borderRadius: '16px',
                                p: 2,
                                background: 'rgba(255,255,255,0.72)',
                            }}
                        >
                            <Typography sx={{ fontWeight: 950, mb: 1.2 }}>Salary / CTC</Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                <TextField
                                    label={jobForm.ctcFrequency === 'MONTHLY' ? 'Minimum CTC (K / month)' : 'Minimum CTC (LPA)'}
                                    type="number"
                                    value={jobForm.minCtc}
                                    onChange={(e) => setJobForm({ ...jobForm, minCtc: e.target.value })}
                                    fullWidth
                                    inputProps={{ min: 1 }}
                                />
                                <Typography sx={{ color: 'rgba(15,23,42,0.60)', fontWeight: 900, px: 0.4 }}>
                                    to
                                </Typography>
                                <TextField
                                    label={jobForm.ctcFrequency === 'MONTHLY' ? 'Maximum CTC (K / month)' : 'Maximum CTC (LPA)'}
                                    type="number"
                                    value={jobForm.maxCtc}
                                    onChange={(e) => setJobForm({ ...jobForm, maxCtc: e.target.value })}
                                    fullWidth
                                    inputProps={{ min: 1 }}
                                />
                            </Stack>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                <TextField
                                    select
                                    label="Currency"
                                    value={jobForm.ctcCurrency}
                                    onChange={(e) => setJobForm({ ...jobForm, ctcCurrency: e.target.value })}
                                    sx={{ minWidth: 150 }}
                                >
                                    <MenuItem value="INR">INR ₹</MenuItem>
                                </TextField>
                                <TextField
                                    select
                                    label="Pay Frequency"
                                    value={jobForm.ctcFrequency}
                                    onChange={(e) => setJobForm({ ...jobForm, ctcFrequency: e.target.value })}
                                    sx={{ minWidth: 180 }}
                                >
                                    <MenuItem value="YEARLY">Per Annum</MenuItem>
                                    <MenuItem value="MONTHLY">Per Month</MenuItem>
                                </TextField>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!jobForm.salaryHidden}
                                            onChange={(e) => setJobForm({ ...jobForm, salaryHidden: e.target.checked })}
                                        />
                                    }
                                    label="Hide salary (Confidential)"
                                />
                            </Stack>

                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(15,23,42,0.60)' }}>
                                Preview: {fmtCtc(jobForm) || 'Enter a valid range'}
                            </Typography>
                        </Box>

                        <TextField
                            label="Required Skills (comma separated)"
                            value={jobForm.requiredSkillsText}
                            onChange={(e) => setJobForm({ ...jobForm, requiredSkillsText: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Keywords (comma separated)"
                            value={jobForm.keywordsText}
                            onChange={(e) => setJobForm({ ...jobForm, keywordsText: e.target.value })}
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

                        <Divider />

                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
                                Job Attachment (optional)
                            </Typography>
                            <input
                                id="job-attachment-input"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                style={{ display: 'none' }}
                                onChange={(e) => onPickAttachment(e.target.files?.[0] || null)}
                            />
                            <div
                                className={`ats-dropzone ${dragOver ? 'is-dragover' : ''}`}
                                onClick={() => document.getElementById('job-attachment-input')?.click()}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOver(true);
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOver(true);
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOver(false);
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOver(false);
                                    const f = e.dataTransfer?.files?.[0];
                                    if (f) onPickAttachment(f);
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label="Upload attachment"
                            >
                                <div style={{ fontWeight: 850, marginBottom: 4 }}>
                                    Drag and drop a PDF or image here
                                </div>
                                <div style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13 }}>
                                    Or click to browse. Max size 5 MB. Allowed: PDF, JPG, PNG, WEBP.
                                </div>
                                {attachmentUploading ? (
                                    <div style={{ marginTop: 10, color: 'rgba(15,23,42,0.62)', fontSize: 13 }}>
                                        Uploading...
                                    </div>
                                ) : null}
                            </div>

                            {(jobForm.attachmentUrl || jobForm.attachmentName || jobForm.attachmentPreviewUrl) ? (
                                <div className="ats-filepreview">
                                    <div className="ats-filethumb">
                                        {jobForm.attachmentPreviewUrl ? (
                                            <img src={jobForm.attachmentPreviewUrl} alt="preview" />
                                        ) : (
                                            <PictureAsPdfOutlinedIcon fontSize="small" />
                                        )}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontWeight: 850,
                                                fontSize: 13,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {jobForm.attachmentName || 'Attachment'}
                                        </div>
                                        <div style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12 }}>
                                            {jobForm.attachmentSize ? bytesToLabel(jobForm.attachmentSize) : 'Uploaded'}
                                        </div>
                                        {jobForm.attachmentUrl ? (
                                            <div style={{ marginTop: 6 }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => {
                                                        const u = resolveUploadUrl(jobForm.attachmentUrl);
                                                        if (u) window.open(u, '_blank', 'noopener,noreferrer');
                                                    }}
                                                >
                                                    Preview
                                                </Button>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div>
                                        <Button size="small" color="error" variant="outlined" onClick={clearAttachment}>
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    {editingJobId ? (
                        <Button color="error" variant="outlined" onClick={() => onDeleteJob(editingJobId)}>
                            Delete
                        </Button>
                    ) : null}
                    <Button onClick={() => setJobDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={onCreateOrUpdateJob}
                        disabled={
                            !jobForm.title ||
                            !jobForm.description ||
                            attachmentUploading ||
                            !Number.isFinite(Number(jobForm.minCtc)) ||
                            !Number.isFinite(Number(jobForm.maxCtc)) ||
                            Number(jobForm.minCtc) <= 0 ||
                            Number(jobForm.maxCtc) <= 0 ||
                            Number(jobForm.minCtc) > Number(jobForm.maxCtc)
                        }
                        sx={{ backgroundColor: '#1f3a8a' }}
                    >
                        {editingJobId ? 'Save Changes' : 'Create Job'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default RecruiterDashboardAts;
