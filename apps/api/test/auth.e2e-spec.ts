import { hash } from "bcrypt";
import request from "supertest";
import { buildUser } from "./fixtures";
import { resetPrismaMock } from "./prisma-mock";
import { TestApp, bearer, createTestApp } from "./test-app";

describe("Auth endpoints", () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  beforeEach(() => {
    resetPrismaMock(testApp.prisma);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe("POST /api/auth/login", () => {
    it("returns a token and the user for valid credentials", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue(
        buildUser({ password: await hash("employee1234", 4) }),
      );

      const response = await request(testApp.app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "john.employee@company.com", password: "employee1234" })
        .expect(201);

      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.user).toMatchObject({
        email: "john.employee@company.com",
        role: "EMPLOYEE",
      });
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("returns 401 for a wrong password", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue(
        buildUser({ password: await hash("employee1234", 4) }),
      );

      await request(testApp.app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: "john.employee@company.com",
          password: "not-the-password",
        })
        .expect(401);
    });

    it("returns 400 for an invalid email without querying the database", async () => {
      const response = await request(testApp.app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "not-an-email", password: "employee1234" })
        .expect(400);

      expect(response.body.message).toContain("email must be an email");
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns 400 for unexpected fields", async () => {
      await request(testApp.app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: "john.employee@company.com",
          password: "employee1234",
          role: "ADMIN",
        })
        .expect(400);
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("changes the password", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue(
        buildUser({ password: await hash("temporary-pass", 4) }),
      );

      const response = await request(testApp.app.getHttpServer())
        .post("/api/auth/change-password")
        .set(bearer(testApp.employeeToken))
        .send({
          currentPassword: "temporary-pass",
          newPassword: "my-own-password",
        })
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(testApp.prisma.user.update.mock.calls[0][0].where).toEqual({
        id: "employee-1",
      });
    });

    it("returns 400 for a new password shorter than 8 characters", async () => {
      await request(testApp.app.getHttpServer())
        .post("/api/auth/change-password")
        .set(bearer(testApp.employeeToken))
        .send({ currentPassword: "temporary-pass", newPassword: "short" })
        .expect(400);

      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns 400 for a wrong current password", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue(
        buildUser({ password: await hash("temporary-pass", 4) }),
      );

      await request(testApp.app.getHttpServer())
        .post("/api/auth/change-password")
        .set(bearer(testApp.employeeToken))
        .send({ currentPassword: "guess-1234", newPassword: "my-own-password" })
        .expect(400);
    });

    it("returns 401 without a token", async () => {
      await request(testApp.app.getHttpServer())
        .post("/api/auth/change-password")
        .send({
          currentPassword: "temporary-pass",
          newPassword: "my-own-password",
        })
        .expect(401);
    });
  });

  describe("GET /api/me", () => {
    it("returns the signed-in user's public profile", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue({
        id: "employee-1",
        email: "john.employee@company.com",
        role: "EMPLOYEE",
      });

      const response = await request(testApp.app.getHttpServer())
        .get("/api/me")
        .set(bearer(testApp.employeeToken))
        .expect(200);

      expect(response.body.id).toBe("employee-1");
      expect(testApp.prisma.user.findUnique.mock.calls[0][0].where).toEqual({
        id: "employee-1",
      });
    });

    it("returns 401 without a token", async () => {
      await request(testApp.app.getHttpServer()).get("/api/me").expect(401);
    });

    it("returns 401 for a tampered token", async () => {
      await request(testApp.app.getHttpServer())
        .get("/api/me")
        .set(bearer(`${testApp.employeeToken.slice(0, -4)}abcd`))
        .expect(401);
    });
  });
});
