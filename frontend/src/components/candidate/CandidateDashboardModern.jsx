import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Stack,
    TextField,
    Tooltip,
    Typography,
    Autocomplete,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

import '../../styles/candidatePortal.css';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    getProfile,
    updateProfile,
    getMatchedJobs,
    getApplications,
    applyForJob,
    uploadProfilePhoto,
    uploadResume,
    listCertificates,
    uploadCertificates,
    deleteCertificate,
    getApplicationDetail,
} from '../../services/candidateService';
import { getAllJobs, getJobById } from '../../services/jobService';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/notificationService';
import { listCandidateInterviews } from '../../services/interviewService';
import { getCandidateStats } from '../../services/statsService';
import { DEFAULT_KEYWORD_SUGGESTIONS, DEFAULT_SKILL_SUGGESTIONS } from '../../utils/suggestions';
import { resolveUploadUrl } from '../../utils/url';

const splitCsv = (text) =>
    (text || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

const fmtAgo = (iso) => {
    try {
        const d = new Date(iso);
        const ms = Date.now() - d.getTime();
        const min = Math.floor(ms / 60000);
        if (min < 1) return 'Just now';
        if (min < 60) return `${min}m ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}h ago`;
        const days = Math.floor(hr / 24);
        if (days === 1) return 'Yesterday';
        return `${days}d ago`;
    } catch {
        return '';
    }
};

const fmtCountdown = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const appStageIndex = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'APPLIED') return 0;
    if (s === 'SHORTLISTED') return 1; // Screening
    if (s === 'TECHNICAL' || s === 'FINAL_INTERVIEW') return 2; // Interview
    if (s === 'OFFER') return 3;
    if (s === 'REJECTED') return -1;
    return 0;
};

const stageLabel = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'APPLIED') return 'Applied';
    if (s === 'SHORTLISTED') return 'Screening';
    if (s === 'TECHNICAL') return 'Interview';
    if (s === 'FINAL_INTERVIEW') return 'Interview';
    if (s === 'OFFER') return 'Offer';
    if (s === 'REJECTED') return 'Rejected';
    return String(status || 'Applied');
};

const formatCtc = (job) => {
    if (!job) return '';
    if (job.salaryHidden) return 'Salary not disclosed';
    const min = Number(job.minCtc || 0);
    const max = Number(job.maxCtc || 0);
    const freq = String(job.ctcFrequency || 'YEARLY').toUpperCase();
    const currency = String(job.ctcCurrency || 'INR').toUpperCase();
    const symbol = currency === 'INR' ? '₹' : currency + ' ';
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) return '';
    if (freq === 'MONTHLY') {
        // Stored as K/month (thousands).
        const fmt = (k) => {
            if (k >= 100) return `${symbol}${(k / 100).toFixed(k % 100 === 0 ? 0 : 1)}L`;
            return `${symbol}${k}K`;
        };
        return `${fmt(min)} – ${fmt(max)} per month`;
    }
    // YEARLY stored as LPA.
    return `${symbol}${min} LPA – ${symbol}${max} LPA`;
};

const inferTag = (job) => {
    const hay = `${job?.title || ''} ${job?.description || ''} ${(job?.keywords || []).join(' ')}`.toLowerCase();
    if (hay.includes('remote')) return 'Remote';
    return 'Full-time';
};

const NotificationIcon = ({ type }) => {
    const t = String(type || '').toUpperCase();
    const props = { fontSize: 'small' };
    if (t === 'INTERVIEW_SCHEDULED' || t === 'INTERVIEW') return <ScheduleRoundedIcon {...props} />;
    if (t === 'RECRUITER_MESSAGE' || t === 'CANDIDATE_MESSAGE' || t === 'MESSAGE')
        return <MailOutlineRoundedIcon {...props} />;
    if (t === 'OFFER') return <LocalOfferOutlinedIcon {...props} />;
    if (t === 'PROFILE_VIEWED') return <PersonOutlineRoundedIcon {...props} />;
    return <WarningAmberRoundedIcon {...props} />;
};

const SidebarItem = ({ active, icon, label, onActivate }) => (
    <div
        className={`cp-nav__item ${active ? 'is-active' : ''}`}
        role="button"
        tabIndex={0}
        onClick={onActivate}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate?.();
            }
        }}
    >
        <span className="cp-nav__icon">{icon}</span>
        <span className="cp-nav__label">{label}</span>
    </div>
);

const StatNavCard = ({ label, value, meta, onActivate }) => (
    <div
        className="cp-stat is-clickable"
        role="button"
        tabIndex={0}
        onClick={onActivate}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate?.();
            }
        }}
        aria-label={`${label}. View details.`}
        title="View details"
    >
        <div className="cp-stat__top">
            <div className="cp-stat__label">{label}</div>
            <div className="cp-stat__hint">
                View details <ArrowForwardRoundedIcon fontSize="inherit" />
            </div>
        </div>
        <div className="cp-stat__value">{value}</div>
        <div className="cp-stat__meta">{meta}</div>
    </div>
);

