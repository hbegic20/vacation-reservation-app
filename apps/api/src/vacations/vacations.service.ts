import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AbsenceType, UserRole, VacationStatus } from "@prisma/client";
import { RequestUser } from "../auth/types";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSickLeaveDto } from "./dto/create-sick-leave.dto";
import { CreateVacationRequestDto } from "./dto/create-vacation-request.dto";

@Injectable()
export class VacationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getDateKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private calculateBusinessDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = 0;

    for (
      let date = new Date(start);
      date <= end;
      date.setUTCDate(date.getUTCDate() + 1)
    ) {
      const day = date.getUTCDay();
      if (day !== 0 && day !== 6) {
        days += 1;
      }
    }

    return days;
  }

  async createRequest(user: RequestUser, dto: CreateVacationRequestDto) {
    const requestedDays = this.calculateBusinessDays(
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

    const request = await this.prisma.vacationRequest.create({
      data: {
        userId: user.id,
        startDate: dto.startDate,
        endDate: dto.endDate,
        reason: dto.reason,
        absenceType: AbsenceType.VACATION,
        status: VacationStatus.PENDING,
      },
      include: {
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

    const sickEntry = await this.prisma.vacationRequest.create({
      data: {
        userId: dto.userId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        reason: dto.reason,
        absenceType: AbsenceType.SICK,
        status: VacationStatus.APPROVED,
        adminComment: dto.adminComment ?? "Marked as sick leave by admin",
      },
      include: {
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

    return sickEntry;
  }

  listForEmployee(userId: string) {
    return this.prisma.vacationRequest.findMany({
      where: { userId },
      include: {
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
      orderBy: { createdAt: "desc" },
    });
  }

  listAll() {
    return this.prisma.vacationRequest.findMany({
      include: {
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
      orderBy: { createdAt: "desc" },
    });
  }

  listApproved() {
    return this.prisma.vacationRequest.findMany({
      where: { status: VacationStatus.APPROVED },
      include: {
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

      return approvedSick;
    }

    const requestedDays = this.calculateBusinessDays(
      request.startDate,
      request.endDate,
    );
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
        include: {
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
      include: {
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
      include: {
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
      orderBy: { startDate: "asc" },
      take: 5,
    });

    const requestHistory = await this.prisma.vacationRequest.findMany({
      where: { userId: user.id },
      include: {
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
      },
      select: {
        id: true,
        userId: true,
        startDate: true,
        endDate: true,
        reason: true,
        absenceType: true,
        status: true,
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
          absenceType: AbsenceType;
          status: VacationStatus;
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

        const key = this.getDateKey(cursor);
        const existing = daysMap.get(key);
        const dayEntry = existing ?? { date: key, requests: [] };
        dayEntry.requests.push({
          id: request.id,
          userId: request.userId,
          startDate: request.startDate,
          endDate: request.endDate,
          reason: request.reason,
          absenceType: request.absenceType,
          status: request.status,
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
