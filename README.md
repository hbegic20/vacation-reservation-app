# Company Vacation Reservation App

Production-oriented monorepo for company leave management with a split architecture:
- `apps/web`: Next.js 14 App Router frontend
- `apps/api`: NestJS REST API
- `packages/shared`: shared TypeScript contracts

## Tech Stack
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Server Components, Server Actions, GSAP, next-themes
- Backend: NestJS, Prisma ORM, PostgreSQL, JWT Auth, RBAC
- Shared: typed interfaces consumed by frontend/backend

## Features
- JWT login/logout
- Role-based access (`ADMIN`, `EMPLOYEE`)
- Employee vacation request creation
- Employee remaining vacation days and request history
- Admin approval/rejection with comments
- Admin employee account creation (email + temporary password)
- Admin employee profile edit and password reset
- Admin sick leave entry (company calendar control)
- Admin management (add additional admins)
- Admin employee utilization listing
- Company-wide full-year vacation calendar with date hover details
- Click-on-date side panel with full day request history
- In-app notifications for everyone (bell with unread count, `/notifications` page): admins hear about new requests and cancellations, employees about decisions
- Optional Email/Slack notifications for request submit/approve/reject/sick leave
- Daily digest notification for pending approvals (8:00 UTC)
- Employees can cancel pending requests and approved time off that hasn't started (days are returned)
- Employees get an in-app notification and an email when a request is approved, rejected or recorded as sick leave
- Public holidays managed by admins; they don't count as working days
- "Out on your team this week" and a `/team` month calendar for employees (same department, names and dates only)
- Bridge-day suggestions: "Take 1 day, get 4 days off" around public holidays, one click pre-fills the request form
- Optional cover colleague on requests; they're notified when the request is approved
- Reminder the day before approved vacation starts (in-app and email, from 07:00 UTC)
- Document library: admins upload PDFs, images, Word and Excel files (stored in Postgres), preview them, and publish them to an employee feed; employees are notified on first publication
- Temporary passwords: users must choose their own password on first sign-in or after a reset

## Key Frontend Routes
- `/login`
- `/dashboard`
- `/vacations`
- `/vacations/request`
- `/admin`
- `/admin/requests`
- `/admin/employees`
- `/admin/employees/new`
- `/admin/employees/[id]/edit`
- `/admin/calendar`
- `/admin/admins`
- `/admin/holidays`
- `/account/password`
- `/notifications`
- `/team`
- `/documents` and `/admin/documents`
- Light/dark theme + subtle UI animations

## Project Structure
```txt
.
├── apps
│   ├── api
│   │   ├── prisma
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src
│   │       ├── auth
│   │       ├── common
│   │       ├── prisma
│   │       ├── users
│   │       └── vacations
│   └── web
│       ├── app
│       │   ├── login
│       │   ├── dashboard
│       │   ├── vacations
│       │   └── admin
│       ├── components
│       └── lib
└── packages
    └── shared
```

## API Endpoints
All routes are prefixed with `/api` by Nest.

