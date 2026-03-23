-- Simple social posts for recruiters, with likes/comments/shares by any authenticated user.

CREATE TABLE recruiter_posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    recruiter_user_id BIGINT NOT NULL,
    caption VARCHAR(2000) NOT NULL DEFAULT '',
    image_url VARCHAR(512) NOT NULL DEFAULT '',
    share_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_posts_recruiter_user FOREIGN KEY (recruiter_user_id) REFERENCES users(id)
);

CREATE TABLE post_likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id) REFERENCES recruiter_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_post_like_post_user UNIQUE (post_id, user_id)
);

CREATE TABLE post_comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    text VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_comments_post FOREIGN KEY (post_id) REFERENCES recruiter_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

