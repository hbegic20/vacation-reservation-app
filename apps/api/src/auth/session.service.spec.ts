import { UserRole } from "@prisma/client";
import { asPrismaService, createPrismaMock } from "../../test/prisma-mock";
import { SessionService } from "./session.service";

describe("SessionService", () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let sessionService: SessionService;

  beforeEach(() => {
    prisma = createPrismaMock();
    sessionService = new SessionService(asPrismaService(prisma));
  });

  it("returns the user with the role currently stored in the database", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "admin-1",
      email: "admin@company.com",
      role: UserRole.EMPLOYEE,
      isActive: true,
    });

    await expect(sessionService.findActiveUser("admin-1")).resolves.toEqual({
      id: "admin-1",
      email: "admin@company.com",
      role: UserRole.EMPLOYEE,
    });
  });

  it("ends the session of a deactivated user", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "employee-1",
      email: "john.employee@company.com",
      role: UserRole.EMPLOYEE,
      isActive: false,
    });

    await expect(
      sessionService.findActiveUser("employee-1"),
    ).resolves.toBeNull();
  });

  it("ends the session of a deleted user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(sessionService.findActiveUser("gone-1")).resolves.toBeNull();
  });
});
