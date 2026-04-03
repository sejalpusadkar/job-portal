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
    Stack,
    TextField,
    Typography,
    Collapse,
} from '@mui/material';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';

import {
    addPostComment,
    getPostsFeed,
    listPostComments,
    sharePost,
    togglePostLike,
} from '../../services/postService';
import { resolveUploadUrl } from '../../utils/url';

const fmtDate = (iso) => {
    try {
        const d = new Date(iso);
        return d.toLocaleString();
    } catch {
        return '';
    }
};

const PostsFeed = ({ title = 'Company Posts', canPost = false, onCreatePost, reloadKey }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [posts, setPosts] = useState([]);

    const [caption, setCaption] = useState('');
    const [file, setFile] = useState(null);
    const [posting, setPosting] = useState(false);

    const [openCommentsFor, setOpenCommentsFor] = useState(null);
    const [comments, setComments] = useState({});
    const [commentText, setCommentText] = useState({});

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getPostsFeed();
            setPosts(res.data || []);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey]);

    const onToggleLike = async (postId) => {
        setError('');
        try {
            await togglePostLike(postId);
            await load();
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Like failed');
        }
    };

    const onShare = async (postId) => {
        setError('');
        try {
            await sharePost(postId);
            const link = `${window.location.origin}/posts/${postId}`;
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(link);
            }
            setSuccess('Link copied (or ready to share).');
            await load();
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Share failed');
        }
    };

    const onOpenComments = async (postId) => {
        const next = openCommentsFor === postId ? null : postId;
        setOpenCommentsFor(next);
        if (!next) return;
        if (comments[postId]) return;
        try {
            const res = await listPostComments(postId);
            setComments((p) => ({ ...p, [postId]: res.data || [] }));
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Failed to load comments');
        }
    };

    const onAddComment = async (postId) => {
        const text = (commentText[postId] || '').trim();
        if (!text) return;
        setError('');
        try {
            await addPostComment(postId, text);
            setCommentText((p) => ({ ...p, [postId]: '' }));
            const res = await listPostComments(postId);
            setComments((p) => ({ ...p, [postId]: res.data || [] }));
            await load();
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || 'Comment failed');
        }
    };

    const onPost = async () => {
        if (!canPost) return;
        const cap = caption.trim();
        if (!cap && !file) {
            setError('Write a caption or upload an image.');
            return;
        }
        setPosting(true);
        setError('');
        setSuccess('');
        try {
            if (!onCreatePost) throw new Error('Posting is not configured');
            await onCreatePost(cap, file);
            setCaption('');
            setFile(null);
            setSuccess('Posted successfully.');
            await load();
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data || e.message || 'Post failed');
        } finally {
            setPosting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {title}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {String(error)}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {String(success)}
                    </Alert>
                )}

                {canPost && (
                    <Box sx={{ mb: 2 }}>
                        <Stack spacing={1.5}>
                            <TextField
                                label="Write a caption"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                fullWidth
                                multiline
                                minRows={2}
                            />
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<AddPhotoAlternateOutlinedIcon />}
                                >
                                    {file ? 'Change Image' : 'Upload Image'}
                                    <input
                                        hidden
                                        accept="image/*"
                                        type="file"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </Button>
                                <Button variant="contained" onClick={onPost} disabled={posting}>
                                    {posting ? 'Posting...' : 'Post'}
                                </Button>
                            </Stack>
                            {file && (
                                <Typography variant="caption" color="text.secondary">
                                    Selected: {file.name}
                                </Typography>
                            )}
                        </Stack>
                    </Box>
                )}

                {posts.length === 0 ? (
                    <Typography color="text.secondary">No posts yet.</Typography>
                ) : (
                    <Stack spacing={2}>
                        {posts.map((p) => (
                            <Card key={p.id} variant="outlined">
                                <CardContent>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                        <Avatar src={resolveUploadUrl(p.recruiterPhotoUrl) || undefined} />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="subtitle1" noWrap>
                                                {p.companyName || p.recruiterEmail}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                {fmtDate(p.createdAt)}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {!!p.caption && (
                                        <Typography sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                                            {p.caption}
                                        </Typography>
                                    )}

                                    {!!p.imageUrl && (
                                        <Box
                                            component="img"
                                            src={resolveUploadUrl(p.imageUrl)}
                                            alt="post"
                                            sx={{
                                                width: '100%',
                                                maxHeight: 360,
                                                objectFit: 'cover',
                                                borderRadius: 2,
                                                border: '1px solid rgba(15,23,42,0.10)',
                                                mb: 1,
                                            }}
                                        />
                                    )}

                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Button
                                            size="small"
                                            startIcon={p.likedByMe ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
                                            onClick={() => onToggleLike(p.id)}
                                        >
                                            Like ({p.likeCount})
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<ChatBubbleOutlineRoundedIcon />}
                                            onClick={() => onOpenComments(p.id)}
                                        >
                                            Comment ({p.commentCount})
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<ShareOutlinedIcon />}
                                            onClick={() => onShare(p.id)}
                                        >
                                            Share ({p.shareCount})
                                        </Button>
                                    </Stack>

                                    <Collapse in={openCommentsFor === p.id} timeout="auto" unmountOnExit>
                                        <Box sx={{ mt: 1.5 }}>
                                            <Divider sx={{ mb: 1.5 }} />
                                            <Stack spacing={1}>
                                                <TextField
                                                    label="Write a comment"
                                                    value={commentText[p.id] || ''}
                                                    onChange={(e) =>
                                                        setCommentText((prev) => ({ ...prev, [p.id]: e.target.value }))
                                                    }
                                                    fullWidth
                                                    size="small"
                                                />
                                                <Stack direction="row" justifyContent="flex-end">
                                                    <Button size="small" variant="contained" onClick={() => onAddComment(p.id)}>
                                                        Add Comment
                                                    </Button>
                                                </Stack>
                                                {(comments[p.id] || []).length === 0 ? (
                                                    <Typography color="text.secondary">No comments yet.</Typography>
                                                ) : (
                                                    <Stack spacing={1}>
                                                        {(comments[p.id] || []).map((c) => (
                                                            <Box
                                                                key={c.id}
                                                                sx={{
                                                                    border: '1px solid rgba(15,23,42,0.08)',
                                                                    borderRadius: 2,
                                                                    p: 1,
                                                                    background: 'rgba(255,255,255,0.55)',
                                                                }}
                                                            >
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {c.userEmail} · {fmtDate(c.createdAt)}
                                                                </Typography>
                                                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                                                    {c.text}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                )}
                                            </Stack>
                                        </Box>
                                    </Collapse>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
};

export default PostsFeed;
