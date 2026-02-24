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
- In-app admin notification center on dashboard
- Optional Email/Slack notifications for request submit/approve/reject/sick leave
- Daily digest notification for pending approvals (8:00 UTC)

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
- `POST /api/vacations`
- `GET /api/vacations`
- `GET /api/vacations/approved`
- `GET /api/vacations/summary`
- `PATCH /api/vacations/:id/approve`
- `PATCH /api/vacations/:id/reject`
- `GET /api/vacations/calendar?year=2026`
- `POST /api/vacations/sick`
- `GET /api/notifications/admin`
- `GET /api/notifications/admin/unread-count`
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

Notification integrations are optional. Set Slack and/or email provider values in `apps/api/.env` to enable external delivery.
Supported external notification env vars:
- `SLACK_WEBHOOK_URL` for Slack channel posts
- `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` for email delivery via Resend

### 4. Generate Prisma client and run migrations
```bash
npm run prisma:generate -w @vacation/api
npm run prisma:migrate -w @vacation/api
```
This revision adds new columns/enums (`firstName`, `lastName`, `department`, `isActive`, `absenceType`), so run migrations after pulling latest code.

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
- Add unit/integration tests for services and guards
- Add request rate limiting and structured logging
- Add CI/CD pipeline and migration gating
