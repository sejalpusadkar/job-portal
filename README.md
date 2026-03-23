# IT Job Portal (Smart Skill and Keyword Matching)

Monorepo layout:

- `frontend/` React (HTML/CSS/JS + React)
- `backend/` Java 17 + Spring Boot REST API
- `database/` (optional) SQL/scripts place

## 0) Production-Ready Run (Docker)

Prereqs: Docker Desktop installed.

From the project root:

```bash
cp .env.example .env
# Edit .env and set JWT_SECRET (32+ chars) and SMTP_* (required for password reset emails)
docker compose up --build
```

Open:

- Frontend: `http://localhost:3000`
- Backend ping: `http://localhost:8081/api/auth/ping`

Notes:

- MySQL root password is **root123** (as requested).
- For production you MUST change `JWT_SECRET` in `docker-compose.yml` (32+ chars).
- Database schema is created by Flyway migrations in `backend/src/main/resources/db/migration`.

## 1) Prerequisites

Install:

- Java **17** (required)
- Maven 3.x
- Node.js + npm
- MySQL (or Oracle, but this project is currently configured for MySQL)

Verify Java 17 is available:

```bash
/usr/libexec/java_home -V
```

If your system default Java is NOT 17, run backend commands with:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

## 2) Database Setup (MySQL)

1. Open MySQL Workbench.
2. Create a database:

```sql
CREATE DATABASE job_portal_db;
```

3. Update backend DB config if needed:

- `backend/src/main/resources/application.properties`
  - `spring.datasource.username`
  - `spring.datasource.password`

## 3) Backend (Spring Boot)

From the project root:

```bash
cd backend
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
mvn -Dmaven.repo.local=$PWD/.m2/repository package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Backend runs on:

- `http://localhost:8081`
- API base: `http://localhost:8081/api`

### If Registration/Login Fails

Usually it means the backend is not running or cannot connect to MySQL.

1. Start MySQL server in MySQL Workbench.
2. Ensure database exists:

```sql
CREATE DATABASE job_portal_db;
```

3. Confirm credentials in:
`backend/src/main/resources/application.properties`

### Dev Profile (No MySQL)

For quick local testing you can run with H2 in-memory DB:

```bash
cd backend
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
mvn -Dmaven.repo.local=$PWD/.m2/repository package -DskipTests
SPRING_PROFILES_ACTIVE=dev java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Admin Registration Code (for Admin self-registration)

For safety, Admin registration is gated by a code.

Set an environment variable before running the backend:

```bash
export ADMIN_REGISTRATION_CODE=MY_SECRET_ADMIN_CODE
```

Then register as role `ADMIN` from the UI.

### Email Notifications (Optional)

Recruiter email notifications will be skipped unless SMTP is configured.

Set environment variables (example):

```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USERNAME=you@gmail.com
export SMTP_PASSWORD=your_app_password
```

## 4) Frontend (React)

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

- `http://localhost:3000`

If backend runs elsewhere, set:

```bash
export REACT_APP_API_BASE_URL=http://localhost:8081/api
```

## 5) Role Workflows

### Candidate

- Login/Register as `CANDIDATE`
- Update profile (skills, experience, education, keywords)
- View matched jobs (skill and keyword matching)
- Apply in 1 click
- Track application status: `APPLIED`, `SHORTLISTED`, `REJECTED`

### Recruiter

- Register as `RECRUITER`
- Recruiter features are blocked until Admin approval
- After approval:
  - Create/manage job postings (skills required, keywords, experience)
  - View matched candidates
  - Shortlist/Reject applications
  - Send email notifications (if SMTP configured)

### Admin

- Register as `ADMIN` (requires `ADMIN_REGISTRATION_CODE`)
- Approve/Reject recruiter registrations
- Disable users
- Monitor basic metrics (users/jobs/applications)

## 6) API Testing (Postman)

Base URL: `http://localhost:8081/api`

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- Candidate:
  - `GET /candidate/profile`
  - `PUT /candidate/profile`
  - `GET /candidate/matched-jobs`
  - `POST /candidate/apply/{jobId}`
  - `GET /candidate/applications`
- Recruiter:
  - `GET /recruiter/jobs`
  - `POST /recruiter/jobs`
  - `GET /recruiter/jobs/{jobId}/matched-candidates`
  - `GET /recruiter/jobs/{jobId}/applications`
  - `PUT /recruiter/applications/{applicationId}/status`
  - `POST /recruiter/applications/{applicationId}/email`
- Admin:
  - `GET /admin/metrics`
  - `GET /admin/recruiters/pending`
  - `POST /admin/recruiters/{userId}/approve`
  - `POST /admin/recruiters/{userId}/reject`
  - `GET /admin/users`
  - `DELETE /admin/users/{userId}`
