# Deployment Guide (Vercel + Render + Railway MySQL)

This repo contains:

- Frontend: React (CRA) in `frontend/`
- Backend: Spring Boot (Java 17) in `backend/`
- Database: MySQL (Railway)

## 1) Production Environment Variables

### Backend (Render)

Required:

- `SPRING_PROFILES_ACTIVE=prod`
- `PORT` (Render sets this automatically)
- `DB_URL` (JDBC URL)
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET` (32+ chars)
- `FRONTEND_ORIGIN` (your Vercel URL)
- `CORS_ALLOWED_ORIGINS` (your Vercel URL; comma-separated if multiple)

Optional (Forgot Password / emails):

- `MAIL_REQUIRED=true`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `MAIL_DEBUG=false`

Optional (Admin self-registration gate):

- `ADMIN_REGISTRATION_CODE`

### Frontend (Vercel)

Required:

- `REACT_APP_API_BASE_URL=https://<your-render-service>.onrender.com/api/`

Notes:

- If `REACT_APP_API_BASE_URL` is not set, the frontend defaults to `/api/` for local proxy usage.

## 2) Railway (MySQL)

1. Create a new Railway project.
2. Add a **MySQL** database.
3. Copy the connection values (host, port, database, username, password).
4. Construct your JDBC URL:

```text
jdbc:mysql://<HOST>:<PORT>/<DB>?useSSL=true&serverTimezone=UTC
```

If Railway provides a single connection string, you can still map it to JDBC format.

## 3) Render (Spring Boot Backend)

1. Create a **Web Service** in Render and connect your GitHub repo.
2. Set:
   - Root directory: `backend`
   - Build command: `mvn -DskipTests package`
   - Start command: `java -jar target/backend-0.0.1-SNAPSHOT.jar`
3. Add environment variables (from section 1).

Important:

- Render sets `PORT`. Spring uses `PORT` automatically via `server.port=${PORT:...}`.
- In production, schema is managed by Flyway migrations (`backend/src/main/resources/db/migration`) and Hibernate uses `ddl-auto=validate`.

## 4) Vercel (React Frontend)

1. Import the GitHub repo into Vercel.
2. Set:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `build`
3. Add env var:

```text
REACT_APP_API_BASE_URL=https://<your-render-service>.onrender.com/api/
```

4. Deploy.

SPA routing:

- `frontend/vercel.json` includes a rewrite to `index.html` so React Router routes work on refresh.

## 5) Common Deployment Failures and Fixes

### CORS errors

Symptoms:

- Browser blocks requests to Render API with CORS errors.

Fix:

- Set `CORS_ALLOWED_ORIGINS` on Render to the exact Vercel origin:
  - Example: `https://your-app.vercel.app`
- Ensure you include the scheme (`https://`).
- If you use multiple Vercel domains, separate with commas.

### Database connection issues

Symptoms:

- Backend fails at startup with MySQL connection errors.

Fix:

- Confirm `DB_URL/DB_USERNAME/DB_PASSWORD` are correct.
- If SSL is required, ensure `useSSL=true`.
- If timezone errors appear, keep `serverTimezone=UTC`.

### Build failures (Backend)

Fix:

- Render environment should use Java 17. If needed, set Render’s Java version to 17.
- Build command must run inside `backend/`.

### Build failures (Frontend)

Fix:

- Ensure Node 18+ (recommended Node 20).
- CRA builds need enough memory; if needed, set Vercel build memory settings.

## 6) Final Checklist

- Backend:
  - `JWT_SECRET` set (32+ chars)
  - `DB_URL/DB_USERNAME/DB_PASSWORD` set to Railway
  - `FRONTEND_ORIGIN` and `CORS_ALLOWED_ORIGINS` set to Vercel URL
  - SMTP configured if you want Forgot Password emails
- Frontend:
  - `REACT_APP_API_BASE_URL` points to Render backend `/api/`
- Smoke tests:
  - `GET /api/auth/ping` returns `ok`
  - Register + Login works
  - Upload resume/certificates works (uploads served via backend `/uploads/**`)

