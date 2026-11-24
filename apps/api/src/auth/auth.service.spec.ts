import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcrypt";
import { buildUser } from "../../test/fixtures";
import { asPrismaService, createPrismaMock } from "../../test/prisma-mock";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const jwtService = new JwtService({ secret: "unit-test-secret" });
  let prisma: ReturnType<typeof createPrismaMock>;
  let authService: AuthService;

  beforeEach(() => {
    prisma = createPrismaMock();
    authService = new AuthService(
      new UsersService(asPrismaService(prisma)),
      jwtService,
      asPrismaService(prisma),
    );
  });

  it("returns a signed token and the public user for valid credentials", async () => {
    const user = buildUser({ password: await hash("employee1234", 4) });
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await authService.login({
      email: user.email,
      password: "employee1234",
    });

    const payload = jwtService.verify(result.accessToken);
    expect(payload).toMatchObject({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    expect(result.user).toEqual({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      isActive: true,
      mustChangePassword: false,
      vacationDaysTotal: 25,
      vacationDaysUsed: 8,
    });
    expect(result.user).not.toHaveProperty("password");
  });

  it("rejects an unknown email", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({ email: "nobody@company.com", password: "whatever1" }),
    ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));
  });

  it("rejects a wrong password with the same message as an unknown email", async () => {
    prisma.user.findUnique.mockResolvedValue(
      buildUser({ password: await hash("employee1234", 4) }),
    );

    await expect(
      authService.login({
        email: "john.employee@company.com",
        password: "wrong-password",
      }),
    ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));
  });

  it("rejects an inactive account", async () => {
    prisma.user.findUnique.mockResolvedValue(
      buildUser({
        isActive: false,
        password: await hash("employee1234", 4),
      }),
    );

    await expect(
      authService.login({
        email: "john.employee@company.com",
        password: "employee1234",
      }),
    ).rejects.toThrow(new UnauthorizedException("Account is inactive"));
  });

  it("tells the client when the user must change a temporary password", async () => {
    prisma.user.findUnique.mockResolvedValue(
      buildUser({
        mustChangePassword: true,
        password: await hash("temporary-pass", 4),
      }),
    );

    const result = await authService.login({
      email: "john.employee@company.com",
      password: "temporary-pass",
    });

    expect(result.user.mustChangePassword).toBe(true);
  });

  describe("changePassword", () => {
    beforeEach(async () => {
      prisma.user.findUnique.mockResolvedValue(
        buildUser({
          mustChangePassword: true,
          password: await hash("temporary-pass", 4),
        }),
      );
    });

    it("stores the new hashed password and clears the must-change flag", async () => {
      await expect(
        authService.changePassword("employee-1", {
          currentPassword: "temporary-pass",
          newPassword: "my-own-password",
        }),
      ).resolves.toEqual({ success: true });

      const { where, data } = prisma.user.update.mock.calls[0][0];
      expect(where).toEqual({ id: "employee-1" });
      expect(data.mustChangePassword).toBe(false);
      await expect(compare("my-own-password", data.password)).resolves.toBe(
        true,
      );
    });

    it("rejects a wrong current password", async () => {
      await expect(
        authService.changePassword("employee-1", {
          currentPassword: "guess-1234",
          newPassword: "my-own-password",
        }),
      ).rejects.toThrow(
        new BadRequestException("Current password is incorrect"),
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("rejects reusing the current password", async () => {
      await expect(
        authService.changePassword("employee-1", {
          currentPassword: "temporary-pass",
          newPassword: "temporary-pass",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects an account that no longer exists", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.changePassword("missing", {
          currentPassword: "temporary-pass",
          newPassword: "my-own-password",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
