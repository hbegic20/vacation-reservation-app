import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash } from "bcrypt";
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
});