- `GET /api/health` (public, no database query; used by Render and the keep-alive ping)
- `POST /api/auth/login`
- `GET /api/me`
- `POST /api/auth/change-password`
- `POST /api/vacations`
- `GET /api/vacations`
- `GET /api/vacations/approved` (admin only)
- `GET /api/vacations/summary`
- `GET /api/vacations/team?from=2026-03-09&to=2026-03-15` (same-department colleagues, names and dates only)
- `PATCH /api/vacations/:id/cancel` (employee, own requests)
- `GET /api/vacations/suggestions` (employee: bridge-day suggestions around public holidays)
- `GET /api/vacations/team/members` (employee: same-department colleagues who can cover)
- `PATCH /api/vacations/:id/approve`
- `PATCH /api/vacations/:id/reject`
- `GET /api/vacations/calendar?year=2026`
- `POST /api/vacations/sick`
- `GET /api/documents` (admins: all; employees: published only)
- `POST /api/documents` (admin, multipart `file` + `title` + optional `description`, max 10 MB)
- `GET /api/documents/:id/file?download=1` (employees only published files)
- `PATCH /api/documents/:id` (admin: title, description, `isPublished`)
- `DELETE /api/documents/:id` (admin)
- `GET /api/holidays?year=2026`
- `POST /api/holidays` (admin only)
- `DELETE /api/holidays/:id` (admin only)
- `GET /api/notifications?unreadOnly=true` (signed-in user's own)
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `POST /api/admin/employees`
- `GET /api/admin/employees`
- `GET /api/admin/employees/:id`
- `PATCH /api/admin/employees/:id`
- `PATCH /api/admin/employees/:id/reset-password`
- `POST /api/admin/admins`
- `GET /api/admin/admins`

## Setup
### 1. Install dependencies
```bash
npm install
```

### 2. Start PostgreSQL
Option A: local PostgreSQL

Option B: Docker
```bash
docker compose up -d
```

### 3. Configure environment files
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Email and Slack are optional; in-app notifications always work. Settings in `apps/api/.env`:
- `EMAIL_PROVIDER=smtp` with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` for any SMTP server. The defaults in `.env.example` point at Mailpit from Docker Compose: every email the app sends shows up at http://localhost:8025 and nothing leaves your machine.
- `EMAIL_PROVIDER=resend` with `RESEND_API_KEY` and `EMAIL_FROM` for delivery through Resend (requires a verified sending domain).
- `SLACK_WEBHOOK_URL` for Slack channel posts about admin notifications.

The API reads `.env` only when it starts, so restart `npm run dev` after changing it.

### 4. Generate Prisma client and run migrations
```bash
npm run prisma:generate -w @vacation/api
npm run prisma:migrate -w @vacation/api
```
Migrations are committed in `apps/api/prisma/migrations`; run this after pulling to apply new ones.

### 5. Seed sample data
```bash
npm run prisma:seed -w @vacation/api
```

### 6. Run both apps
```bash
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`

## Tests
```bash
npm test
```
Runs the API unit tests (services) and endpoint tests (controllers, guards and validation) with Jest. They use a mocked Prisma client and never touch a database or the network.

## Seed Credentials
- Admin: `admin@company.com` / `admin1234`
- Admin 2: `operations.admin@company.com` / `admin1234`
- Employee: `john.employee@company.com` / `employee1234`

## Deployment (free tier)
Web on Vercel (Hobby), API on Render (free web service), PostgreSQL on Neon (free), optional email through Resend (free). Pick Frankfurt / `eu-central-1` everywhere so the three services sit close to each other; `apps/web/vercel.json` pins the web functions to `fra1` and `render.yaml` puts the API in `frankfurt`.

Limits to know before you start:
- Render free services sleep after about 15 minutes without traffic, and the first request after that takes 30 to 60 seconds. The daily digest and leave reminders run inside the API, so they only fire while it is awake. Step 5 keeps it awake.
- Render gives 750 free hours per workspace per month, enough for one always-on service and no more.
- Neon free has about 0.5 GB of storage. Uploaded documents are stored in Postgres, so they count toward it.
- Vercel Hobby is meant for non-commercial use.

### 1. Database (Neon)
1. Create a project at https://neon.tech in the `AWS eu-central-1` region.
2. Copy the **direct** connection string (Connection pooling switched off; the host has no `-pooler`). `prisma migrate deploy` does not work through the pooler. Add `?sslmode=require` if it is missing.

### 2. API (Render)
1. Push the repo to GitHub, then in Render choose **New > Blueprint** and select the repo. Render reads `render.yaml`.
2. Fill in the prompted values:
   - `DATABASE_URL`: the Neon direct connection string.
   - `EMAIL_FROM`, `RESEND_API_KEY`, `SLACK_WEBHOOK_URL`: leave empty for now, or see step 6.
   - `JWT_SECRET` is generated by Render.
3. Each deploy installs dependencies, generates the Prisma client, builds the API and applies migrations with `prisma migrate deploy`. A failed migration stops the deploy.
4. Check `https://<your-service>.onrender.com/api/health` returns `{"status":"ok"}`.

### 3. First admin account
Run the seed once from your machine against Neon:
```bash
DATABASE_URL="<neon direct connection string>" npm run prisma:seed -w @vacation/api
```
The seed uses the public passwords from [Seed Credentials](#seed-credentials). Straight after deploying, sign in as both seeded admins, change their passwords, and deactivate the demo employee.

### 4. Web (Vercel)
1. In Vercel choose **Add New > Project**, import the repo and set **Root Directory** to `apps/web`. The framework is detected as Next.js; keep the default build settings.
2. Add the environment variable `API_URL=https://<your-service>.onrender.com/api`.
3. Deploy. The API is only called from the Next.js server, so no CORS or public API variable is needed.

### 5. Keep the API awake
Create a free job at https://cron-job.org (or an UptimeRobot monitor) that sends `GET https://<your-service>.onrender.com/api/health` every 10 minutes. The endpoint never touches the database, so Neon can still scale to zero between the API's own scheduled checks.

### 6. Email and Slack (optional)
- Resend: verify a domain at https://resend.com, create an API key, then set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` and `EMAIL_FROM` (an address on the verified domain) in the Render service's environment. Render restarts the API on save.
- Without a domain, keep `EMAIL_PROVIDER` empty. In-app notifications still work.
- Slack: set `SLACK_WEBHOOK_URL` to an incoming webhook URL.

## Implementation Notes
- Controllers are kept thin; services contain business logic.
- DTO validation is enforced globally through Nest `ValidationPipe`.
- Role checks use custom `@Roles` decorator + `RolesGuard`.
- Frontend auth state is stored in an `httpOnly` cookie (`access_token`).
- Server Actions are used for login, logout, vacation request submission, and approval/rejection actions.

## Production Hardening Checklist
- Rotate `JWT_SECRET` and store in secret manager
- Add refresh-token flow and token revocation strategy
- Add web tests and run tests in CI
- Add request rate limiting and structured logging
- Add CI/CD pipeline and migration gating
