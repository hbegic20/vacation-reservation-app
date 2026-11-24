import request from "supertest";
import { resetPrismaMock } from "./prisma-mock";
import { TestApp, bearer, createTestApp } from "./test-app";

describe("Notification endpoints", () => {
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

  describe("GET /api/notifications/admin", () => {
    it("lists the admin's notifications", async () => {
      testApp.prisma.adminNotification.findMany.mockResolvedValue([
        { id: "n-1" },
      ]);

      const response = await http()
        .get("/api/notifications/admin?unreadOnly=true")
        .set(asAdmin())
        .expect(200);

      expect(response.body).toEqual([{ id: "n-1" }]);
      expect(
        testApp.prisma.adminNotification.findMany.mock.calls[0][0].where,
      ).toEqual({
        adminId: "admin-1",
        isRead: false,
      });
    });

    it("returns 403 for employees", async () => {
      await http()
        .get("/api/notifications/admin")
        .set(asEmployee())
        .expect(403);
    });

    it("returns 401 without a token", async () => {
      await http().get("/api/notifications/admin").expect(401);
    });
  });

  describe("GET /api/notifications/admin/unread-count", () => {
    it("returns the unread count", async () => {
      testApp.prisma.adminNotification.count.mockResolvedValue(2);

      const response = await http()
        .get("/api/notifications/admin/unread-count")
        .set(asAdmin())
        .expect(200);

      expect(response.body).toEqual({ unread: 2 });
    });

    it("returns 403 for employees", async () => {
      await http()
        .get("/api/notifications/admin/unread-count")
        .set(asEmployee())
        .expect(403);
    });
  });

  describe("PATCH /api/notifications/:id/read", () => {
    it("marks the notification as read", async () => {
      testApp.prisma.adminNotification.findFirst.mockResolvedValue({
        id: "n-1",
      });
      testApp.prisma.adminNotification.update.mockResolvedValue({
        id: "n-1",
        isRead: true,
      });

      const response = await http()
        .patch("/api/notifications/n-1/read")
        .set(asAdmin())
        .expect(200);

      expect(response.body.isRead).toBe(true);
    });

    it("returns 404 for another admin's notification", async () => {
      testApp.prisma.adminNotification.findFirst.mockResolvedValue(null);

      await http()
        .patch("/api/notifications/n-2/read")
        .set(asAdmin())
        .expect(404);
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    it("marks everything as read", async () => {
      const response = await http()
        .patch("/api/notifications/read-all")
        .set(asAdmin())
        .expect(200);

      expect(response.body).toEqual({ success: true });
    });

    it("returns 403 for employees", async () => {
      await http()
        .patch("/api/notifications/read-all")
        .set(asEmployee())
        .expect(403);
    });
  });
});
