import {
  AbsenceType,
  User,
  UserRole,
  VacationRequest,
  VacationStatus,
} from "@prisma/client";

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "employee-1",
    email: "john.employee@company.com",
    password: "hashed-password",
    role: UserRole.EMPLOYEE,
    firstName: "John",
    lastName: "Employee",
    department: "Engineering",
    isActive: true,
    mustChangePassword: false,
    vacationDaysTotal: 25,
    vacationDaysUsed: 8,
    createdAt: new Date("2026-01-05T09:00:00.000Z"),
    updatedAt: new Date("2026-01-05T09:00:00.000Z"),
    ...overrides,
  };
}

export function buildRequest(
  overrides: Partial<VacationRequest> = {},
): VacationRequest {
  return {
    id: "request-1",
    userId: "employee-1",
    startDate: new Date("2026-03-09T00:00:00.000Z"),
    endDate: new Date("2026-03-13T00:00:00.000Z"),
    reason: "Family trip",
    workingDays: 5,
    coverUserId: null,
    reminderSentAt: null,
    absenceType: AbsenceType.VACATION,
    status: VacationStatus.PENDING,
    adminComment: null,
    createdAt: new Date("2026-02-01T09:00:00.000Z"),
    updatedAt: new Date("2026-02-01T09:00:00.000Z"),
    ...overrides,
  };
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    department: user.department,
  };
}
