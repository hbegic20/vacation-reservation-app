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
