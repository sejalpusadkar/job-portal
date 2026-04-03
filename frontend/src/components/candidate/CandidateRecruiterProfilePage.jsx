import React, { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Stack,
    Typography,
    Alert,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { resolveUploadUrl } from '../../utils/url';
import { getRecruiterPublicJobs, getRecruiterPublicPosts, getRecruiterPublicProfile } from '../../services/recruiterPublicService';
import { togglePostLike, addPostComment, listPostComments, sharePost } from '../../services/postService';
import '../../styles/candidatePortal.css';

const fmtWhen = (iso) => {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return '';
    }
};

const CandidateRecruiterProfilePage = () => {
    const nav = useNavigate();
    const { recruiterUserId } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [posts, setPosts] = useState([]);
    const [following, setFollowing] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [p, j, ps] = await Promise.all([
                getRecruiterPublicProfile(recruiterUserId),
                getRecruiterPublicJobs(recruiterUserId),
                getRecruiterPublicPosts(recruiterUserId),
            ]);
            setProfile(p.data);
            setJobs(j.data || []);
            setPosts(ps.data || []);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Failed to load recruiter profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recruiterUserId]);

    const company = profile?.companyName || 'Company';
    const person = profile?.contactPerson || 'Recruiter';
    const position = profile?.position || 'Hiring Team';
    const photo = resolveUploadUrl(profile?.profilePhotoUrl || '');

    const postsSorted = useMemo(
        () =>
            (posts || []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [posts],
    );

    const onLike = async (postId) => {
        try {
            await togglePostLike(postId);
            await load();
        } catch {}
    };

    const onShare = async (postId) => {
        try {
            await sharePost(postId);
            await load();
        } catch {}
    };

    const onCommentQuick = async (postId) => {
        const text = window.prompt('Write a comment');
        if (!text) return;
        try {
            await addPostComment(postId, text);
            await load();
        } catch {}
    };

    const onViewComments = async (postId) => {
        try {
            const res = await listPostComments(postId);
            const items = res.data || [];
            const lines = items.map((c) => `${c.userEmail}: ${c.text}`).join('\n');
            window.alert(lines || 'No comments yet.');
        } catch {
            window.alert('Failed to load comments');
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
                <Alert severity="error">{error || 'Recruiter profile not found'}</Alert>
                <Button sx={{ mt: 2 }} variant="contained" onClick={() => nav('/candidate-dashboard?page=browse')}>
                    Back
                </Button>
            </Box>
        );
    }

    return (
        <div className="cp-page">
            <div className="cp-shell">
                <aside className="cp-sidebar">
                    <div className="cp-identity">
                        <Avatar src={undefined} sx={{ width: 44, height: 44, bgcolor: 'rgba(31,58,138,0.12)', color: '#1f3a8a', fontWeight: 900 }}>
                            U
                        </Avatar>
                        <div>
                            <div className="cp-identity__name">Profile</div>
                            <div className="cp-identity__role">Recruiter / Company</div>
                        </div>
                    </div>
                    <nav className="cp-nav">
                        <button className="cp-nav__item" onClick={() => nav('/candidate-dashboard?page=browse')} type="button">
                            Browse Jobs
                        </button>
                        <button className="cp-nav__item" onClick={() => nav('/candidate-dashboard?page=applications')} type="button">
                            My Applications
                        </button>
                        <button className="cp-nav__item" onClick={() => nav('/candidate-dashboard?page=dashboard')} type="button">
                            Dashboard
                        </button>
                    </nav>
                </aside>

                <main className="cp-main">
                    <div className="cp-topbar">
                        <Button startIcon={<ArrowBackRoundedIcon />} variant="outlined" onClick={() => nav(-1)} sx={{ borderRadius: '14px' }}>
                            Back
                        </Button>
                        <div style={{ flex: 1 }} />
                        <Avatar src={photo || undefined} sx={{ width: 34, height: 34 }}>
                            {(company || 'C').slice(0, 1).toUpperCase()}
                        </Avatar>
                    </div>

                    {error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {String(error)}
                        </Alert>
                    ) : null}

                    <Box className="cp-card" sx={{ p: 2.4 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                            <Avatar src={photo || undefined} sx={{ width: 84, height: 84, bgcolor: 'rgba(15,23,42,0.08)', color: '#0f172a', fontWeight: 900 }}>
                                {(company || 'C').slice(0, 1).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                                    {person}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                    <Chip icon={<BusinessOutlinedIcon />} label={company} sx={{ borderRadius: '999px', fontWeight: 900 }} />
                                    <Chip label={position} sx={{ borderRadius: '999px', fontWeight: 900 }} />
                                    <Chip icon={<LocationOnOutlinedIcon />} label={'Location'} sx={{ borderRadius: '999px', fontWeight: 900 }} />
                                </Stack>
                                <Typography sx={{ color: 'rgba(15,23,42,0.74)', mt: 1.2 }}>
                                    {profile.professionalSummary || 'About company and hiring team details will appear here.'}
                                </Typography>
                            </Box>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ width: { xs: '100%', md: 'auto' } }}>
                                <Button
                                    startIcon={<PersonAddAltRoundedIcon />}
                                    variant={following ? 'contained' : 'outlined'}
                                    onClick={() => setFollowing((p) => !p)}
                                    sx={{ borderRadius: '14px', fontWeight: 900, background: following ? '#1f3a8a' : undefined }}
                                >
                                    {following ? 'Following' : 'Follow'}
                                </Button>
                                <Button
                                    startIcon={<MailOutlineRoundedIcon />}
                                    variant="outlined"
                                    onClick={() => window.open(`mailto:${profile.email || ''}`, '_blank', 'noopener,noreferrer')}
                                    sx={{ borderRadius: '14px', fontWeight: 900 }}
                                >
                                    Message
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>

                    <Box sx={{ mt: 2.4, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' }, gap: 2.4 }}>
                        <Box className="cp-card" sx={{ p: 2.2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                Open Jobs Posted
                            </Typography>
                            <Divider sx={{ my: 1.2 }} />
                            {jobs.length === 0 ? (
                                <Typography sx={{ color: 'rgba(15,23,42,0.68)' }}>No open jobs right now.</Typography>
                            ) : (
                                <Stack spacing={1.2}>
                                    {jobs.map((j) => (
                                        <Box key={j.id} sx={{ border: '1px solid rgba(15,23,42,0.10)', borderRadius: '16px', p: 1.6 }}>
                                            <Typography sx={{ fontWeight: 950 }}>{j.title}</Typography>
                                            <Typography sx={{ color: 'rgba(15,23,42,0.72)', mt: 0.6 }} noWrap>
                                                {j.description || 'Job description'}
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                                <Chip label={`${j.minExperienceYears || 0}+ yrs`} size="small" sx={{ borderRadius: '999px', fontWeight: 800 }} />
                                                <Chip label={j.status} size="small" sx={{ borderRadius: '999px', fontWeight: 800 }} />
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>

                        <Box className="cp-card" sx={{ p: 2.2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                Recruiter Posts
                            </Typography>
                            <Divider sx={{ my: 1.2 }} />
                            {postsSorted.length === 0 ? (
                                <Typography sx={{ color: 'rgba(15,23,42,0.68)' }}>No recent posts.</Typography>
                            ) : (
                                <Stack spacing={1.4}>
                                    {postsSorted.map((p) => (
                                        <Box key={p.id} sx={{ border: '1px solid rgba(15,23,42,0.10)', borderRadius: '16px', p: 1.8 }}>
                                            <Stack direction="row" spacing={1.2} alignItems="center">
                                                <Avatar src={photo || undefined} sx={{ width: 34, height: 34 }}>
                                                    {(company || 'C').slice(0, 1).toUpperCase()}
                                                </Avatar>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>{company}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.60)' }}>
                                                        {fmtWhen(p.createdAt)}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <Typography sx={{ mt: 1.1, color: 'rgba(15,23,42,0.84)', whiteSpace: 'pre-wrap' }}>
                                                {p.caption}
                                            </Typography>
                                            {p.imageUrl ? (
                                                <Box sx={{ mt: 1.2 }}>
                                                    <img
                                                        alt="Post"
                                                        src={resolveUploadUrl(p.imageUrl)}
                                                        style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 14 }}
                                                    />
                                                </Box>
                                            ) : null}

                                            <Stack direction="row" spacing={1.2} sx={{ mt: 1.2, flexWrap: 'wrap' }}>
                                                <Button size="small" onClick={() => onLike(p.id)} sx={{ borderRadius: '12px' }}>
                                                    {p.likedByMe ? 'Liked' : 'Like'} ({p.likeCount || 0})
                                                </Button>
                                                <Button size="small" onClick={() => onCommentQuick(p.id)} sx={{ borderRadius: '12px' }}>
                                                    Comment ({p.commentCount || 0})
                                                </Button>
                                                <Button size="small" onClick={() => onViewComments(p.id)} sx={{ borderRadius: '12px' }}>
                                                    View
                                                </Button>
                                                <Button size="small" onClick={() => onShare(p.id)} sx={{ borderRadius: '12px' }}>
                                                    Share ({p.shareCount || 0})
                                                </Button>
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                </main>
            </div>
        </div>
    );
};

export default CandidateRecruiterProfilePage;

