import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { UserRole } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { NotificationsService } from "../src/notifications/notifications.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { RemindersService } from "../src/vacations/reminders.service";
import { PrismaMock, createPrismaMock } from "./prisma-mock";

export interface TestApp {
  app: INestApplication;
  prisma: PrismaMock;
  employeeToken: string;
  adminToken: string;
}

export const employeeIdentity = {
  sub: "employee-1",
  email: "john.employee@company.com",
  role: UserRole.EMPLOYEE,
};

export const adminIdentity = {
  sub: "admin-1",
  email: "admin@company.com",
  role: UserRole.ADMIN,
};

export async function createTestApp(): Promise<TestApp> {
  jest
    .spyOn(NotificationsService.prototype, "onModuleInit")
    .mockImplementation(() => undefined);
  jest
    .spyOn(RemindersService.prototype, "onModuleInit")
    .mockImplementation(() => undefined);

  const prisma = createPrismaMock();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  const app = configureApp(moduleRef.createNestApplication());
  await app.init();

  const jwtService = app.get(JwtService);
  return {
    app,
    prisma,
    employeeToken: jwtService.sign(employeeIdentity),
    adminToken: jwtService.sign(adminIdentity),
  };
}

export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
