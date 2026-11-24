import request from "supertest";
import { buildUser } from "./fixtures";
import { resetPrismaMock } from "./prisma-mock";
import { TestApp, bearer, createTestApp } from "./test-app";

describe("Admin user management endpoints", () => {
  let testApp: TestApp;

  const http = () => request(testApp.app.getHttpServer());
  const asEmployee = () => bearer(testApp.employeeToken);
  const asAdmin = () => bearer(testApp.adminToken);

  function givenExistingEmployee() {
    testApp.prisma.user.findFirst.mockResolvedValue({ id: "employee-1" });
    testApp.prisma.vacationRequest.count.mockResolvedValue(0);
  }

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  beforeEach(() => {
    resetPrismaMock(testApp.prisma);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe("POST /api/admin/employees", () => {
    const body = {
      email: "amina.kovac@company.com",
      firstName: "Amina",
      lastName: "Kovač",
      temporaryPassword: "temporary-pass",
      vacationDaysTotal: 25,
    };

    it("creates an employee", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue(null);
      testApp.prisma.user.create.mockResolvedValue({
        id: "employee-2",
        email: body.email,
      });

      const response = await http()
        .post("/api/admin/employees")
        .set(asAdmin())
        .send(body)
        .expect(201);

      expect(response.body).toMatchObject({
        id: "employee-2",
        pendingRequests: 0,
        upcomingApprovedRequests: 0,
      });
    });

    it("returns 400 for an allowance outside 1–365 days", async () => {
      await http()
        .post("/api/admin/employees")
        .set(asAdmin())
        .send({ ...body, vacationDaysTotal: 0 })
        .expect(400);

      expect(testApp.prisma.user.create).not.toHaveBeenCalled();
    });

    it("returns 400 for a temporary password shorter than 8 characters", async () => {
      await http()
        .post("/api/admin/employees")
        .set(asAdmin())
        .send({ ...body, temporaryPassword: "short" })
        .expect(400);
    });

    it("returns 409 when the email is taken", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue(buildUser());

      await http()
        .post("/api/admin/employees")
        .set(asAdmin())
        .send(body)
        .expect(409);
    });

    it("returns 403 for employees", async () => {
      await http()
        .post("/api/admin/employees")
        .set(asEmployee())
        .send(body)
        .expect(403);
    });
  });

  describe("GET /api/admin/employees", () => {
    it("lists employees with request counts", async () => {
      testApp.prisma.user.findMany.mockResolvedValue([{ id: "employee-1" }]);
      testApp.prisma.vacationRequest.groupBy.mockResolvedValue([]);

      const response = await http()
        .get("/api/admin/employees")
        .set(asAdmin())
        .expect(200);

      expect(response.body).toEqual([
        { id: "employee-1", pendingRequests: 0, upcomingApprovedRequests: 0 },
      ]);
    });

    it("returns 403 for employees", async () => {
      await http().get("/api/admin/employees").set(asEmployee()).expect(403);
    });

    it("returns 401 without a token", async () => {
      await http().get("/api/admin/employees").expect(401);
    });
  });

  describe("GET /api/admin/employees/:id", () => {
    it("returns the employee", async () => {
      givenExistingEmployee();

      await http()
        .get("/api/admin/employees/employee-1")
        .set(asAdmin())
        .expect(200);
    });

    it("returns 404 for an unknown employee", async () => {
      testApp.prisma.user.findFirst.mockResolvedValue(null);

      await http()
        .get("/api/admin/employees/missing")
        .set(asAdmin())
        .expect(404);
    });
  });

  describe("PATCH /api/admin/employees/:id", () => {
    const body = {
      firstName: "John",
      lastName: "Employee",
      department: "Engineering",
      vacationDaysTotal: 26,
      isActive: true,
    };

    it("updates the employee", async () => {
      givenExistingEmployee();
      testApp.prisma.user.findUnique.mockResolvedValue({ vacationDaysUsed: 8 });
      testApp.prisma.user.update.mockResolvedValue({
        id: "employee-1",
        vacationDaysTotal: 26,
      });

      const response = await http()
        .patch("/api/admin/employees/employee-1")
        .set(asAdmin())
        .send(body)
        .expect(200);

      expect(response.body.vacationDaysTotal).toBe(26);
    });

    it("returns 400 when isActive is missing", async () => {
      await http()
        .patch("/api/admin/employees/employee-1")
        .set(asAdmin())
        .send({
          firstName: body.firstName,
          lastName: body.lastName,
          vacationDaysTotal: body.vacationDaysTotal,
        })
        .expect(400);
    });

    it("returns 404 for an unknown employee", async () => {
      testApp.prisma.user.findFirst.mockResolvedValue(null);

      await http()
        .patch("/api/admin/employees/missing")
        .set(asAdmin())
        .send(body)
        .expect(404);
    });
  });

  describe("PATCH /api/admin/employees/:id/reset-password", () => {
    it("resets the password", async () => {
      givenExistingEmployee();
      testApp.prisma.user.update.mockResolvedValue({
        id: "employee-1",
        email: "john.employee@company.com",
      });

      const response = await http()
        .patch("/api/admin/employees/employee-1/reset-password")
        .set(asAdmin())
        .send({ newPassword: "brand-new-pass" })
        .expect(200);

      expect(response.body).toEqual({
        id: "employee-1",
        email: "john.employee@company.com",
      });
    });

    it("returns 400 for a password shorter than 8 characters", async () => {
      await http()
        .patch("/api/admin/employees/employee-1/reset-password")
        .set(asAdmin())
        .send({ newPassword: "short" })
        .expect(400);
    });
  });

  describe("POST /api/admin/admins", () => {
    const body = {
      email: "ops@company.com",
      firstName: "Ops",
      lastName: "Admin",
      password: "admin-password",
    };

    it("creates an admin", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue(null);
      testApp.prisma.user.create.mockResolvedValue({
        id: "admin-2",
        email: body.email,
      });

      await http()
        .post("/api/admin/admins")
        .set(asAdmin())
        .send(body)
        .expect(201);
    });

    it("returns 400 for an invalid email", async () => {
      await http()
        .post("/api/admin/admins")
        .set(asAdmin())
        .send({ ...body, email: "ops" })
        .expect(400);
    });

    it("returns 403 for employees", async () => {
      await http()
        .post("/api/admin/admins")
        .set(asEmployee())
        .send(body)
        .expect(403);
    });
  });

  describe("GET /api/admin/admins", () => {
    it("lists admins", async () => {
      testApp.prisma.user.findMany.mockResolvedValue([{ id: "admin-1" }]);

      const response = await http()
        .get("/api/admin/admins")
        .set(asAdmin())
        .expect(200);

      expect(response.body).toEqual([{ id: "admin-1" }]);
    });

    it("returns 403 for employees", async () => {
      await http().get("/api/admin/admins").set(asEmployee()).expect(403);
    });
  });
});
