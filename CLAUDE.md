# Vacation Reservation App

Internal leave management tool. Employees request vacation and see their remaining days. Admins approve or reject requests, manage employee and admin accounts, record sick leave, and see a company-wide year calendar. Optional Slack and email (Resend) notifications, plus a daily digest of pending approvals at 08:00 UTC.

This file applies to this repo only. Ignore the SpeedCoach `CLAUDE.md` in the parent folder: its stack, commands and design rules do not apply here.

## Hard rules

- **Never commit, push, create branches, or open PRs.** Do not run `git add`, `git commit`, `git push`, `git rebase`, `git reset`, `git stash`, or `gh pr`. The developer reviews and commits everything. Leave changes in the working tree. Suggesting a commit message is fine when asked.
- Never hardcode secrets. Read them from env vars and keep both `.env.example` files up to date (names and safe defaults only).
- Do not add a dependency without a clear need, and say why in your reply when you do.
- Database changes only through Prisma migrations (`prisma/schema.prisma` + `prisma migrate dev`). Migrations are committed; when a change needs existing rows updated, add the backfill SQL to the generated migration (`migrate dev --create-only`, edit, then apply).
- Keep changes focused on the task. Do not reformat or refactor unrelated code.

## Stack

npm workspaces monorepo, Node 20+.

- `apps/web`: Next.js 14 App Router, React 18, TypeScript strict, Tailwind CSS, Server Components + Server Actions, `next-themes`, `date-fns`, `gsap`, `lucide-react`. Port 3000.
- `apps/api`: NestJS 10, Prisma 5, PostgreSQL 16, JWT (passport-jwt), bcrypt, class-validator DTOs. Port 4000, all routes under `/api`.
- `packages/shared`: TypeScript types shared by web and api (`@vacation/shared`, consumed through a tsconfig path, type-only).

## Structure

```
apps/api/
  prisma/              schema.prisma, seed.ts (migrations/ is gitignored, generated locally)
  src/
    auth/              login, JWT strategy and guard
    users/             employee and admin management (/api/admin/*)
    vacations/         requests, approvals, cancellation, sick leave, calendar, summary, team absences
    holidays/          public holidays and holiday-aware working-day counts
    notifications/     in-app admin notifications, Slack/email, daily digest
    common/            @Roles decorator, RolesGuard, @CurrentUser
    prisma/            PrismaService
apps/web/
  app/                 routes (login, dashboard, vacations, admin/*), actions.ts, error.tsx
  components/          ui/, forms/, calendar/, layout/, dashboard/
  lib/                 api.ts (API client), auth.ts, dates.ts, config.ts, utils.ts
packages/shared/src/   index.ts (all shared types)
docker-compose.yml     postgres only
```

## Commands

Run from the repo root.

```
docker compose up -d                          # postgres on :5432
npm install
cp apps/api/.env.example apps/api/.env        # set JWT_SECRET
cp apps/web/.env.example apps/web/.env.local
npm run prisma:generate -w @vacation/api
npm run prisma:migrate -w @vacation/api       # after any schema change
npm run prisma:seed -w @vacation/api
npm run dev                                   # web :3000 + api :4000

npm run lint                                  # both apps
npm test                                      # api unit + endpoint tests
cd apps/web && npx tsc --noEmit -p .          # web typecheck
cd apps/api && npx tsc --noEmit -p .          # api typecheck (includes tests)
npm run build                                 # shared, api, web
```

Seed logins: `admin@company.com` / `admin1234`, `john.employee@company.com` / `employee1234`.

Before reporting a task as done, run lint, the tests and the relevant typecheck, and fix any failures; don't silence them. `tsc --noEmit` writes `apps/web/tsconfig.tsbuildinfo`, so delete it afterwards. Do not run `npm run build` while `npm run dev` is running, because both write to `.next`.

The developer often has `npm run dev` running already. Check ports 3000 and 4000 before starting another copy. The Next dev server does not reload `tailwind.config.ts`, so after changing it, ask the developer to restart `npm run dev`; until then, new utility classes are missing from the page.

## Backend conventions

