package com.jobportal.common;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FileStorageService {
    private static final long MAX_IMAGE_BYTES = 1_500_000; // 1.5 MB
    private static final long MAX_RESUME_BYTES = 4_000_000; // 4.0 MB
    private static final long MAX_JOB_ATTACHMENT_BYTES = 5_000_000; // 5.0 MB
    private static final long MAX_CERTIFICATE_BYTES = 5_000_000; // 5.0 MB

    private static final Set<String> ALLOWED_IMAGE_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");

    private static final Set<String> ALLOWED_JOB_ATTACHMENT_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "application/pdf");

    private static final Set<String> ALLOWED_CERTIFICATE_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "application/pdf");

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    public String storeProfilePhoto(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image must be under 1.5 MB");
        }
        String ct = (file.getContentType() == null) ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_IMAGE_CONTENT_TYPES.contains(ct)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, or WEBP images are allowed");
        }

        String ext =
                switch (ct) {
                    case "image/jpeg" -> "jpg";
                    case "image/png" -> "png";
                    case "image/webp" -> "webp";
                    default -> "bin";
                };

        String filename =
                "candidate_"
                        + userId
                        + "_"
                        + Instant.now().toEpochMilli()
                        + "_"
                        + UUID.randomUUID().toString().substring(0, 8)
                        + "."
                        + ext;

        try {
            Path base = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(base);
            Path target = base.resolve(filename).normalize();
            // Ensure target is still under base directory.
            if (!target.startsWith(base)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store image");
        }

        // Served via WebConfig resource handler.
        return "/uploads/" + filename;
    }

    public String storeCandidateResume(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }
        if (file.getSize() > MAX_RESUME_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume must be under 4 MB");
        }

        String ct = (file.getContentType() == null) ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String original = (file.getOriginalFilename() == null) ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);

        String ext = "";
        if (original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.') + 1).trim();
        }

        boolean allowed =
                ct.equals("application/pdf")
                        || ct.equals("application/msword")
                        || ct.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                        || (ct.isBlank() && (ext.equals("pdf") || ext.equals("doc") || ext.equals("docx")));
        if (!allowed) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Only PDF, DOC, or DOCX resumes are allowed");
        }

        String safeExt =
                switch (ct) {
                    case "application/pdf" -> "pdf";
                    case "application/msword" -> "doc";
                    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> "docx";
                    default -> (ext.isBlank() ? "pdf" : ext);
                };

        String filename =
                "resume_"
                        + userId
                        + "_"
                        + Instant.now().toEpochMilli()
                        + "_"
                        + UUID.randomUUID().toString().substring(0, 8)
                        + "."
                        + safeExt;

        try {
            Path base = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(base);
            Path target = base.resolve(filename).normalize();
            if (!target.startsWith(base)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store resume");
        }

        return "/uploads/" + filename;
    }

    public String storeRecruiterPhoto(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image must be under 1.5 MB");
        }
        String ct = (file.getContentType() == null) ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_IMAGE_CONTENT_TYPES.contains(ct)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, or WEBP images are allowed");
        }

        String ext =
                switch (ct) {
                    case "image/jpeg" -> "jpg";
                    case "image/png" -> "png";
                    case "image/webp" -> "webp";
                    default -> "bin";
                };

        String filename =
                "recruiter_"
                        + userId
                        + "_"
                        + Instant.now().toEpochMilli()
                        + "_"
                        + UUID.randomUUID().toString().substring(0, 8)
                        + "."
                        + ext;

        try {
            Path base = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(base);
            Path target = base.resolve(filename).normalize();
            if (!target.startsWith(base)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store image");
        }

        return "/uploads/" + filename;
    }

    public String storePostImage(Long recruiterUserId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }
        if (file.getSize() > 2_500_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image must be under 2.5 MB");
        }
        String ct = (file.getContentType() == null) ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_IMAGE_CONTENT_TYPES.contains(ct)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, or WEBP images are allowed");
        }

        String ext =
                switch (ct) {
                    case "image/jpeg" -> "jpg";
                    case "image/png" -> "png";
                    case "image/webp" -> "webp";
                    default -> "bin";
                };

        String filename =
                "post_"
                        + recruiterUserId
                        + "_"
                        + Instant.now().toEpochMilli()
                        + "_"
                        + UUID.randomUUID().toString().substring(0, 8)
                        + "."
                        + ext;

        try {
            Path base = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(base);
            Path target = base.resolve(filename).normalize();
            if (!target.startsWith(base)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store image");
        }

        return "/uploads/" + filename;
    }

    // Candidate post images use the same constraints as recruiter post images.
    public String storeCandidatePostImage(Long candidateUserId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }
        if (file.getSize() > 2_500_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image must be under 2.5 MB");
        }
        String ct = (file.getContentType() == null) ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_IMAGE_CONTENT_TYPES.contains(ct)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, or WEBP images are allowed");
        }

        String ext =
                switch (ct) {
                    case "image/jpeg" -> "jpg";
                    case "image/png" -> "png";
                    case "image/webp" -> "webp";
                    default -> "bin";
                };

        String filename =
                "cand_post_"
                        + candidateUserId
                        + "_"
                        + Instant.now().toEpochMilli()
                        + "_"
                        + UUID.randomUUID().toString().substring(0, 8)
                        + "."
                        + ext;

        try {
            Path base = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(base);
            Path target = base.resolve(filename).normalize();
            if (!target.startsWith(base)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store image");
        }

        return "/uploads/" + filename;
    }

    public String storeJobAttachment(Long recruiterUserId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }
        if (file.getSize() > MAX_JOB_ATTACHMENT_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment must be under 5 MB");
        }

        String ct = (file.getContentType() == null) ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String original = (file.getOriginalFilename() == null) ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);

        // Accept common browsers that may omit content-type for PDFs in edge cases.
        String ext = "";
        if (original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.') + 1).trim();
        }

        boolean allowed =
                ALLOWED_JOB_ATTACHMENT_CONTENT_TYPES.contains(ct)
                        || (ct.isBlank() && (ext.equals("pdf") || ext.equals("jpg") || ext.equals("jpeg") || ext.equals("png") || ext.equals("webp")));
        if (!allowed) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Only PDF or image attachments (JPG, PNG, WEBP) are allowed");
        }

        String safeExt =
                switch (ct) {
                    case "application/pdf" -> "pdf";
                    case "image/jpeg" -> "jpg";
                    case "image/png" -> "png";
                    case "image/webp" -> "webp";
                    default -> (ext.isBlank() ? "pdf" : ext);
                };

        String filename =
                "job_attach_"
                        + recruiterUserId
                        + "_"
                        + Instant.now().toEpochMilli()
                        + "_"
                        + UUID.randomUUID().toString().substring(0, 8)
                        + "."
                        + safeExt;

        try {
            Path base = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(base);
            Path target = base.resolve(filename).normalize();
            if (!target.startsWith(base)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store attachment");
        }

        return "/uploads/" + filename;
    }

    public StoredUpload storeCandidateCertificate(Long candidateUserId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }
        if (file.getSize() > MAX_CERTIFICATE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Certificate must be under 5 MB");
        }

        String ct = (file.getContentType() == null) ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String original = (file.getOriginalFilename() == null) ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);

        String ext = "";
        if (original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.') + 1).trim();
        }

        boolean allowed =
                ALLOWED_CERTIFICATE_CONTENT_TYPES.contains(ct)
                        || (ct.isBlank() && (ext.equals("pdf") || ext.equals("jpg") || ext.equals("jpeg") || ext.equals("png") || ext.equals("webp")));
        if (!allowed) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Only PDF or image certificates (JPG, PNG, WEBP) are allowed");
        }

        String safeExt =
                switch (ct) {
                    case "application/pdf" -> "pdf";
                    case "image/jpeg" -> "jpg";
                    case "image/png" -> "png";
                    case "image/webp" -> "webp";
                    default -> (ext.isBlank() ? "pdf" : ext);
                };

        String filename =
                "cert_"
                        + candidateUserId
                        + "_"
                        + Instant.now().toEpochMilli()
                        + "_"
                        + UUID.randomUUID().toString().substring(0, 8)
                        + "."
                        + safeExt;

        try {
            Path base = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(base);
            Path target = base.resolve(filename).normalize();
            if (!target.startsWith(base)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store certificate");
        }

        return new StoredUpload("/uploads/" + filename, filename);
    }

    public void deleteUploadByUrl(String url) {
        String u = (url == null) ? "" : url.trim();
        if (u.isBlank()) return;
        if (!u.startsWith("/uploads/")) return;

        String filename = u.substring("/uploads/".length());
        if (filename.isBlank()) return;

        try {
            Path base = Path.of(uploadDir).toAbsolutePath().normalize();
            Path target = base.resolve(filename).normalize();
            if (!target.startsWith(base)) return;
            Files.deleteIfExists(target);
        } catch (Exception ignored) {
            // Best-effort cleanup. DB remains the source of truth.
        }
    }

    public record StoredUpload(String url, String storedName) {}
}
