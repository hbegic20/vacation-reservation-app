import { ConflictException, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { compare } from "bcrypt";
import { buildUser } from "../../test/fixtures";
import {
  PrismaMock,
  asPrismaService,
  createPrismaMock,
} from "../../test/prisma-mock";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  let prisma: PrismaMock;
  let usersService: UsersService;

  beforeEach(() => {
    prisma = createPrismaMock();
    usersService = new UsersService(asPrismaService(prisma));
  });

  describe("createEmployee", () => {
    const dto = {
      email: "amina.kovac@company.com",
      firstName: "Amina",
      lastName: "Kovač",
      department: "Engineering",
      temporaryPassword: "temporary-pass",
      vacationDaysTotal: 25,
    };

    it("creates an active employee with a hashed password and zero counts", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: "employee-2", ...data }),
      );

      const result = await usersService.createEmployee(dto);

      const { data } = prisma.user.create.mock.calls[0][0];
      expect(data).toMatchObject({
        email: dto.email,
        role: UserRole.EMPLOYEE,
        isActive: true,
        mustChangePassword: true,
        vacationDaysUsed: 0,
        vacationDaysTotal: 25,
      });
      expect(data.password).not.toBe(dto.temporaryPassword);
      await expect(compare(dto.temporaryPassword, data.password)).resolves.toBe(
        true,
      );
      expect(result).toMatchObject({
        pendingRequests: 0,
        upcomingApprovedRequests: 0,
      });
    });

    it("rejects an email that is already taken", async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());

      await expect(usersService.createEmployee(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  it("creates admins with the admin role", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "admin-2" });

    await usersService.createAdmin({
      email: "ops@company.com",
      firstName: "Ops",
      lastName: "Admin",
      password: "admin-password",
    });

    expect(prisma.user.create.mock.calls[0][0].data).toMatchObject({
      role: UserRole.ADMIN,
      department: null,
      mustChangePassword: true,
    });
  });

  describe("getEmployeeById", () => {
    it("adds pending and upcoming approved counts", async () => {
      prisma.user.findFirst.mockResolvedValue({ id: "employee-1" });
      prisma.vacationRequest.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      await expect(usersService.getEmployeeById("employee-1")).resolves.toEqual(
        {
          id: "employee-1",
          pendingRequests: 2,
          upcomingApprovedRequests: 1,
        },
      );
    });

    it("throws when the employee does not exist", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        usersService.getEmployeeById("missing"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it("never lowers the allowance below the days already used", async () => {
    prisma.user.findFirst.mockResolvedValue({ id: "employee-1" });
    prisma.vacationRequest.count.mockResolvedValue(0);
    prisma.user.findUnique.mockResolvedValue({ vacationDaysUsed: 12 });
    prisma.user.update.mockResolvedValue({ id: "employee-1" });

    await usersService.updateEmployee("employee-1", {
      firstName: "John",
      lastName: "Employee",
      vacationDaysTotal: 10,
      isActive: true,
    });

    expect(prisma.user.update.mock.calls[0][0].data).toMatchObject({
      vacationDaysTotal: 12,
      department: null,
    });
  });

  it("stores a hashed password when resetting it", async () => {
    prisma.user.findFirst.mockResolvedValue({ id: "employee-1" });
    prisma.vacationRequest.count.mockResolvedValue(0);
    prisma.user.update.mockResolvedValue({
      id: "employee-1",
      email: "john.employee@company.com",
    });

    await usersService.resetEmployeePassword("employee-1", {
      newPassword: "brand-new-pass",
    });

    const { password, mustChangePassword } =
      prisma.user.update.mock.calls[0][0].data;
    await expect(compare("brand-new-pass", password)).resolves.toBe(true);
    expect(mustChangePassword).toBe(true);
  });

  it("lists employees with their request counts, defaulting to zero", async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: "employee-1" },
      { id: "employee-2" },
    ]);
    prisma.vacationRequest.groupBy
      .mockResolvedValueOnce([{ userId: "employee-1", _count: { _all: 3 } }])
      .mockResolvedValueOnce([{ userId: "employee-2", _count: { _all: 1 } }]);

    await expect(usersService.listEmployees()).resolves.toEqual([
      { id: "employee-1", pendingRequests: 3, upcomingApprovedRequests: 0 },
      { id: "employee-2", pendingRequests: 0, upcomingApprovedRequests: 1 },
    ]);
  });
});