- Controllers stay thin: parse input, call a service, return. Logic lives in services.
- Validate every request body with a class-validator DTO. The global `ValidationPipe` runs with `whitelist` and `forbidNonWhitelisted`.
- Protect routes with `JwtAuthGuard`, plus `@Roles('ADMIN')` and `RolesGuard` for admin endpoints. Check ownership in the service, not only the role.
- Throw Nest HTTP exceptions (`BadRequestException`, `NotFoundException`, …) with messages that are safe to show users.
- Dates are calendar days stored as UTC midnight. Build and compare date keys with UTC getters (`getUTCFullYear` etc.) or the helpers in `src/common/dates.ts`.
- Working days (weekdays minus public holidays) are counted once, with `HolidaysService.countWorkingDays`, and stored in `VacationRequest.workingDays` when a request is created. Approval deducts and cancellation refunds that stored number; never recount for those.
- A request is an active absence only when it is `PENDING` or `APPROVED`. `REJECTED` and `CANCELLED` never count toward calendars, overlaps or balances.
- Accounts created or reset by an admin get `mustChangePassword: true`; `POST /auth/change-password` clears it.
- Never expose another employee's absence type or reason to employees (the team endpoint returns names and dates only).
- When you add or change an endpoint, update `packages/shared` types and the README endpoint list.

## Frontend conventions

- Server Components by default. Add `'use client'` only to the smallest leaf that needs state, effects or browser APIs (forms, modals, the year calendar).
- Fetch data on the server through `lib/api.ts`. No client-side data fetching libraries.
- Get the session through `lib/auth.ts`: `requireUser()` or `requireAdmin()` for the user, `requireToken()` for the token. Never use `token!`. `requireUser()` sends users with `mustChangePassword` to `/account/password`; only that page uses `requireSignedIn()`.
- Show `request.workingDays` from the API; only the request form counts days itself (`countWorkingDays` with the holiday list) for its live preview. Use `isActiveAbsence()` and `canCancel()` from `lib/absences.ts` instead of comparing statuses inline.
- `lib/api.ts` throws `ApiError` for failed responses and redirects to `/login` on 401, except in `loginRequest`, which needs to return the 401 as "Invalid credentials".
- Server actions in `app/actions.ts` take `(prevState, formData)` and return `{ success, error }`. Inside `catch`, use `failureState(error, message)`, or `failureWithApiMessage(error, fallback)` when the API's own 4xx message is safe and useful to show. Both turn only `ApiError` into a form message and rethrow everything else, so `redirect()` keeps working. Call `revalidatePath` for every page the change affects.
- Client forms use `useFormState` + `useFormStatus`. Use `useResetOnSuccess(state)` for create forms. Every input needs a label linked with `htmlFor`/`id`.
- Format dates only with `lib/dates.ts` (`formatDate`, `formatDateRange`, `formatLongDate`; UTC-based). Compare calendar days with `toDateKey()` and `localDateKey()`, never by comparing `Date` objects. Don't use `toLocaleDateString()`.
- To make a link look like a button, use `<Link className={buttonStyles('secondary')}>`. Never put `<Button>` inside `<Link>`.
- Don't add a root `loading.tsx`. It turns server-side redirects (307) into browser redirects after a flash of the skeleton.
- Use the color tokens from `globals.css` / `tailwind.config.ts` (`bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`) and support both light and dark themes. Always pair a status color with a text label.
- Accessibility: semantic HTML, real buttons and links, visible focus, 4.5:1 text contrast, touch targets of at least 44px, `aria-current` on the active nav item.

## Testing

- API tests use Jest. Unit tests sit next to each service (`src/**/*.service.spec.ts`); endpoint tests live in `apps/api/test/*.e2e-spec.ts` and boot the real `AppModule` with `configureApp()`, so guards, DTO validation and the `/api` prefix behave as in production.
- Test behavior, not implementation. Every service change gets a unit test; every endpoint gets at least a happy path and a validation-failure test, plus 401/403 where guards apply.
- Never hit a real database or network. Prisma is replaced by `test/prisma-mock.ts` (endpoint tests call `resetPrismaMock()` in `beforeEach`), `fetch` is stubbed to fail in `test/setup-env.ts`, and Slack/Resend settings are blanked there.
- Tests run in `America/Los_Angeles` (set in `test/global-setup.ts`, not `setupFiles`, because Jest sandboxes `process.env` per file). Keep it non-UTC so date bugs surface.
- Build request bodies with `test/fixtures.ts` helpers. Use dates that are meaningful in UTC (e.g. 2026-03-09 is a Monday).
- The web app has no tests yet.

## Code style

- No Prettier config exists. Match the surrounding file: single quotes and semicolons in web, double quotes in api, 2-space indent, lines around 100 characters. Don't run Prettier over whole files.
- Small single-purpose functions, early returns, precise names, no `any`, no dead code.
- The existing code has no comments. Keep it that way unless something truly can't be expressed in code.
- In zsh scripts, don't name a variable `path`: it overwrites `PATH`.

## Working style

- For anything larger than a small fix, outline the plan briefly before writing code.
- When requirements are unclear, ask instead of guessing.
- When done, summarize what changed and which checks you ran, including anything not verified (for example, flows not tested in a browser).