const CandidateDashboardModern = () => {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const nav = useNavigate();

    const allowedPages = useMemo(
        () => [
            'dashboard',
            'browse',
            'job',
            'applications',
            'application',
            'certificates',
            'profile',
            'notifications',
            'interviews',
            'offers',
        ],
        [],
    );

    const [page, setPage] = useState(() => {
        const p = new URLSearchParams(window.location.search).get('page');
        return p && allowedPages.includes(p) ? p : 'dashboard';
    });

    useEffect(() => {
        const p = searchParams.get('page');
        if (!p) return;
        if (!allowedPages.includes(p)) return;
        if (p === page) return;
        setPage(p);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, allowedPages]);

    const go = (next, extra = {}) => {
        if (!allowedPages.includes(next)) return;
        setPage(next);
        const sp = new URLSearchParams(searchParams);
        sp.set('page', next);
        Object.entries(extra).forEach(([k, v]) => {
            if (v == null || v === '') sp.delete(k);
            else sp.set(k, String(v));
        });
        setSearchParams(sp);
    };

    // If user refreshes on job details page, fetch the job details again.
    useEffect(() => {
        if (page !== 'job') return;
        const id = (searchParams.get('jobId') || '').trim();
        if (!id) return;
        if (jobDetailId === id && jobDetail) return;
        // eslint-disable-next-line no-use-before-define
        loadJobDetail(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, searchParams]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [globalQuery, setGlobalQuery] = useState('');

    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({
        fullName: '',
        roleTitle: '',
        location: '',
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
    const [notifications, setNotifications] = useState([]);
    const [candidateInterviews, setCandidateInterviews] = useState([]);
    const [dailyStats, setDailyStats] = useState(null);

    const [saving, setSaving] = useState(false);
    const [resumeUploading, setResumeUploading] = useState(false);
    const [skillOptions, setSkillOptions] = useState(DEFAULT_SKILL_SUGGESTIONS);
    const [keywordOptions, setKeywordOptions] = useState(DEFAULT_KEYWORD_SUGGESTIONS);

    const [certificates, setCertificates] = useState([]);
    const [certUploading, setCertUploading] = useState(false);
    const [certError, setCertError] = useState('');
    const [certSuccess, setCertSuccess] = useState('');

    const [appDetailId, setAppDetailId] = useState(null);
    const [appDetail, setAppDetail] = useState(null);
    const [appDetailLoading, setAppDetailLoading] = useState(false);
    const [appDetailError, setAppDetailError] = useState('');

    const [jobDetailId, setJobDetailId] = useState(null);
    const [jobDetail, setJobDetail] = useState(null);
    const [jobDetailLoading, setJobDetailLoading] = useState(false);
    const [jobDetailError, setJobDetailError] = useState('');
    const [jobDetailBackPage, setJobDetailBackPage] = useState('browse');

    const loadAll = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const [p, mj, apps, jobs, notifs, interviewsRes, certRes] = await Promise.all([
                getProfile(),
                getMatchedJobs(),
                getApplications(),
                getAllJobs(),
                listNotifications(false),
                listCandidateInterviews(),
                listCertificates(),
            ]);
            setProfile(p.data);
            setForm({
                fullName: p.data.fullName || '',
                roleTitle: p.data.roleTitle || '',
                location: p.data.location || '',
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
            setNotifications(notifs.data || []);
            setCandidateInterviews(interviewsRes.data || []);
            setCertificates(certRes.data || []);
            try {
                const s = await getCandidateStats();
                setDailyStats(s.data || null);
            } catch {
                setDailyStats(null);
            }

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

    // Refresh daily stats once every 24 hours while the dashboard is open.
    useEffect(() => {
        const t = setInterval(() => {
            getCandidateStats()
                .then((res) => setDailyStats(res.data || null))
                .catch(() => {});
        }, 24 * 60 * 60 * 1000);
        return () => clearInterval(t);
    }, []);

    const meName = (form.fullName || profile?.fullName || user?.email?.split('@')?.[0] || 'Your Name').trim();
    const meRole = (form.roleTitle || profile?.roleTitle || 'Your Role').trim();

    const appliedJobIds = useMemo(() => new Set((applications || []).map((a) => String(a.jobId))), [applications]);

    const recommendedJobs = useMemo(() => {
        const q = globalQuery.trim().toLowerCase();
        const base = matchedJobs && matchedJobs.length > 0 ? matchedJobs : allJobs;
        const list = (base || []).slice(0);
        const filtered = !q
            ? list
            : list.filter((j) => {
                  const hay = `${j.title || ''} ${j.companyName || ''} ${j.description || ''}`.toLowerCase();
                  return hay.includes(q);
              });
        return filtered.slice(0, 9);
    }, [matchedJobs, allJobs, globalQuery]);

    const featuredJob = recommendedJobs?.[0] || null;

    const browseJobs = useMemo(() => {
        const q = globalQuery.trim().toLowerCase();
        const base = allJobs || [];
        if (!q) return base;
        return base.filter((j) => {
            const hay =
                `${j.title || ''} ${j.companyName || ''} ${j.description || ''} ${(j.requiredSkills || []).join(' ')} ${(j.keywords || []).join(' ')}`.toLowerCase();
            return hay.includes(q);
        });
    }, [allJobs, globalQuery]);

    const activeApps = useMemo(
        () => (applications || []).filter((a) => String(a.status).toUpperCase() !== 'REJECTED'),
        [applications],
    );
    const interviews = useMemo(() => candidateInterviews || [], [candidateInterviews]);
    const offers = useMemo(
        () => (applications || []).filter((a) => String(a.status).toUpperCase() === 'OFFER'),
        [applications],
    );

    const nextInterview = useMemo(() => {
        const now = Date.now();
        const list = (candidateInterviews || [])
            .filter((iv) => String(iv.status || 'SCHEDULED') === 'SCHEDULED')
            .filter((iv) => {
                const t = new Date(iv.scheduledAt).getTime();
                return !Number.isNaN(t) && t >= now - 10 * 60 * 1000;
            })
            .slice()
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        return list[0] || null;
    }, [candidateInterviews]);

    const [nowTick, setNowTick] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNowTick(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const nextInterviewMs = useMemo(() => {
        if (!nextInterview?.scheduledAt) return null;
        const t = new Date(nextInterview.scheduledAt).getTime();
        if (Number.isNaN(t)) return null;
        return t - nowTick;
    }, [nextInterview, nowTick]);

    // Poll for updates (notifications + interviews) so actions reflect quickly.
    useEffect(() => {
        const t = setInterval(() => {
            Promise.allSettled([listNotifications(false), listCandidateInterviews()]).then((results) => {
                const [nRes, iRes] = results;
                if (nRes.status === 'fulfilled') setNotifications(nRes.value.data || []);
                if (iRes.status === 'fulfilled') setCandidateInterviews(iRes.value.data || []);
            });
        }, 10000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const computeCompleteness = () => {
        const checks = [
            (form.fullName || '').trim().length >= 2,
            (form.roleTitle || '').trim().length >= 2,
            (form.phone || '').trim().length >= 7,
            splitCsv(form.skillsText).length > 0,
            (form.professionalSummary || '').trim().length >= 30,
            (form.resumeUrl || '').trim().length > 0,
        ];
        const done = checks.filter(Boolean).length;
        return Math.round((done / checks.length) * 100);
    };

    const profileStrength = computeCompleteness();

    // Unified notifications (used by both candidates and recruiters).
    const notifTab = searchParams.get('tab') || 'all';
    const unreadCount = useMemo(() => (notifications || []).filter((n) => n.unread).length, [notifications]);
    const visibleNotifs = useMemo(() => {
        const all = notifications || [];
        if (notifTab === 'unread') return all.filter((n) => n.unread);
        return all;
    }, [notifications, notifTab]);

    const markRead = async (id) => {
        try {
            await markNotificationRead(id);
        } catch {}
        setNotifications((prev) => (prev || []).map((n) => (n.id === id ? { ...n, unread: false } : n)));
    };

    const markAllRead = async () => {
        try {
            await markAllNotificationsRead();
        } catch {}
        setNotifications((prev) => (prev || []).map((n) => ({ ...n, unread: false })));
    };

    const onApply = async (jobId) => {
        setError('');
        setSuccess('');
        try {
            await applyForJob(jobId);
            const apps = await getApplications();
            setApplications(apps.data || []);
            setSuccess('Applied successfully.');
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Apply failed');
        }
    };

    const onUploadCertificates = async (fileList) => {
        const files = Array.from(fileList || []).filter(Boolean);
        if (files.length === 0) return;
        setCertUploading(true);
        setCertError('');
        setCertSuccess('');
        try {
            const res = await uploadCertificates(files);
            setCertificates(res.data || []);
            setCertSuccess('Certificates uploaded.');
        } catch (e) {
            setCertError(e.response?.data?.message || e.response?.data || 'Certificate upload failed');
        } finally {
            setCertUploading(false);
        }
    };

    const onDeleteCertificate = async (id) => {
        if (!id) return;
        setCertError('');
        setCertSuccess('');
        try {
            await deleteCertificate(id);
            setCertificates((prev) => (prev || []).filter((c) => c.id !== id));
            setCertSuccess('Certificate deleted.');
        } catch (e) {
            setCertError(e.response?.data?.message || e.response?.data || 'Delete failed');
        }
    };

    const openApplicationDetail = async (applicationId) => {
        setAppDetailId(applicationId);
        setAppDetail(null);
        setAppDetailError('');
        if (!applicationId) return;
        setAppDetailLoading(true);
        try {
            const res = await getApplicationDetail(applicationId);
            setAppDetail(res.data || null);
        } catch (e) {
            setAppDetailError(e.response?.data?.message || e.response?.data || 'Failed to load application details');
        } finally {
            setAppDetailLoading(false);
        }
    };

    const closeApplicationDetail = () => {
        setAppDetailId(null);
        setAppDetail(null);
        setAppDetailError('');
    };

    const loadJobDetail = async (jobId) => {
        const id = String(jobId || '').trim();
        if (!id) return;
        setJobDetailId(id);
        setJobDetail(null);
        setJobDetailError('');
        setJobDetailLoading(true);

        // Try to use cached lists first (fast UI).
        const cached =
            (allJobs || []).find((j) => String(j.id) === id) ||
            (matchedJobs || []).find((j) => String(j.id) === id);
        if (cached) {
            setJobDetail(cached);
            setJobDetailLoading(false);
            return;
        }

        try {
            const res = await getJobById(id);
            setJobDetail(res.data || null);
        } catch (e) {
            setJobDetailError(e.response?.data?.message || e.response?.data || 'Failed to load job details');
        } finally {
            setJobDetailLoading(false);
        }
    };

    const openJobDetail = (jobId, backPage = page || 'browse') => {
        const id = String(jobId || '').trim();
        if (!id) return;
        setJobDetailBackPage(backPage);
        go('job', { jobId: id });
    };

    const closeJobDetail = () => {
        setJobDetailId(null);
        setJobDetail(null);
        setJobDetailError('');
        go(jobDetailBackPage || 'browse');
    };

    const goRecruiter = (recruiterUserId) => {
        if (!recruiterUserId) return;
        nav(`/candidate/recruiters/${recruiterUserId}`);
    };

    const onSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                fullName: form.fullName,
                roleTitle: form.roleTitle,
                location: form.location,
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
            setSuccess('Profile saved.');
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Profile update failed');
        } finally {
            setSaving(false);
        }
    };

    const onPickProfilePhoto = async (file) => {
        if (!file) return;
        setError('');
        setSuccess('');
        try {
            const res = await uploadProfilePhoto(file);
            const url = res.data?.url || '';
            setForm((p) => ({ ...p, profilePhotoDataUrl: url }));
            setSuccess('Photo uploaded.');
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
            setForm((p) => ({ ...p, resumeUrl: url }));
            setSuccess('Resume uploaded.');
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Resume upload failed');
        } finally {
            setResumeUploading(false);
        }
    };

    // Direct-link support: if user lands on an application detail URL, fetch it.
    useEffect(() => {
        if (page !== 'application') return;
        const id = searchParams.get('id');
        const appId = id ? Number(id) : null;
        if (!appId || Number.isNaN(appId)) return;
        if (appDetailId === appId && appDetail) return;
        openApplicationDetail(appId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, searchParams]);

    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    const isActiveNav = (navPage) => {
        // Notifications / interviews / offers are "full pages", but we keep sidebar highlight on the closest main section.
        if (page === 'notifications' || page === 'interviews' || page === 'offers') return navPage === 'dashboard';
        if (page === 'application') return navPage === 'applications';
        return page === navPage;
    };

    return (
        <div className="cp-page">
            <div className="cp-shell">
                <aside className="cp-sidebar">
                    <div className="cp-identity">
                        <Avatar
                            src={resolveUploadUrl(form.profilePhotoDataUrl) || undefined}
                            sx={{ width: 44, height: 44, border: '1px solid rgba(15,23,42,0.10)' }}
                        />
                        <div style={{ minWidth: 0 }}>
                            <div className="cp-identity__name">{meName}</div>
                            <div className="cp-identity__role">{meRole}</div>
                        </div>
                    </div>

                    <div className="cp-nav">
                        <SidebarItem
                            active={isActiveNav('dashboard')}
                            icon={<DashboardOutlinedIcon fontSize="small" />}
                            label="Dashboard"
                            onActivate={() => go('dashboard')}
                        />
                        <SidebarItem
                            active={isActiveNav('browse')}
                            icon={<WorkOutlineRoundedIcon fontSize="small" />}
                            label="Browse Jobs"
                            onActivate={() => go('browse')}
                        />
                        <SidebarItem
                            active={isActiveNav('applications')}
                            icon={<AssignmentTurnedInOutlinedIcon fontSize="small" />}
                            label="My Applications"
                            onActivate={() => go('applications')}
                        />
                        <SidebarItem
                            active={isActiveNav('certificates')}
                            icon={<DescriptionOutlinedIcon fontSize="small" />}
                            label="Certificates"
                            onActivate={() => go('certificates')}
                        />
                        <SidebarItem
                            active={isActiveNav('profile')}
                            icon={<PersonOutlineRoundedIcon fontSize="small" />}
                            label="Profile"
                            onActivate={() => go('profile')}
                        />
                    </div>

                    <div className="cp-sidebar__footer">
                        <button className="cp-btn" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </aside>

                <main className="cp-main">
                    <div className="cp-topbar">
                        <div className="cp-search" title="Search jobs, skills, companies...">
                            <SearchRoundedIcon fontSize="small" />
                            <input
                                value={globalQuery}
                                onChange={(e) => setGlobalQuery(e.target.value)}
                                placeholder="Search jobs, skills, companies..."
                            />
                        </div>

                        <div
                            className={`cp-iconbtn ${unreadCount > 0 ? 'cp-badge' : ''}`}
                            data-count={unreadCount > 99 ? '99+' : String(unreadCount)}
                            role="button"
                            tabIndex={0}
                            onClick={() => go('notifications', { tab: 'all' })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    go('notifications', { tab: 'all' });
                                }
                            }}
                            title="Notifications"
                            aria-label="Notifications"
                        >
                            <NotificationsNoneRoundedIcon fontSize="small" />
                        </div>

                        <div className="cp-avatarchip" title={user?.email || ''}>
                            <div className="cp-avatar">
                                {resolveUploadUrl(form.profilePhotoDataUrl) ? (
                                    <img src={resolveUploadUrl(form.profilePhotoDataUrl)} alt="avatar" />
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="cp-content">
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

                        {page === 'dashboard' ? (
                            <div className="cp-card cp-pad">
                                <div className="cp-row">
                                    <div>
                                        <h1 className="cp-h1">Welcome back, {meName}</h1>
                                        <div className="cp-sub">
                                            Profile strength: {profileStrength}% · {activeApps.length} active applications
                                        </div>
                                    </div>
                                </div>

                                <div className="cp-stats">
                                    <StatNavCard
                                        label="Active Applications"
                                        value={activeApps.length}
                                        meta="Open application pipeline"
                                        onActivate={() => go('applications')}
                                    />
                                    <StatNavCard
                                        label="Interviews Scheduled"
                                        value={interviews.length}
                                        meta="Open interview list"
                                        onActivate={() => go('interviews')}
                                    />
                                    <StatNavCard
                                        label="Offers Received"
                                        value={offers.length}
                                        meta="Open offers"
                                        onActivate={() => go('offers')}
                                    />
                                </div>

                                <div className="cp-grid2">
                                    <div className="cp-card cp-pad">
                                        <div className="cp-section-title">Recommended Jobs</div>
                                        {recommendedJobs.length === 0 ? (
                                            <div className="cp-muted">
                                                No recommended jobs yet. Add skills and keywords in Profile to improve matching.
                                            </div>
                                        ) : (
                                            <div className="cp-jobs">
                                                {recommendedJobs.slice(0, 9).map((j) => {
                                                    const company = (j.companyName || '').trim() || 'Confidential IT Company';
                                                    const tag = inferTag(j);
                                                    const canApply = !appliedJobIds.has(String(j.id));
                                                    return (
                                                        <div className="cp-job" key={`rec-${j.id}`}>
                                                            <div className="cp-job__top">
                                                                <div style={{ minWidth: 0 }}>
                                                                    <p className="cp-job__title">{j.title || 'Role'}</p>
                                                                    {j.recruiterUserId ? (
                                                                        <button
                                                                            type="button"
                                                                            className="cp-job__company cp-job__companyLink"
                                                                            onClick={() => goRecruiter(j.recruiterUserId)}
                                                                        >
                                                                            {company}
                                                                        </button>
                                                                    ) : (
                                                                        <div className="cp-job__company">{company}</div>
                                                                    )}
                                                                </div>
                                                                <div className="cp-badge2">
                                                                    {j.matchScorePercent != null ? `${j.matchScorePercent}% Match` : 'Match'}
                                                                </div>
                                                            </div>
                                                            <div className="cp-tags">
                                                                <span className="cp-tag">{tag}</span>
                                                                <span className="cp-tag">{formatCtc(j) || 'Salary not disclosed'}</span>
                                                                <span className="cp-tag">Remote-friendly</span>
                                                            </div>
                                                            <div className="cp-job__cta">
                                                                <div className="cp-muted" style={{ fontSize: 12 }}>
                                                                    {company}
                                                                </div>
                                                                <button
                                                                    className="cp-mini cp-mini--primary"
                                                                    disabled={!canApply}
                                                                    onClick={() => onApply(j.id)}
                                                                >
                                                                    {canApply ? 'Apply' : 'Applied'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gap: 12 }}>
                                        <div className="cp-card cp-pad">
                                            <div className="cp-section-title">Upcoming Interview</div>
                                            <div className="cp-muted" style={{ fontSize: 13 }}>
                                                {nextInterview
                                                    ? `${nextInterview.type === 'TECHNICAL' ? 'Technical' : 'HR'} · ${nextInterview.mode === 'ONSITE' ? 'Onsite' : 'Online'}`
                                                    : 'No interview scheduled yet.'}
                                            </div>
                                            <Divider sx={{ my: 2 }} />
                                            {!nextInterview ? (
                                                <div className="cp-muted">When a recruiter schedules an interview, it will appear here.</div>
                                            ) : (
                                                <div>
                                                    <div style={{ fontWeight: 950, fontSize: 14 }}>
                                                        {nextInterview.jobTitle || 'Interview'}{' '}
                                                        {nextInterview.companyName ? (
                                                            <span style={{ color: 'rgba(15,23,42,0.62)', fontWeight: 800 }}>
                                                                · {nextInterview.companyName}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="cp-muted" style={{ marginTop: 6 }}>
                                                        Scheduled: {new Date(nextInterview.scheduledAt).toLocaleString()}
                                                    </div>
                                                    {typeof nextInterviewMs === 'number' && nextInterviewMs > 0 ? (
                                                        <div style={{ marginTop: 10, fontWeight: 950 }}>
                                                            Interview starts in {fmtCountdown(nextInterviewMs)}
                                                        </div>
                                                    ) : (
                                                        <div style={{ marginTop: 10, fontWeight: 950 }}>
                                                            Interview time reached
                                                        </div>
                                                    )}
                                                    <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                        <button
                                                            className="cp-btn cp-btn--primary"
                                                            disabled={
                                                                !nextInterview.meetingLink ||
                                                                (typeof nextInterviewMs === 'number' && nextInterviewMs > 0)
                                                            }
                                                            onClick={() =>
                                                                nextInterview.meetingLink &&
                                                                window.open(nextInterview.meetingLink, '_blank', 'noopener,noreferrer')
                                                            }
                                                        >
                                                            Join Interview
                                                        </button>
                                                        <button className="cp-btn" onClick={() => go('interviews')}>
                                                            View All
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="cp-feature">
                                            <div className="cp-feature__top">
                                                <div>
                                                    <p className="cp-feature__title">{featuredJob?.title || 'Featured Role'}</p>
                                                    <div className="cp-feature__sub">
                                                        {featuredJob?.recruiterUserId ? (
                                                            <button
                                                                type="button"
                                                                className="cp-feature__companyLink"
                                                                onClick={() => goRecruiter(featuredJob.recruiterUserId)}
                                                            >
                                                                {(featuredJob?.companyName || '').trim() || 'Featured IT Company'}
                                                            </button>
                                                        ) : (
                                                            (featuredJob?.companyName || '').trim() || 'Featured IT Company'
                                                        )}
                                                    </div>
                                                </div>
                                                {featuredJob?.matchScorePercent != null ? (
                                                    <div className="cp-badge2 cp-badge2--invert">
                                                        {featuredJob.matchScorePercent}% Match
                                                    </div>
                                                ) : null}
                                            </div>
                                            <div className="cp-feature__sub" style={{ marginTop: 10 }}>
                                                {String(featuredJob?.description || 'High-impact role with a modern stack and clear growth.')
                                                    .slice(0, 140)}
                                                {String(featuredJob?.description || '').length > 140 ? '…' : ''}
                                            </div>
                                            <div className="cp-feature__cta">
                                            <div style={{ fontWeight: 900 }}>
                                                Salary: {formatCtc(featuredJob) || 'Salary not disclosed'}
                                            </div>
                                                <button
                                                    className="cp-mini cp-mini--primary"
                                                    disabled={!featuredJob?.id || appliedJobIds.has(String(featuredJob?.id))}
                                                    onClick={() => featuredJob?.id && onApply(featuredJob.id)}
                                                >
                                                    View Role
                                                </button>
                                            </div>
                                        </div>

                                        <div className="cp-card cp-pad">
                                            <div className="cp-section-title">Profile Strength</div>
                                            <div className="cp-muted" style={{ fontSize: 13 }}>
                                                {profileStrength}% complete
                                            </div>
                                            <div className="cp-progress">
                                                <div style={{ width: `${clamp(profileStrength, 0, 100)}%` }} />
                                            </div>
                                            <div className="cp-muted" style={{ fontSize: 13, marginTop: 10 }}>
                                                Tip: Upload a resume and keep skills updated to improve matching.
                                            </div>
                                            <div style={{ marginTop: 10 }}>
                                                <button className="cp-btn cp-btn--primary" onClick={() => go('profile')}>
                                                    Update Profile
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {page === 'browse' ? (
                            <div className="cp-card cp-pad">
                                <div className="cp-row">
                                    <div>
                                        <h1 className="cp-h1" style={{ fontSize: 28 }}>
                                            Browse Jobs
                                        </h1>
                                        <div className="cp-sub">A clean list of roles. No filters, just search and apply.</div>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2 }} />

                                {featuredJob ? (
                                    <div className="cp-card cp-pad" style={{ marginBottom: 12 }}>
                                        <div className="cp-section-title">Featured</div>
                                        <div className="cp-row" style={{ alignItems: 'center' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 950, fontSize: 16 }}>
                                                    {featuredJob.title}
                                                </div>
                                                <div className="cp-muted">
                                                    {featuredJob.recruiterUserId ? (
                                                        <button
                                                            type="button"
                                                            className="cp-inlineLink"
                                                            onClick={() => goRecruiter(featuredJob.recruiterUserId)}
                                                        >
                                                            {(featuredJob.companyName || '').trim() || 'Featured IT Company'}
                                                        </button>
                                                    ) : (
                                                        (featuredJob.companyName || '').trim() || 'Featured IT Company'
                                                    )}{' '}
                                                    · {formatCtc(featuredJob) || 'Salary not disclosed'}
                                                </div>
                                                <div className="cp-tags" style={{ marginTop: 8 }}>
                                                    <span className="cp-tag">Full-time</span>
                                                    <span className="cp-tag">Remote</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button
                                                    className="cp-btn cp-btn--primary"
                                                    onClick={() => featuredJob?.id && openJobDetail(featuredJob.id, 'browse')}
                                                >
                                                    View Role
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {browseJobs.length === 0 ? (
                                    <div className="cp-muted">
                                        No jobs available right now. Try again later, or update your Profile skills to improve matching.
                                    </div>
                                ) : (
                                    <div className="cp-jobs" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                                        {browseJobs.slice(0, 24).map((j) => {
                                            const company = (j.companyName || '').trim() || 'Confidential IT Company';
                                            return (
                                                <div className="cp-job" key={`b-${j.id}`}>
                                                    <div className="cp-job__top">
                                                        <div style={{ minWidth: 0 }}>
                                                            <p className="cp-job__title">{j.title || 'Role'}</p>
                                                            {j.recruiterUserId ? (
                                                                <button
                                                                    type="button"
                                                                    className="cp-job__company cp-job__companyLink"
                                                                    onClick={() => goRecruiter(j.recruiterUserId)}
                                                                >
                                                                    {company}
                                                                </button>
                                                            ) : (
                                                                <div className="cp-job__company">{company}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="cp-tags">
                                                        <span className="cp-tag">{formatCtc(j) || 'Salary not disclosed'}</span>
                                                        <span className="cp-tag">Full-time</span>
                                                        <span className="cp-tag">Remote</span>
                                                    </div>
                                                    <div className="cp-job__cta">
                                                        <div className="cp-muted" style={{ fontSize: 12 }}>
                                                            {company}
                                                        </div>
                                                        <button
                                                            className="cp-mini cp-mini--primary"
                                                            onClick={() => openJobDetail(j.id, 'browse')}
                                                        >
                                                            View Role
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {page === 'job' ? (
                            <div className="cp-card cp-pad">
                                <div className="cp-row" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <h1 className="cp-h1" style={{ fontSize: 28, marginBottom: 6 }}>
                                            Job Details
                                        </h1>
                                        <div className="cp-sub">View job requirements and apply when ready.</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        <button className="cp-btn" onClick={closeJobDetail}>
                                            Back
                                        </button>
                                        <button
                                            className="cp-btn cp-btn--primary"
                                            disabled={!jobDetail?.id || appliedJobIds.has(String(jobDetail?.id))}
                                            onClick={() => jobDetail?.id && onApply(jobDetail.id)}
                                        >
                                            {jobDetail?.id && appliedJobIds.has(String(jobDetail?.id)) ? 'Applied' : 'Apply'}
                                        </button>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2 }} />

                                {jobDetailLoading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(15,23,42,0.70)' }}>
                                        <CircularProgress size={18} /> Loading job details...
                                    </div>
                                ) : jobDetailError ? (
                                    <Alert severity="error">{String(jobDetailError)}</Alert>
                                ) : !jobDetail ? (
                                    <div className="cp-muted">Job not found.</div>
                                ) : (
                                    <div style={{ display: 'grid', gap: 14 }}>
                                        <div>
                                            <div style={{ fontWeight: 950, fontSize: 18 }}>{jobDetail.title || 'Role'}</div>
                                            <div className="cp-muted" style={{ marginTop: 4 }}>
                                                {jobDetail.recruiterUserId ? (
                                                    <button
                                                        type="button"
                                                        className="cp-inlineLink"
                                                        onClick={() => goRecruiter(jobDetail.recruiterUserId)}
                                                    >
                                                        {(jobDetail.companyName || '').trim() || 'Confidential IT Company'}
                                                    </button>
                                                ) : (
                                                    (jobDetail.companyName || '').trim() || 'Confidential IT Company'
                                                )}{' '}
                                                · {formatCtc(jobDetail) || 'Salary not disclosed'} · Min Exp:{' '}
                                                {jobDetail.minExperienceYears ?? 0}y
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {(jobDetail.requiredSkills || []).slice(0, 12).map((s) => (
                                                <Chip key={`js-${s}`} label={String(s)} size="small" />
                                            ))}
                                            {(jobDetail.keywords || []).slice(0, 12).map((k) => (
                                                <Chip key={`jk-${k}`} label={String(k)} size="small" variant="outlined" />
                                            ))}
                                        </div>

                                        <div className="cp-card cp-pad" style={{ background: 'rgba(255,255,255,0.72)' }}>
                                            <div className="cp-section-title">Job Description</div>
                                            <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(15,23,42,0.82)', fontSize: 14 }}>
                                                {jobDetail.description || 'No description provided.'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {page === 'applications' ? (
                            <div className="cp-card cp-pad">
                                <div className="cp-row">
                                    <div>
                                        <h1 className="cp-h1" style={{ fontSize: 28 }}>
                                            My Applications
                                        </h1>
                                        <div className="cp-sub">You have {activeApps.length} active applications</div>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2 }} />

                                <div className="cp-list">
                                    {applications.length === 0 ? (
                                        <div className="cp-muted">No applications yet. Browse jobs and apply.</div>
                                    ) : (
                                        applications.slice(0, 30).map((a) => {
                                            const stage = appStageIndex(a.status);
                                            const pct = stage < 0 ? 100 : clamp(Math.round(((stage + 1) / 4) * 100), 0, 100);
                                            const next =
                                                stage < 0
                                                    ? 'Closed'
                                                    : stage === 0
                                                      ? 'Awaiting screening'
                                                      : stage === 1
                                                        ? 'Interview details pending'
                                                        : stage === 2
                                                          ? 'Awaiting decision'
                                                          : 'Offer action required';
                                            return (
                                                <div
                                                    className="cp-app"
                                                    key={`app-${a.id}`}
                                                    role="button"
                                                    tabIndex={0}
                                                    title="View application details"
                                                    onClick={() => {
                                                        go('application', { id: a.id });
                                                        openApplicationDetail(a.id);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            go('application', { id: a.id });
                                                            openApplicationDetail(a.id);
                                                        }
                                                    }}
                                                >
                                                    <div className="cp-app__top">
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="cp-app__title">{a.jobTitle}</div>
                                                            <div className="cp-muted" style={{ fontSize: 12 }}>
                                                                {(a.companyName || '').trim() ? `${a.companyName} · ` : ''}
                                                                Status: {stageLabel(a.status)}
                                                            </div>
                                                            <div className="cp-muted" style={{ fontSize: 12 }}>
                                                                Applied: {a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : '-'}
                                                            </div>
                                                        </div>
                                                        <div className="cp-badge2">{String(a.status)}</div>
                                                    </div>

                                                    <div className="cp-pipeline">
                                                        {['Applied', 'Screening', 'Interview', 'Offer'].map((s, idx) => (
                                                            <div
                                                                key={`${a.id}-stage-${s}`}
                                                                className={`cp-stage ${idx === stage ? 'is-current' : ''} ${stage >= idx ? 'is-done' : ''}`}
                                                            >
                                                                {s}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="cp-progress">
                                                        <div style={{ width: `${pct}%` }} />
                                                    </div>

                                                    <div className="cp-app__footer">
                                                        <div className="cp-muted" style={{ fontSize: 12 }}>
                                                            Next step: {next}
                                                            {a.updatedAt ? ` · Updated ${new Date(a.updatedAt).toLocaleString()}` : ''}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 10 }}>
                                                            <button className="cp-mini" onClick={() => go('notifications', { tab: 'all' })}>
                                                                Updates
                                                            </button>
                                                            {(String(a.status).toUpperCase() === 'TECHNICAL' ||
                                                                String(a.status).toUpperCase() === 'FINAL_INTERVIEW') ? (
                                                                <button className="cp-mini cp-mini--primary" onClick={() => go('interviews', { focus: a.id })}>
                                                                    View Interview
                                                                </button>
                                                            ) : null}
                                                            {String(a.status).toUpperCase() === 'OFFER' ? (
                                                                <button className="cp-mini cp-mini--primary" onClick={() => go('offers', { focus: a.id })}>
                                                                    View Offer
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {page === 'application' ? (
                            <div className="cp-card cp-pad">
                                <div className="cp-row" style={{ alignItems: 'center' }}>
                                    <div>
                                        <h1 className="cp-h1" style={{ fontSize: 28 }}>
                                            Application Details
                                        </h1>
                                        <div className="cp-sub">Full job description, recruiter info, and status timeline.</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button
                                            className="cp-btn"
                                            onClick={() => {
                                                closeApplicationDetail();
                                                go('applications');
                                            }}
                                        >
                                            Back
                                        </button>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2 }} />

                                {appDetailLoading ? (
                                    <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                                        <CircularProgress />
                                    </Box>
                                ) : appDetailError ? (
                                    <Alert severity="error">{String(appDetailError)}</Alert>
                                ) : !appDetail ? (
                                    <div className="cp-muted">Select an application from “My Applications”.</div>
                                ) : (
                                    <div className="cp-grid2" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
                                        <div className="cp-card cp-pad">
                                            <div style={{ fontWeight: 950, fontSize: 18 }}>{appDetail.jobTitle}</div>
                                            <div className="cp-muted" style={{ marginTop: 4 }}>
                                                {(appDetail.companyName || '').trim() || 'Company'} ·{' '}
                                                {formatCtc(appDetail) || 'Salary not disclosed'} · Min Exp: {appDetail.minExperienceYears}+ yrs
                                            </div>

                                            <Divider sx={{ my: 2 }} />

                                            <div style={{ fontWeight: 900, marginBottom: 6 }}>Job Description</div>
                                            <div className="cp-muted" style={{ whiteSpace: 'pre-wrap' }}>
                                                {appDetail.jobDescription || 'No description available.'}
                                            </div>

                                            <Divider sx={{ my: 2 }} />

                                            <div style={{ fontWeight: 900, marginBottom: 8 }}>Skills & Keywords</div>
                                            <div className="cp-tags" style={{ flexWrap: 'wrap' }}>
                                                {(appDetail.requiredSkills || []).slice(0, 24).map((s) => (
                                                    <span className="cp-tag" key={`ad-rs-${s}`}>
                                                        {s}
                                                    </span>
                                                ))}
                                                {(appDetail.keywords || []).slice(0, 24).map((k) => (
                                                    <span className="cp-tag" key={`ad-rk-${k}`}>
                                                        {k}
                                                    </span>
                                                ))}
                                                {(appDetail.requiredSkills || []).length === 0 && (appDetail.keywords || []).length === 0 ? (
                                                    <span className="cp-muted">No tags provided.</span>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="cp-card cp-pad">
                                            <div style={{ fontWeight: 900, marginBottom: 6 }}>Application Status</div>
                                            <div className="cp-muted" style={{ fontSize: 13 }}>
                                                {stageLabel(appDetail.status)}
                                            </div>

                                            <Divider sx={{ my: 2 }} />

                                            <div className="cp-pipeline">
                                                {['Applied', 'Screening', 'Interview', 'Offer'].map((s, idx) => {
                                                    const stage = appStageIndex(appDetail.status);
                                                    return (
                                                        <div
                                                            key={`ad-stage-${s}`}
                                                            className={`cp-stage ${idx === stage ? 'is-current' : ''} ${stage >= idx ? 'is-done' : ''}`}
                                                        >
                                                            {s}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <Divider sx={{ my: 2 }} />

                                            <div style={{ fontWeight: 900, marginBottom: 6 }}>Recruiter Contact</div>
                                            <div className="cp-muted" style={{ fontSize: 13 }}>
                                                Company: {(appDetail.companyName || '').trim() || '-'}
                                            </div>
                                            <div className="cp-muted" style={{ fontSize: 13 }}>
                                                Email: {(appDetail.recruiterEmail || '').trim() || '-'}
                                            </div>

                                            <Divider sx={{ my: 2 }} />

                                            <button
                                                className="cp-btn cp-btn--primary"
                                                disabled={!(appDetail.recruiterEmail || '').trim()}
                                                onClick={() => {
                                                    const to = (appDetail.recruiterEmail || '').trim();
                                                    if (!to) return;
                                                    const subject = `Application for ${appDetail.jobTitle || 'Position'}`;
                                                    const body =
                                                        `Hello,%0D%0A%0D%0A` +
                                                        `I have applied for the ${appDetail.jobTitle || 'role'} role and would like to follow up regarding my application.%0D%0A%0D%0A` +
                                                        `Looking forward to your response.%0D%0A%0D%0A` +
                                                        `Thank you.`;
                                                    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
                                                        subject,
                                                    )}&body=${body}`;
                                                }}
                                            >
                                                Contact Recruiter
                                            </button>

                                            <div className="cp-muted" style={{ fontSize: 12, marginTop: 10 }}>
                                                Applied: {appDetail.appliedAt ? new Date(appDetail.appliedAt).toLocaleString() : '-'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {page === 'certificates' ? (
                            <div className="cp-card cp-pad">
                                <div className="cp-row" style={{ alignItems: 'center' }}>
                                    <div>
                                        <h1 className="cp-h1" style={{ fontSize: 28 }}>
                                            Upload Certificates
                                        </h1>
                                        <div className="cp-sub">Add PDF/JPG/PNG certificates to strengthen your profile.</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <Button
                                            variant="contained"
                                            component="label"
                                            disabled={certUploading}
                                            sx={{ backgroundColor: '#1f3a8a', fontWeight: 900 }}
                                        >
                                            {certUploading ? 'Uploading…' : 'Upload'}
                                            <input
                                                hidden
                                                multiple
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                                                onChange={(e) => onUploadCertificates(e.target.files)}
                                            />
                                        </Button>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2 }} />

                                {certError ? (
                                    <Alert severity="error" sx={{ mb: 1.5 }}>
                                        {String(certError)}
                                    </Alert>
                                ) : null}
                                {certSuccess ? (
                                    <Alert severity="success" sx={{ mb: 1.5 }}>
                                        {String(certSuccess)}
                                    </Alert>
                                ) : null}

                                {certificates.length === 0 ? (
                                    <div className="cp-muted">No certificates uploaded yet.</div>
                                ) : (
                                    <div className="cp-list">
                                        {certificates.slice(0, 60).map((c) => {
                                            const name = c.originalName || String(c.fileUrl || '').split('/').pop() || 'certificate';
                                            const when = c.uploadedAt ? new Date(c.uploadedAt).toLocaleString() : '';
                                            const url = resolveUploadUrl(c.fileUrl);
                                            return (
                                                <div
                                                    className="cp-card cp-pad"
                                                    key={`cert-${c.id}`}
                                                    style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                                                >
                                                    <DescriptionOutlinedIcon fontSize="small" />
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <div
                                                            style={{
                                                                fontWeight: 900,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            }}
                                                        >
                                                            {name}
                                                        </div>
                                                        <div className="cp-muted" style={{ fontSize: 12 }}>
                                                            {when ? `Uploaded: ${when}` : ''}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                        <Button
                                                            variant="outlined"
                                                            onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
                                                            disabled={!url}
                                                        >
                                                            View / Download
                                                        </Button>
                                                        <IconButton
                                                            aria-label="Delete certificate"
                                                            onClick={() => onDeleteCertificate(c.id)}
                                                            size="small"
                                                        >
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {page === 'notifications' ? (
                            <div className="cp-card cp-pad">
                                <div className="cp-row" style={{ alignItems: 'center' }}>
                                    <div>
                                        <h1 className="cp-h1" style={{ fontSize: 28 }}>
                                            Notifications
                                        </h1>
                                        <div className="cp-sub">All updates in one place</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button
                                            className={`cp-btn ${notifTab === 'all' ? 'cp-btn--primary' : ''}`}
                                            onClick={() => go('notifications', { tab: 'all' })}
                                        >
                                            All
                                        </button>
                                        <button
                                            className={`cp-btn ${notifTab === 'unread' ? 'cp-btn--primary' : ''}`}
                                            onClick={() => go('notifications', { tab: 'unread' })}
                                        >
                                            Unread
                                        </button>
                                        <button className="cp-btn" disabled={unreadCount === 0} onClick={markAllRead}>
                                            Mark all read
                                        </button>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2 }} />

                                {visibleNotifs.length === 0 ? (
                                    <div className="cp-muted">No notifications to show.</div>
                                ) : (
                                    <div className="cp-list">
                                        {visibleNotifs.slice(0, 50).map((n) => (
                                            <div
                                                className={`cp-notif ${n.unread ? 'is-unread' : ''}`}
                                                key={n.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => {
                                                    markRead(n.id);
                                                    if (n.actionUrl) nav(n.actionUrl);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        markRead(n.id);
                                                        if (n.actionUrl) nav(n.actionUrl);
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
                            </div>
                        ) : null}

                        {page === 'interviews' ? (
                            <div className="cp-card cp-pad">
                                <div className="cp-row">
                                    <div>
                                        <h1 className="cp-h1" style={{ fontSize: 28 }}>
                                            Interviews
                                        </h1>
                                        <div className="cp-sub">All scheduled interviews</div>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2 }} />

                                {interviews.length === 0 ? (
                                    <div className="cp-muted">No interviews scheduled yet.</div>
                                ) : (
                                    <div className="cp-jobs" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                                        {interviews.map((iv) => {
                                            const dt = iv.scheduledAt ? new Date(iv.scheduledAt) : null;
                                            const focus = searchParams.get('focus');
                                            const isFocus = focus && String(focus) === String(iv.id);
                                            const type = String(iv.type || 'HR');
                                            const mode = String(iv.mode || 'ONLINE');
                                            const joinEnabled = (iv.meetingLink || '').trim().length > 0;
                                            return (
                                                <div className="cp-job" key={`iv-${iv.id}`} style={{ borderColor: isFocus ? 'rgba(11,95,255,0.35)' : undefined }}>
                                                    <div className="cp-job__top">
                                                        <div style={{ minWidth: 0 }}>
                                                            <p className="cp-job__title">{iv.jobTitle || 'Interview'}</p>
                                                            <div className="cp-job__company">
                                                                Company:{' '}
                                                                {iv.companyName ? (
                                                                    <span style={{ fontWeight: 800 }}>{iv.companyName}</span>
                                                                ) : (
                                                                    'Company'
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="cp-badge2">{type}</div>
                                                    </div>
                                                    <div className="cp-tags">
                                                        <span className="cp-tag">{mode === 'ONSITE' ? 'Onsite' : 'Online'}</span>
                                                        <span className="cp-tag">{dt ? dt.toLocaleString() : 'Scheduled'}</span>
                                                        <span className="cp-tag">{type === 'TECHNICAL' ? 'Technical' : 'HR'}</span>
                                                    </div>
                                                    <div className="cp-job__cta">
                                                        <div className="cp-muted" style={{ fontSize: 12 }}>
                                                            {iv.notes ? `Notes: ${iv.notes}` : 'Interview details are available.'}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 10 }}>
                                                            <button
                                                                className="cp-mini cp-mini--primary"
                                                                disabled={!joinEnabled}
                                                                onClick={() => joinEnabled && window.open(iv.meetingLink, '_blank', 'noopener,noreferrer')}
                                                            >
                                                                Join Meeting
                                                            </button>
                                                            <button className="cp-mini" disabled>
                                                                Reschedule
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {page === 'offers' ? (
                            <div className="cp-card cp-pad">
                                <div className="cp-row">
                                    <div>
                                        <h1 className="cp-h1" style={{ fontSize: 28 }}>
                                            Offers
                                        </h1>
                                        <div className="cp-sub">Offer list view</div>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2 }} />

                                {offers.length === 0 ? (
                                    <div className="cp-muted">No offers yet.</div>
                                ) : (
                                    <div className="cp-list">
                                        {offers.map((a) => {
                                            const dt = a.updatedAt ? new Date(a.updatedAt) : new Date();
                                            const exp = new Date(dt.getTime() + 3 * 24 * 3600 * 1000);
                                            const expSoon = exp.getTime() - Date.now() < 24 * 3600 * 1000;
                                            const focus = searchParams.get('focus');
                                            const isFocus = focus && String(focus) === String(a.id);
                                            return (
                                                <div className="cp-app" key={`off-${a.id}`} style={{ borderColor: isFocus ? 'rgba(11,95,255,0.35)' : undefined }}>
                                                    <div className="cp-app__top">
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="cp-app__title">{a.jobTitle}</div>
                                                            <div className="cp-muted" style={{ fontSize: 12 }}>
                                                                Company: Confidential IT Company · Updated {dt.toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <div className={`cp-badge2 ${expSoon ? 'cp-badge2--warn' : ''}`}>
                                                            {expSoon ? 'Expiring soon' : 'Offer'}
                                                        </div>
                                                    </div>
                                                    <div className="cp-tags">
                                                        <span className="cp-tag">Offer stage</span>
                                                        <span className="cp-tag">Expires: {exp.toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="cp-app__footer">
                                                        <div className="cp-muted" style={{ fontSize: 12 }}>
                                                            Next step: Review and respond
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 10 }}>
                                                            <button className="cp-mini cp-mini--primary" disabled>
                                                                View Offer Details
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {page === 'profile' ? (
                            <div className="cp-card cp-pad">
                                <div className="cp-row">
                                    <div>
                                        <h1 className="cp-h1" style={{ fontSize: 28 }}>
                                            Profile
                                        </h1>
                                        <div className="cp-sub">Keep your information updated for better matching.</div>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2 }} />

                                <div className="cp-grid2" style={{ gridTemplateColumns: '1.15fr 0.85fr' }}>
                                    <div className="cp-card cp-pad">
                                        <div className="cp-section-title">Details</div>
                                        <Stack spacing={2}>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Avatar
                                                    src={resolveUploadUrl(form.profilePhotoDataUrl) || undefined}
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
                                                                onChange={(e) => onPickProfilePhoto(e.target.files?.[0])}
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
                                                </Stack>
                                            </Stack>

                                            <TextField label="Email" value={profile?.email || user?.email || ''} disabled fullWidth />
                                            <TextField
                                                label="Full Name"
                                                value={form.fullName}
                                                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Role"
                                                value={form.roleTitle}
                                                onChange={(e) => setForm((p) => ({ ...p, roleTitle: e.target.value }))}
                                                fullWidth
                                                placeholder="Your Role"
                                            />
                                            <TextField
                                                label="Location"
                                                value={form.location}
                                                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                                                fullWidth
                                                placeholder="City / Remote"
                                            />
                                            <TextField
                                                label="Phone"
                                                value={form.phone}
                                                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Education"
                                                value={form.education}
                                                onChange={(e) => setForm((p) => ({ ...p, education: e.target.value }))}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Experience (Years)"
                                                type="number"
                                                value={form.experienceYears}
                                                onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Professional Summary"
                                                value={form.professionalSummary}
                                                onChange={(e) => setForm((p) => ({ ...p, professionalSummary: e.target.value }))}
                                                fullWidth
                                                multiline
                                                minRows={4}
                                            />

                                            <Autocomplete
                                                multiple
                                                freeSolo
                                                options={skillOptions}
                                                value={splitCsv(form.skillsText)}
                                                onChange={(_, newValue) => setForm((p) => ({ ...p, skillsText: (newValue || []).join(', ') }))}
                                                renderTags={(value, getTagProps) =>
                                                    value.map((option, index) => (
                                                        <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                                                    ))
                                                }
                                                renderInput={(params) => (
                                                    <TextField {...params} label="Skills (type to search)" placeholder="Start typing…" />
                                                )}
                                            />

                                            <Autocomplete
                                                multiple
                                                freeSolo
                                                options={keywordOptions}
                                                value={splitCsv(form.keywordsText)}
                                                onChange={(_, newValue) => setForm((p) => ({ ...p, keywordsText: (newValue || []).join(', ') }))}
                                                renderTags={(value, getTagProps) =>
                                                    value.map((option, index) => (
                                                        <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                                                    ))
                                                }
                                                renderInput={(params) => (
                                                    <TextField {...params} label="Keywords (type to search)" placeholder="e.g., react, java, spring…" />
                                                )}
                                            />

                                            <Button
                                                variant="contained"
                                                onClick={onSave}
                                                disabled={saving || !(form.fullName || '').trim() || !(form.phone || '').trim()}
                                                sx={{ backgroundColor: '#1f3a8a' }}
                                            >
                                                {saving ? 'Saving…' : 'Save Profile'}
                                            </Button>
                                        </Stack>
                                    </div>

                                    <div style={{ display: 'grid', gap: 12 }}>
                                        <div className="cp-card cp-pad">
                                            <div className="cp-section-title">Resume / CV</div>
                                            <div className="cp-muted" style={{ fontSize: 13 }}>
                                                Upload your resume to apply faster.
                                            </div>
                                            <Divider sx={{ my: 2 }} />
                                            <Stack spacing={1.5}>
                                                <Button
                                                    variant="outlined"
                                                    component="label"
                                                    startIcon={<DescriptionOutlinedIcon />}
                                                    disabled={resumeUploading}
                                                >
                                                    {resumeUploading ? 'Uploading…' : 'Upload Resume'}
                                                    <input
                                                        hidden
                                                        type="file"
                                                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                        onChange={(e) => onPickResume(e.target.files?.[0])}
                                                    />
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    disabled={!form.resumeUrl}
                                                    onClick={() => {
                                                        const u = resolveUploadUrl(form.resumeUrl);
                                                        if (u) window.open(u, '_blank', 'noopener,noreferrer');
                                                    }}
                                                    sx={{ backgroundColor: '#1f3a8a' }}
                                                >
                                                    View Resume
                                                </Button>
                                                {form.resumeUrl ? (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Uploaded: {String(form.resumeUrl).split('/').pop()}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">
                                                        No resume uploaded yet.
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </div>

                                        <div className="cp-card cp-pad">
                                            <div className="cp-section-title">Quick Summary</div>
                                            <div className="cp-muted" style={{ fontSize: 13 }}>
                                                {meName} · {meRole}
                                            </div>
                                            <Divider sx={{ my: 2 }} />
                                            <div className="cp-muted" style={{ fontSize: 13 }}>
                                                Applications: {activeApps.length} · Interviews: {interviews.length} · Offers: {offers.length}
                                                {dailyStats ? ` · Profile views (24h): ${dailyStats.profileViewsCount ?? 0}` : ''}
                                            </div>
                                            {dailyStats?.updatedAt ? (
                                                <div className="cp-muted" style={{ fontSize: 12, marginTop: 8 }}>
                                                    Stats updated: {new Date(dailyStats.updatedAt).toLocaleString()}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <Divider sx={{ my: 2.5 }} />
                                <div className="cp-muted" style={{ fontSize: 13 }}>
                                    Want to add certifications? Go to the Certificates page from the sidebar.
                                </div>
                            </div>
                        ) : null}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CandidateDashboardModern;
