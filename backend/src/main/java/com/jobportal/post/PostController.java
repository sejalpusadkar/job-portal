package com.jobportal.post;

import com.jobportal.post.dto.CreateCommentRequest;
import com.jobportal.post.dto.CommentResponse;
import com.jobportal.post.dto.PostResponse;
import com.jobportal.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;

    @GetMapping
    public List<PostResponse> feed(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return postService.feed(userId);
    }

    @PostMapping("/{postId}/like")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggleLike(Authentication auth, @PathVariable Long postId) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        postService.toggleLike(postId, userId);
    }

    @GetMapping("/{postId}/comments")
    public List<CommentResponse> comments(@PathVariable Long postId) {
        return postService.comments(postId);
    }

    @PostMapping("/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse comment(Authentication auth, @PathVariable Long postId, @Valid @RequestBody CreateCommentRequest req) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return postService.addComment(postId, userId, req.getText());
    }

    @PostMapping("/{postId}/share")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void share(@PathVariable Long postId) {
        postService.share(postId);
    }
}

