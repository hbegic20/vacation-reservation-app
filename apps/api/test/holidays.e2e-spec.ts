import request from "supertest";
import { resetPrismaMock } from "./prisma-mock";
import { TestApp, bearer, createTestApp } from "./test-app";

describe("Holiday endpoints", () => {
  let testApp: TestApp;

  const http = () => request(testApp.app.getHttpServer());
  const asEmployee = () => bearer(testApp.employeeToken);
  const asAdmin = () => bearer(testApp.adminToken);

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  beforeEach(() => {
    resetPrismaMock(testApp.prisma);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe("GET /api/holidays", () => {
    it("lists the year's holidays for any signed-in user", async () => {
      testApp.prisma.publicHoliday.findMany.mockResolvedValue([
        { id: "h-1", date: "2026-05-01T00:00:00.000Z", name: "Labour Day" },
      ]);

      const response = await http()
        .get("/api/holidays?year=2026")
        .set(asEmployee())
        .expect(200);

      expect(response.body).toEqual([
        { id: "h-1", date: "2026-05-01T00:00:00.000Z", name: "Labour Day" },
      ]);
    });

    it("returns 400 for an invalid year", async () => {
      await http().get("/api/holidays?year=abc").set(asAdmin()).expect(400);
    });

    it("returns 401 without a token", async () => {
      await http().get("/api/holidays").expect(401);
    });
  });

  describe("POST /api/holidays", () => {
    const body = { date: "2026-11-25", name: "Statehood Day" };

    it("lets an admin add a holiday", async () => {
      testApp.prisma.publicHoliday.findUnique.mockResolvedValue(null);
      testApp.prisma.publicHoliday.create.mockResolvedValue({
        id: "h-2",
        ...body,
      });

      await http().post("/api/holidays").set(asAdmin()).send(body).expect(201);
    });

    it("returns 400 for an invalid date or a missing name", async () => {
      await http()
        .post("/api/holidays")
        .set(asAdmin())
        .send({ date: "soon" })
        .expect(400);
    });

    it("returns 409 when the day is already a holiday", async () => {
      testApp.prisma.publicHoliday.findUnique.mockResolvedValue({
        id: "h-1",
        name: "Existing",
      });

      await http().post("/api/holidays").set(asAdmin()).send(body).expect(409);
    });

    it("returns 403 for employees", async () => {
      await http()
        .post("/api/holidays")
        .set(asEmployee())
        .send(body)
        .expect(403);
    });
  });

  describe("DELETE /api/holidays/:id", () => {
    it("lets an admin delete a holiday", async () => {
      testApp.prisma.publicHoliday.findUnique.mockResolvedValue({ id: "h-1" });

      await http().delete("/api/holidays/h-1").set(asAdmin()).expect(200);
    });

    it("returns 404 for an unknown holiday", async () => {
      testApp.prisma.publicHoliday.findUnique.mockResolvedValue(null);

      await http().delete("/api/holidays/missing").set(asAdmin()).expect(404);
    });

    it("returns 403 for employees", async () => {
      await http().delete("/api/holidays/h-1").set(asEmployee()).expect(403);
    });
  });
});
