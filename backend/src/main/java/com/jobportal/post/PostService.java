package com.jobportal.post;

import com.jobportal.post.dto.CommentResponse;
import com.jobportal.post.dto.PostResponse;
import com.jobportal.recruiter.RecruiterProfileRepository;
import com.jobportal.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class PostService {
    private final RecruiterPostRepository recruiterPostRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final UserRepository userRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;

    @Transactional(readOnly = true)
    public List<PostResponse> feed(Long viewerUserId) {
        var posts = recruiterPostRepository.findTop50ByOrderByCreatedAtDesc();
        var recruiterIds = posts.stream().map(p -> p.getRecruiterUser().getId()).distinct().toList();
        Map<Long, String> companyByUserId =
                recruiterProfileRepository.findByUserIdIn(recruiterIds).stream()
                        .collect(Collectors.toMap(rp -> rp.getUserId(), rp -> rp.getCompanyName()));
        Map<Long, String> photoByUserId =
                recruiterProfileRepository.findByUserIdIn(recruiterIds).stream()
                        .collect(Collectors.toMap(rp -> rp.getUserId(), rp -> rp.getProfilePhotoUrl()));

        return posts.stream()
                .map(
                        p ->
                                PostResponse.builder()
                                        .id(p.getId())
                                        .recruiterUserId(p.getRecruiterUser().getId())
                                        .recruiterEmail(p.getRecruiterUser().getEmail())
                                        .companyName(companyByUserId.getOrDefault(p.getRecruiterUser().getId(), ""))
                                        .recruiterPhotoUrl(photoByUserId.getOrDefault(p.getRecruiterUser().getId(), ""))
                                        .caption(p.getCaption())
                                        .imageUrl(p.getImageUrl())
                                        .likeCount((int) postLikeRepository.countByPostId(p.getId()))
                                        .commentCount((int) postCommentRepository.countByPostId(p.getId()))
                                        .shareCount(p.getShareCount())
                                        .likedByMe(postLikeRepository.existsByPostIdAndUserId(p.getId(), viewerUserId))
                                        .createdAt(p.getCreatedAt())
                                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> recruiterPosts(Long recruiterUserId, Long viewerUserId) {
        var posts = recruiterPostRepository.findTop50ByRecruiterUserIdOrderByCreatedAtDesc(recruiterUserId);
        Map<Long, String> companyByUserId =
                recruiterProfileRepository.findByUserIdIn(List.of(recruiterUserId)).stream()
                        .collect(Collectors.toMap(rp -> rp.getUserId(), rp -> rp.getCompanyName()));
        Map<Long, String> photoByUserId =
                recruiterProfileRepository.findByUserIdIn(List.of(recruiterUserId)).stream()
                        .collect(Collectors.toMap(rp -> rp.getUserId(), rp -> rp.getProfilePhotoUrl()));

        return posts.stream()
                .map(
                        p ->
                                PostResponse.builder()
                                        .id(p.getId())
                                        .recruiterUserId(p.getRecruiterUser().getId())
                                        .recruiterEmail(p.getRecruiterUser().getEmail())
                                        .companyName(companyByUserId.getOrDefault(p.getRecruiterUser().getId(), ""))
                                        .recruiterPhotoUrl(photoByUserId.getOrDefault(p.getRecruiterUser().getId(), ""))
                                        .caption(p.getCaption())
                                        .imageUrl(p.getImageUrl())
                                        .likeCount((int) postLikeRepository.countByPostId(p.getId()))
                                        .commentCount((int) postCommentRepository.countByPostId(p.getId()))
                                        .shareCount(p.getShareCount())
                                        .likedByMe(postLikeRepository.existsByPostIdAndUserId(p.getId(), viewerUserId))
                                        .createdAt(p.getCreatedAt())
                                        .build())
                .toList();
    }

    @Transactional
    public PostResponse createPost(Long recruiterUserId, String caption, String imageUrl) {
        var recruiter =
                userRepository
                        .findById(recruiterUserId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        var post = new RecruiterPost();
        post.setRecruiterUser(recruiter);
        post.setCaption(caption == null ? "" : caption.trim());
        post.setImageUrl(imageUrl == null ? "" : imageUrl.trim());
        recruiterPostRepository.save(post);

        return feed(recruiterUserId).stream()
                .filter(p -> p.getId().equals(post.getId()))
                .findFirst()
                .orElseThrow();
    }

    @Transactional
    public void toggleLike(Long postId, Long userId) {
        var post =
                recruiterPostRepository
                        .findById(postId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        var user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        var existing = postLikeRepository.findByPostIdAndUserId(postId, userId);
        if (existing.isPresent()) {
            postLikeRepository.delete(existing.get());
            return;
        }
        var like = new PostLike();
        like.setPost(post);
        like.setUser(user);
        postLikeRepository.save(like);
    }

    @Transactional
    public CommentResponse addComment(Long postId, Long userId, String text) {
        var post =
                recruiterPostRepository
                        .findById(postId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        var user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        var c = new PostComment();
        c.setPost(post);
        c.setUser(user);
        c.setText(text == null ? "" : text.trim());
        c.setCreatedAt(Instant.now());
        postCommentRepository.save(c);

        return CommentResponse.builder()
                .id(c.getId())
                .userId(userId)
                .userEmail(user.getEmail())
                .text(c.getText())
                .createdAt(c.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> comments(Long postId) {
        // Validate post exists
        recruiterPostRepository
                .findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        return postCommentRepository.findTop20ByPostIdOrderByCreatedAtDesc(postId).stream()
                .map(
                        c ->
                                CommentResponse.builder()
                                        .id(c.getId())
                                        .userId(c.getUser().getId())
                                        .userEmail(c.getUser().getEmail())
                                        .text(c.getText())
                                        .createdAt(c.getCreatedAt())
                                        .build())
                .toList();
    }

    @Transactional
    public void share(Long postId) {
        var post =
                recruiterPostRepository
                        .findById(postId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        post.setShareCount(post.getShareCount() + 1);
        recruiterPostRepository.save(post);
    }
}
