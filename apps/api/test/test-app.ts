import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { UserRole } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { SessionService } from "../src/auth/session.service";
import { RequestUser } from "../src/auth/types";
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

const employeeIdentity = {
  sub: "employee-1",
  email: "john.employee@company.com",
  role: UserRole.EMPLOYEE,
};

const adminIdentity = {
  sub: "admin-1",
  email: "admin@company.com",
  role: UserRole.ADMIN,
};

const sessionUsers = new Map<string, RequestUser>(
  [employeeIdentity, adminIdentity].map(({ sub, email, role }) => [
    sub,
    { id: sub, email, role },
  ]),
);

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
    .overrideProvider(SessionService)
    .useValue({
      findActiveUser: async (id: string) => sessionUsers.get(id) ?? null,
    })
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
