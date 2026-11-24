import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AbsenceType,
  NotificationType,
  UserRole,
  VacationStatus,
} from "@prisma/client";
import { RequestUser } from "../auth/types";
import {
  addDays,
  formatDateRange,
  startOfUtcDay,
  toDateKey,
} from "../common/dates";
import { suggestBridgeDays } from "./bridge-days";
import { HolidaysService } from "../holidays/holidays.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSickLeaveDto } from "./dto/create-sick-leave.dto";
import { CreateVacationRequestDto } from "./dto/create-vacation-request.dto";

const maxTeamRangeInDays = 62;
const suggestionLimit = 3;
const suggestionHorizonInDays = 365;

const personSummary = {
  select: { id: true, firstName: true, lastName: true },
} as const;

const requestPeople = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      department: true,
    },
  },
  coverUser: personSummary,
} as const;

@Injectable()
export class VacationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly holidaysService: HolidaysService,
  ) {}

  private async notifyEmployeeOfOutcome(
    request: { id: string; userId: string; startDate: Date; endDate: Date },
    type: NotificationType,
    title: string,
    outcome: string,
    adminComment: string | null,
  ) {
    const range = formatDateRange(request.startDate, request.endDate);
    const comment = adminComment ? ` Admin comment: "${adminComment}"` : "";
    await this.notificationsService.notifyEmployee(request.userId, {
      type,
      title,
      message: `Your time off ${range} ${outcome}.${comment}`,
      metadata: { requestId: request.id },
    });
  }

  private async ensureNoOverlap(range: {
    userId: string;
    startDate: Date;
    endDate: Date;
    statuses: VacationStatus[];
    absenceType?: AbsenceType;
    excludeRequestId?: string;
  }) {
    const overlapping = await this.prisma.vacationRequest.findFirst({
      where: {
        userId: range.userId,
        status: { in: range.statuses },
        startDate: { lte: startOfUtcDay(range.endDate) },
        endDate: { gte: startOfUtcDay(range.startDate) },
        ...(range.absenceType ? { absenceType: range.absenceType } : {}),
        ...(range.excludeRequestId
          ? { id: { not: range.excludeRequestId } }
          : {}),
      },
      orderBy: { startDate: "asc" },
    });
    if (!overlapping) {
      return;
    }

    const kind =
      overlapping.absenceType === AbsenceType.SICK
        ? "sick leave"
        : overlapping.status === VacationStatus.PENDING
          ? "a pending request"
          : "approved time off";
    throw new ConflictException(
      `These dates overlap ${kind} from ${formatDateRange(overlapping.startDate, overlapping.endDate)}.`,
    );
  }

  private async resolveCover(
    requester: { id: string; department: string | null },
    coverUserId: string,
  ): Promise<string> {
    const cover = requester.department
      ? await this.prisma.user.findFirst({
          where: {
            id: coverUserId,
            role: UserRole.EMPLOYEE,
            isActive: true,
            department: requester.department,
            NOT: { id: requester.id },
          },
          select: { id: true },
        })
      : null;
    if (!cover) {
      throw new BadRequestException(
        "Choose an active colleague from your department as cover",
      );
    }
    return cover.id;
  }

  private async notifyCover(request: {
    id: string;
    startDate: Date;
    endDate: Date;
    coverUserId: string | null;
    user: { firstName: string; lastName: string };
  }) {
    if (!request.coverUserId) {
      return;
    }
    const name = `${request.user.firstName} ${request.user.lastName}`;
    await this.notificationsService.notifyEmployee(request.coverUserId, {
      type: NotificationType.COVER_ASSIGNED,
      title: `You're covering for ${name}`,
      message: `${name} is away ${formatDateRange(request.startDate, request.endDate)} and named you as cover. Check in with them about open work before they leave.`,
      metadata: { requestId: request.id },
    });
  }

  async listTeamMembers(user: RequestUser) {
    const member = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { department: true },
    });
    if (!member?.department) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        role: UserRole.EMPLOYEE,
        isActive: true,
        department: member.department,
        NOT: { id: user.id },
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
  }

  async suggestBridgeDays(user: RequestUser, today: Date = new Date()) {
    const firstDay = addDays(toDateKey(today), 1);
    const lastDay = addDays(firstDay, suggestionHorizonInDays);
    const [employee, holidays, booked] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: { vacationDaysTotal: true, vacationDaysUsed: true },
      }),
      this.prisma.publicHoliday.findMany({
        where: {
          date: {
            gte: new Date(`${addDays(firstDay, -14)}T00:00:00.000Z`),
            lte: new Date(`${addDays(lastDay, 14)}T00:00:00.000Z`),
          },
        },
        select: { date: true, name: true },
      }),
      this.prisma.vacationRequest.findMany({
        where: {
          userId: user.id,
          status: { in: [VacationStatus.PENDING, VacationStatus.APPROVED] },
          endDate: { gte: new Date(`${firstDay}T00:00:00.000Z`) },
        },
        select: { startDate: true, endDate: true },
      }),
    ]);
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    const blockedDays = new Set<string>();
    for (const request of booked) {
      for (
        let key = toDateKey(request.startDate);
        key <= toDateKey(request.endDate);
        key = addDays(key, 1)
      ) {
        blockedDays.add(key);
      }
    }

    return suggestBridgeDays({
      firstDay,
      lastDay,
      holidays: new Map(
        holidays.map((holiday) => [toDateKey(holiday.date), holiday.name]),
      ),
      blockedDays,
      availableDays: employee.vacationDaysTotal - employee.vacationDaysUsed,
      limit: suggestionLimit,
    });
  }

  async createRequest(user: RequestUser, dto: CreateVacationRequestDto) {
    const requestedDays = await this.holidaysService.countWorkingDays(
      dto.startDate,
      dto.endDate,
    );
    if (requestedDays <= 0) {
      throw new BadRequestException(
        "Vacation must include at least one business day",
      );
    }

    const employee = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    const remainingDays =
      employee.vacationDaysTotal - employee.vacationDaysUsed;
    if (requestedDays > remainingDays) {
      throw new BadRequestException("Not enough remaining vacation days");
    }

    await this.ensureNoOverlap({
      userId: user.id,
      startDate: dto.startDate,
      endDate: dto.endDate,
      statuses: [VacationStatus.PENDING, VacationStatus.APPROVED],
    });

    const coverUserId = dto.coverUserId
      ? await this.resolveCover(employee, dto.coverUserId)
      : null;

    const request = await this.prisma.vacationRequest.create({
      data: {
        userId: user.id,
        startDate: dto.startDate,
        endDate: dto.endDate,
        reason: dto.reason,
        workingDays: requestedDays,
        coverUserId,
        absenceType: AbsenceType.VACATION,
        status: VacationStatus.PENDING,
      },
      include: requestPeople,
    });

    await this.notificationsService.createAndDispatch({
      type: "VACATION_REQUEST_SUBMITTED",
      title: "New vacation request submitted",
      message: `${request.user.firstName} ${request.user.lastName} requested vacation (${request.startDate.toISOString().slice(0, 10)} to ${request.endDate.toISOString().slice(0, 10)}).`,
      metadata: {
        requestId: request.id,
        userId: request.userId,
        absenceType: request.absenceType,
      },
    });

    return request;
  }

  async createSickLeave(dto: CreateSickLeaveDto) {
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException(
        "endDate must be greater than or equal to startDate",
      );
    }

    const employee = await this.prisma.user.findFirst({
      where: {
        id: dto.userId,
        role: UserRole.EMPLOYEE,
      },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    await this.ensureNoOverlap({
      userId: dto.userId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      statuses: [VacationStatus.APPROVED],
      absenceType: AbsenceType.SICK,
    });

    const sickEntry = await this.prisma.vacationRequest.create({
      data: {
        userId: dto.userId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        reason: dto.reason,
        workingDays: await this.holidaysService.countWorkingDays(
          dto.startDate,
          dto.endDate,
        ),
        absenceType: AbsenceType.SICK,
        status: VacationStatus.APPROVED,
        adminComment: dto.adminComment ?? "Marked as sick leave by admin",
      },
      include: requestPeople,
    });

    await this.notificationsService.createAndDispatch({
      type: "SICK_LEAVE_ADDED",
      title: "Sick leave added",
      message: `${sickEntry.user.firstName} ${sickEntry.user.lastName} was marked sick (${sickEntry.startDate.toISOString().slice(0, 10)} to ${sickEntry.endDate.toISOString().slice(0, 10)}).`,
      metadata: {
        requestId: sickEntry.id,
        userId: sickEntry.userId,
        absenceType: sickEntry.absenceType,
      },
    });

    await this.notifyEmployeeOfOutcome(
      sickEntry,
      NotificationType.SICK_LEAVE_ADDED,
      "Sick leave recorded",
      "was recorded as sick leave",
      sickEntry.adminComment,
    );

    return sickEntry;
  }

  listForEmployee(userId: string) {
    return this.prisma.vacationRequest.findMany({
      where: { userId },
      include: requestPeople,
      orderBy: { createdAt: "desc" },
    });
  }

  listAll() {
    return this.prisma.vacationRequest.findMany({
      include: requestPeople,
      orderBy: { createdAt: "desc" },
    });
  }

  listApproved() {
    return this.prisma.vacationRequest.findMany({
      where: { status: VacationStatus.APPROVED },
      include: requestPeople,
      orderBy: { startDate: "asc" },
    });
  }

  async approve(requestId: string, adminComment?: string) {
    const request = await this.prisma.vacationRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException("Vacation request not found");
    }

    if (request.status !== VacationStatus.PENDING) {
      throw new BadRequestException("Only pending requests can be approved");
    }

    await this.ensureNoOverlap({
      userId: request.userId,
      startDate: request.startDate,
      endDate: request.endDate,
      statuses: [VacationStatus.APPROVED],
      excludeRequestId: request.id,
    });

    if (request.absenceType === AbsenceType.SICK) {
      const approvedSick = await this.prisma.vacationRequest.update({
        where: { id: requestId },
        data: {
          status: VacationStatus.APPROVED,
          adminComment: adminComment ?? null,
        },
      });

      await this.notificationsService.createAndDispatch({
        type: "VACATION_APPROVED",
        title: "Request approved",
        message: `${request.user.firstName} ${request.user.lastName}'s request was approved.`,
        metadata: { requestId: approvedSick.id, userId: approvedSick.userId },
      });

      await this.notifyEmployeeOfOutcome(
        approvedSick,
        NotificationType.VACATION_APPROVED,
        "Request approved",
        "was approved",
        approvedSick.adminComment,
      );

      return approvedSick;
    }

    const requestedDays = request.workingDays;
    const remainingDays =
      request.user.vacationDaysTotal - request.user.vacationDaysUsed;
    if (requestedDays > remainingDays) {
      throw new BadRequestException(
        "Employee does not have enough vacation days",
      );
    }

    const approvedVacation = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: request.userId },
        data: {
          vacationDaysUsed: {
            increment: requestedDays,
          },
        },
      });

      return tx.vacationRequest.update({
        where: { id: requestId },
        data: {
          status: VacationStatus.APPROVED,
          adminComment: adminComment ?? null,
        },
        include: requestPeople,
      });
    });

    await this.notificationsService.createAndDispatch({
      type: "VACATION_APPROVED",
      title: "Request approved",
      message: `${request.user.firstName} ${request.user.lastName}'s vacation was approved.`,
      metadata: {
        requestId: approvedVacation.id,
        userId: approvedVacation.userId,
      },
    });

    await this.notifyCover(approvedVacation);

    await this.notifyEmployeeOfOutcome(
      approvedVacation,
      NotificationType.VACATION_APPROVED,
      "Vacation approved",
      "was approved",
      approvedVacation.adminComment,
    );

    return approvedVacation;
  }

  async reject(requestId: string, adminComment?: string) {
    const request = await this.prisma.vacationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException("Vacation request not found");
    }

    if (request.status !== VacationStatus.PENDING) {
      throw new BadRequestException("Only pending requests can be rejected");
    }

    const rejected = await this.prisma.vacationRequest.update({
      where: { id: requestId },
      data: {
        status: VacationStatus.REJECTED,
        adminComment: adminComment ?? null,
      },
      include: requestPeople,
    });

    const requestUser = await this.prisma.user.findUnique({
      where: { id: rejected.userId },
      select: { firstName: true, lastName: true },
    });

    await this.notificationsService.createAndDispatch({
      type: "VACATION_REJECTED",
      title: "Request rejected",
      message: `${requestUser?.firstName ?? "Employee"} ${requestUser?.lastName ?? ""}'s request was rejected.`,
      metadata: { requestId: rejected.id, userId: rejected.userId },
    });

    await this.notifyEmployeeOfOutcome(
      rejected,
      NotificationType.VACATION_REJECTED,
      "Vacation request rejected",
      "was rejected",
      rejected.adminComment,
    );

    return rejected;
  }

  async getSummary(user: RequestUser) {
    if (user.role === "ADMIN") {
      const [pendingApprovals, approvedRequests, employees] = await Promise.all(
        [
          this.prisma.vacationRequest.count({
            where: { status: VacationStatus.PENDING },
          }),
          this.prisma.vacationRequest.count({
            where: { status: VacationStatus.APPROVED },
          }),
          this.prisma.user.count({
            where: { role: UserRole.EMPLOYEE },
          }),
        ],
      );

      return {
        pendingApprovals,
        approvedRequests,
        employees,
      };
    }

    const employee = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!employee) {
      throw new ForbiddenException("Employee not found");
    }

    const upcomingVacations = await this.prisma.vacationRequest.findMany({
      where: {
        userId: user.id,
        status: VacationStatus.APPROVED,
        startDate: { gte: new Date() },
      },
      include: requestPeople,
      orderBy: { startDate: "asc" },
      take: 5,
    });

    const requestHistory = await this.prisma.vacationRequest.findMany({
      where: { userId: user.id },
      include: requestPeople,
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      remainingVacationDays:
        employee.vacationDaysTotal - employee.vacationDaysUsed,
      upcomingVacations,
      requestHistory,
    };
  }

  async cancel(user: RequestUser, requestId: string) {
    const request = await this.prisma.vacationRequest.findFirst({
      where: { id: requestId, userId: user.id },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!request) {
      throw new NotFoundException("Vacation request not found");
    }

    const hasStarted =
      startOfUtcDay(request.startDate) <= startOfUtcDay(new Date());
    const isCancellable =
      request.status === VacationStatus.PENDING ||
      (request.status === VacationStatus.APPROVED && !hasStarted);
    if (!isCancellable) {
      throw new BadRequestException(
        "Only pending requests or approved time off that has not started can be cancelled",
      );
    }

    const refundsAllowance =
      request.status === VacationStatus.APPROVED &&
      request.absenceType === AbsenceType.VACATION;

    const cancelled = await this.prisma.$transaction(async (tx) => {
      if (refundsAllowance) {
        await tx.user.update({
          where: { id: request.userId },
          data: { vacationDaysUsed: { decrement: request.workingDays } },
        });
      }

      return tx.vacationRequest.update({
        where: { id: requestId },
        data: { status: VacationStatus.CANCELLED },
      });
    });

    await this.notificationsService.createAndDispatch({
      type: "VACATION_CANCELLED",
      title: "Request cancelled",
      message: `${request.user.firstName} ${request.user.lastName} cancelled their ${request.status === VacationStatus.APPROVED ? "approved" : "pending"} request (${toDateKey(request.startDate)} to ${toDateKey(request.endDate)}).`,
      metadata: { requestId: cancelled.id, userId: cancelled.userId },
    });

    return cancelled;
  }

  async listTeamAbsences(user: RequestUser, from: Date, to: Date) {
    const millisecondsPerDay = 86_400_000;
    const spanInDays =
      (startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) /
      millisecondsPerDay;
    if (spanInDays > maxTeamRangeInDays) {
      throw new BadRequestException(
        `The range can cover at most ${maxTeamRangeInDays} days`,
      );
    }

    const member = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { department: true },
    });
    if (!member?.department) {
      return [];
    }

    const absences = await this.prisma.vacationRequest.findMany({
      where: {
        status: VacationStatus.APPROVED,
        startDate: { lte: startOfUtcDay(to) },
        endDate: { gte: startOfUtcDay(from) },
        userId: { not: user.id },
        user: { department: member.department, isActive: true },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startDate: "asc" },
    });

    return absences.map((absence) => ({
      id: absence.id,
      startDate: absence.startDate,
      endDate: absence.endDate,
      person: absence.user,
    }));
  }

  async getCalendarByYear(year: number) {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new BadRequestException(
        "year must be a number between 2000 and 2100",
      );
    }

    const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

    const requests = await this.prisma.vacationRequest.findMany({
      where: {
        startDate: { lte: yearEnd },
        endDate: { gte: yearStart },
        status: { not: VacationStatus.CANCELLED },
      },
      select: {
        id: true,
        userId: true,
        startDate: true,
        endDate: true,
        reason: true,
        workingDays: true,
        absenceType: true,
        status: true,
        coverUser: personSummary,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: [{ startDate: "asc" }],
    });

    const daysMap = new Map<
      string,
      {
        date: string;
        requests: Array<{
          id: string;
          userId: string;
          startDate: Date;
          endDate: Date;
          reason: string;
          workingDays: number;
          absenceType: AbsenceType;
          status: VacationStatus;
          coverUser: { id: string; firstName: string; lastName: string } | null;
          user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            department: string | null;
          };
        }>;
      }
    >();

    for (const request of requests) {
      const start = new Date(
        Date.UTC(
          request.startDate.getUTCFullYear(),
          request.startDate.getUTCMonth(),
          request.startDate.getUTCDate(),
        ),
      );
      const end = new Date(
        Date.UTC(
          request.endDate.getUTCFullYear(),
          request.endDate.getUTCMonth(),
          request.endDate.getUTCDate(),
        ),
      );

      for (
        let cursor = new Date(start);
        cursor <= end;
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      ) {
        if (cursor < yearStart || cursor > yearEnd) {
          continue;
        }

        const key = toDateKey(cursor);
        const existing = daysMap.get(key);
        const dayEntry = existing ?? { date: key, requests: [] };
        dayEntry.requests.push({
          id: request.id,
          userId: request.userId,
          startDate: request.startDate,
          endDate: request.endDate,
          reason: request.reason,
          workingDays: request.workingDays,
          absenceType: request.absenceType,
          status: request.status,
          coverUser: request.coverUser,
          user: request.user,
        });
        daysMap.set(key, dayEntry);
      }
    }

    return Array.from(daysMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }
}
