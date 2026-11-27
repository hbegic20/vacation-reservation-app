import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserRole, VacationStatus } from "@prisma/client";
import { hash } from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";

const adminFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  department: true,
  createdAt: true,
} as const;

const employeeFields = {
  ...adminFields,
  isActive: true,
  vacationDaysTotal: true,
  vacationDaysUsed: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  private async ensureEmailAvailable(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("User with this email already exists");
    }
  }

  async createEmployee(dto: CreateEmployeeDto) {
    await this.ensureEmailAvailable(dto.email);
    const password = await hash(dto.temporaryPassword, 10);

    const employee = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        department: dto.department ?? null,
        password,
        role: UserRole.EMPLOYEE,
        vacationDaysTotal: dto.vacationDaysTotal,
        vacationDaysUsed: 0,
        isActive: true,
        mustChangePassword: true,
      },
      select: employeeFields,
    });

    return {
      ...employee,
      pendingRequests: 0,
      upcomingApprovedRequests: 0,
    };
  }

  async createAdmin(dto: CreateAdminDto) {
    await this.ensureEmailAvailable(dto.email);
    const password = await hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        department: dto.department ?? null,
        password,
        role: UserRole.ADMIN,
        vacationDaysTotal: 30,
        vacationDaysUsed: 0,
        isActive: true,
        mustChangePassword: true,
      },
      select: adminFields,
    });
  }

  async listAdmins() {
    return this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: adminFields,
      orderBy: { createdAt: "asc" },
    });
  }

  async findPublicById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        department: true,
        isActive: true,
        mustChangePassword: true,
        vacationDaysTotal: true,
        vacationDaysUsed: true,
      },
    });
  }

  async getEmployeeById(id: string) {
    const employee = await this.prisma.user.findFirst({
      where: { id, role: UserRole.EMPLOYEE },
      select: employeeFields,
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    const [pendingRequests, upcomingApprovedRequests] = await Promise.all([
      this.prisma.vacationRequest.count({
        where: { userId: id, status: VacationStatus.PENDING },
      }),
      this.prisma.vacationRequest.count({
        where: {
          userId: id,
          status: VacationStatus.APPROVED,
          startDate: { gte: new Date() },
        },
      }),
    ]);

    return {
      ...employee,
      pendingRequests,
      upcomingApprovedRequests,
    };
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const employee = await this.getEmployeeById(id);
    const total = Math.max(dto.vacationDaysTotal, employee.vacationDaysUsed);

    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        department: dto.department ?? null,
        isActive: dto.isActive,
        vacationDaysTotal: total,
      },
      select: employeeFields,
    });
  }

  async resetEmployeePassword(id: string, dto: ResetPasswordDto) {
    await this.getEmployeeById(id);
    const password = await hash(dto.newPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data: { password, mustChangePassword: true },
      select: {
        id: true,
        email: true,
      },
    });
  }

  async listEmployees() {
    const employees = await this.prisma.user.findMany({
      where: { role: UserRole.EMPLOYEE },
      select: employeeFields,
      orderBy: { email: "asc" },
    });

    const [pendingByUser, upcomingApprovedByUser] = await Promise.all([
      this.prisma.vacationRequest.groupBy({
        by: ["userId"],
        where: { status: VacationStatus.PENDING },
        _count: { _all: true },
      }),
      this.prisma.vacationRequest.groupBy({
        by: ["userId"],
        where: {
          status: VacationStatus.APPROVED,
          startDate: { gte: new Date() },
        },
        _count: { _all: true },
      }),
    ]);

    const pendingMap = new Map(
      pendingByUser.map((item) => [item.userId, item._count._all]),
    );
    const upcomingMap = new Map(
      upcomingApprovedByUser.map((item) => [item.userId, item._count._all]),
    );

    return employees.map((employee) => ({
      ...employee,
      pendingRequests: pendingMap.get(employee.id) ?? 0,
      upcomingApprovedRequests: upcomingMap.get(employee.id) ?? 0,
    }));
  }
}
