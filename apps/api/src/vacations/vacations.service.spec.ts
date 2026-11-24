import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { AbsenceType, UserRole, VacationStatus } from "@prisma/client";
import { buildRequest, buildUser, publicUser } from "../../test/fixtures";
import {
  PrismaMock,
  asPrismaService,
  createPrismaMock,
} from "../../test/prisma-mock";
import { NotificationsService } from "../notifications/notifications.service";
import { VacationsService } from "./vacations.service";

const employeeUser = {
  id: "employee-1",
  email: "john.employee@company.com",
  role: UserRole.EMPLOYEE,
};
const adminUser = {
  id: "admin-1",
  email: "admin@company.com",
  role: UserRole.ADMIN,
};

function utcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

describe("VacationsService", () => {
  let prisma: PrismaMock;
  let notifications: { createAndDispatch: jest.Mock };
  let vacationsService: VacationsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    notifications = {
      createAndDispatch: jest.fn().mockResolvedValue(undefined),
    };
    vacationsService = new VacationsService(
      asPrismaService(prisma),
      notifications as unknown as NotificationsService,
    );
  });

  describe("createRequest", () => {
    const monToFri = {
      startDate: utcDate("2026-03-09"),
      endDate: utcDate("2026-03-13"),
      reason: "Family trip",
    };

    it("creates a pending vacation request and notifies admins", async () => {
      const user = buildUser();
      const created = { ...buildRequest(), user: publicUser(user) };
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.vacationRequest.create.mockResolvedValue(created);

      await expect(
        vacationsService.createRequest(employeeUser, monToFri),
      ).resolves.toBe(created);

      expect(prisma.vacationRequest.create.mock.calls[0][0].data).toMatchObject(
        {
          userId: "employee-1",
          absenceType: AbsenceType.VACATION,
          status: VacationStatus.PENDING,
        },
      );
      expect(notifications.createAndDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "VACATION_REQUEST_SUBMITTED",
          message: expect.stringContaining("2026-03-09 to 2026-03-13"),
        }),
      );
    });

    it("rejects a range that only covers a weekend", async () => {
      await expect(
        vacationsService.createRequest(employeeUser, {
          startDate: utcDate("2026-03-14"),
          endDate: utcDate("2026-03-15"),
          reason: "Weekend",
        }),
      ).rejects.toThrow(
        new BadRequestException(
          "Vacation must include at least one business day",
        ),
      );
      expect(prisma.vacationRequest.create).not.toHaveBeenCalled();
    });

    it("counts business days in UTC regardless of the server time zone", async () => {
      prisma.user.findUnique.mockResolvedValue(
        buildUser({ vacationDaysTotal: 5, vacationDaysUsed: 0 }),
      );
      prisma.vacationRequest.create.mockResolvedValue({
        ...buildRequest(),
        user: publicUser(buildUser()),
      });

      await expect(
        vacationsService.createRequest(employeeUser, monToFri),
      ).resolves.toBeDefined();

      prisma.user.findUnique.mockResolvedValue(
        buildUser({ vacationDaysTotal: 4, vacationDaysUsed: 0 }),
      );
      await expect(
        vacationsService.createRequest(employeeUser, monToFri),
      ).rejects.toThrow("Not enough remaining vacation days");
    });

    it("rejects a request larger than the remaining allowance", async () => {
      prisma.user.findUnique.mockResolvedValue(
        buildUser({ vacationDaysTotal: 25, vacationDaysUsed: 22 }),
      );

      await expect(
        vacationsService.createRequest(employeeUser, monToFri),
      ).rejects.toThrow(
        new BadRequestException("Not enough remaining vacation days"),
      );
    });

    it("throws when the employee no longer exists", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        vacationsService.createRequest(employeeUser, monToFri),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("createSickLeave", () => {
    const dto = {
      userId: "employee-1",
      startDate: utcDate("2026-02-12"),
      endDate: utcDate("2026-02-12"),
      reason: "Flu",
    };

    it("records approved sick leave with a default admin comment", async () => {
      const user = buildUser();
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.vacationRequest.create.mockResolvedValue({
        ...buildRequest({ absenceType: AbsenceType.SICK }),
        user: publicUser(user),
      });

      await vacationsService.createSickLeave(dto);

      expect(prisma.vacationRequest.create.mock.calls[0][0].data).toMatchObject(
        {
          absenceType: AbsenceType.SICK,
          status: VacationStatus.APPROVED,
          adminComment: "Marked as sick leave by admin",
        },
      );
      expect(notifications.createAndDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SICK_LEAVE_ADDED" }),
      );
    });

    it("rejects an end date before the start date", async () => {
      await expect(
        vacationsService.createSickLeave({
          ...dto,
          endDate: utcDate("2026-02-11"),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });

    it("throws when the employee does not exist", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        vacationsService.createSickLeave(dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("approve", () => {
    it("approves a vacation and deducts its business days in one transaction", async () => {
      const user = buildUser({ vacationDaysTotal: 25, vacationDaysUsed: 8 });
      prisma.vacationRequest.findUnique.mockResolvedValue({
        ...buildRequest(),
        user,
      });
      prisma.vacationRequest.update.mockResolvedValue(
        buildRequest({ status: VacationStatus.APPROVED }),
      );

      await vacationsService.approve("request-1", "Enjoy");

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "employee-1" },
        data: { vacationDaysUsed: { increment: 5 } },
      });
      expect(prisma.vacationRequest.update.mock.calls[0][0].data).toEqual({
        status: VacationStatus.APPROVED,
        adminComment: "Enjoy",
      });
      expect(notifications.createAndDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "VACATION_APPROVED" }),
      );
    });

    it("approves sick leave without touching the vacation allowance", async () => {
      prisma.vacationRequest.findUnique.mockResolvedValue({
        ...buildRequest({ absenceType: AbsenceType.SICK }),
        user: buildUser(),
      });
      prisma.vacationRequest.update.mockResolvedValue(
        buildRequest({ status: VacationStatus.APPROVED }),
      );

      await vacationsService.approve("request-1");

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.vacationRequest.update.mock.calls[0][0].data).toEqual({
        status: VacationStatus.APPROVED,
        adminComment: null,
      });
    });

    it("refuses when the employee no longer has enough days", async () => {
      prisma.vacationRequest.findUnique.mockResolvedValue({
        ...buildRequest(),
        user: buildUser({ vacationDaysTotal: 25, vacationDaysUsed: 23 }),
      });

      await expect(vacationsService.approve("request-1")).rejects.toThrow(
        new BadRequestException("Employee does not have enough vacation days"),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("refuses requests that are no longer pending", async () => {
      prisma.vacationRequest.findUnique.mockResolvedValue({
        ...buildRequest({ status: VacationStatus.REJECTED }),
        user: buildUser(),
      });

      await expect(vacationsService.approve("request-1")).rejects.toThrow(
        new BadRequestException("Only pending requests can be approved"),
      );
    });

    it("throws for an unknown request", async () => {
      prisma.vacationRequest.findUnique.mockResolvedValue(null);

      await expect(vacationsService.approve("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("reject", () => {
    it("rejects a pending request with the admin comment", async () => {
      prisma.vacationRequest.findUnique.mockResolvedValue(buildRequest());
      prisma.vacationRequest.update.mockResolvedValue({
        ...buildRequest({ status: VacationStatus.REJECTED }),
        user: publicUser(buildUser()),
      });
      prisma.user.findUnique.mockResolvedValue({
        firstName: "John",
        lastName: "Employee",
      });

      await vacationsService.reject("request-1", "Release week");

      expect(prisma.vacationRequest.update.mock.calls[0][0].data).toEqual({
        status: VacationStatus.REJECTED,
        adminComment: "Release week",
      });
      expect(notifications.createAndDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "VACATION_REJECTED" }),
      );
    });

    it("refuses requests that are no longer pending", async () => {
      prisma.vacationRequest.findUnique.mockResolvedValue(
        buildRequest({ status: VacationStatus.APPROVED }),
      );

      await expect(vacationsService.reject("request-1")).rejects.toThrow(
        new BadRequestException("Only pending requests can be rejected"),
      );
      expect(prisma.vacationRequest.update).not.toHaveBeenCalled();
    });

    it("throws for an unknown request", async () => {
      prisma.vacationRequest.findUnique.mockResolvedValue(null);

      await expect(vacationsService.reject("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("getSummary", () => {
    it("returns company-wide counts for admins", async () => {
      prisma.vacationRequest.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(7);
      prisma.user.count.mockResolvedValue(42);

      await expect(vacationsService.getSummary(adminUser)).resolves.toEqual({
        pendingApprovals: 3,
        approvedRequests: 7,
        employees: 42,
      });
    });

    it("returns the employee's remaining days and their own requests", async () => {
      prisma.user.findUnique.mockResolvedValue(
        buildUser({ vacationDaysTotal: 25, vacationDaysUsed: 8 }),
      );
      prisma.vacationRequest.findMany
        .mockResolvedValueOnce(["upcoming"])
        .mockResolvedValueOnce(["history"]);

      await expect(vacationsService.getSummary(employeeUser)).resolves.toEqual({
        remainingVacationDays: 17,
        upcomingVacations: ["upcoming"],
        requestHistory: ["history"],
      });
      for (const [query] of prisma.vacationRequest.findMany.mock.calls) {
        expect(query.where.userId).toBe("employee-1");
      }
    });

    it("refuses when the employee record is missing", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        vacationsService.getSummary(employeeUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("getCalendarByYear", () => {
    it.each([1999, 2101, Number.NaN, 2026.5])(
      "rejects the invalid year %p",
      async (year) => {
        await expect(
          vacationsService.getCalendarByYear(year),
        ).rejects.toBeInstanceOf(BadRequestException);
      },
    );

    it("expands each request into one entry per day, clipped to the year and sorted", async () => {
      const user = publicUser(buildUser());
      prisma.vacationRequest.findMany.mockResolvedValue([
        {
          ...buildRequest({
            id: "new-year",
            startDate: utcDate("2025-12-30"),
            endDate: utcDate("2026-01-02"),
          }),
          user,
        },
        {
          ...buildRequest({
            id: "overlap",
            startDate: utcDate("2026-01-02"),
            endDate: utcDate("2026-01-02"),
          }),
          user,
        },
      ]);

      const days = await vacationsService.getCalendarByYear(2026);

      expect(days.map((day) => day.date)).toEqual(["2026-01-01", "2026-01-02"]);
      expect(days[1].requests.map((request) => request.id)).toEqual([
        "new-year",
        "overlap",
      ]);
    });
  });
});
