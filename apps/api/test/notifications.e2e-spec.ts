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

  describe("GET /api/notifications", () => {
    it("lists the signed-in employee's own notifications", async () => {
      testApp.prisma.notification.findMany.mockResolvedValue([{ id: "n-1" }]);

      const response = await http()
        .get("/api/notifications?unreadOnly=true")
        .set(asEmployee())
        .expect(200);

      expect(response.body).toEqual([{ id: "n-1" }]);
      expect(
        testApp.prisma.notification.findMany.mock.calls[0][0].where,
      ).toEqual({ userId: "employee-1", isRead: false });
    });

    it("lists the admin's own notifications", async () => {
      testApp.prisma.notification.findMany.mockResolvedValue([]);

      await http().get("/api/notifications").set(asAdmin()).expect(200);

      expect(
        testApp.prisma.notification.findMany.mock.calls[0][0].where,
      ).toEqual({ userId: "admin-1" });
    });

    it("returns 401 without a token", async () => {
      await http().get("/api/notifications").expect(401);
    });
  });

  describe("GET /api/notifications/unread-count", () => {
    it("returns the unread count", async () => {
      testApp.prisma.notification.count.mockResolvedValue(2);

      const response = await http()
        .get("/api/notifications/unread-count")
        .set(asEmployee())
        .expect(200);

      expect(response.body).toEqual({ unread: 2 });
    });

    it("returns 401 without a token", async () => {
      await http().get("/api/notifications/unread-count").expect(401);
    });
  });

  describe("PATCH /api/notifications/:id/read", () => {
    it("marks the notification as read", async () => {
      testApp.prisma.notification.findFirst.mockResolvedValue({ id: "n-1" });
      testApp.prisma.notification.update.mockResolvedValue({
        id: "n-1",
        isRead: true,
      });

      const response = await http()
        .patch("/api/notifications/n-1/read")
        .set(asEmployee())
        .expect(200);

      expect(response.body.isRead).toBe(true);
    });

    it("returns 404 for someone else's notification", async () => {
      testApp.prisma.notification.findFirst.mockResolvedValue(null);

      await http()
        .patch("/api/notifications/n-2/read")
        .set(asEmployee())
        .expect(404);
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    it("marks everything as read", async () => {
      const response = await http()
        .patch("/api/notifications/read-all")
        .set(asEmployee())
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(testApp.prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "employee-1", isRead: false },
        data: { isRead: true },
      });
    });

    it("returns 401 without a token", async () => {
      await http().patch("/api/notifications/read-all").expect(401);
    });
  });
});
