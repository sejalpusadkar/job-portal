package com.jobportal.post;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    long countByPostId(Long postId);

    List<PostComment> findTop20ByPostIdOrderByCreatedAtDesc(Long postId);
}

