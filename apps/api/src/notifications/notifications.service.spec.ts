import { NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NotificationType } from "@prisma/client";
import {
  PrismaMock,
  asPrismaService,
  createPrismaMock,
} from "../../test/prisma-mock";
import { MailerService } from "./mailer.service";
import { NotificationsService } from "./notifications.service";

const payload = {
  type: NotificationType.VACATION_REQUEST_SUBMITTED,
  title: "New vacation request submitted",
  message: "John Employee requested vacation.",
};

describe("NotificationsService", () => {
  let prisma: PrismaMock;
  let mailer: { isEnabled: jest.Mock; send: jest.Mock };
  let fetchMock: jest.SpyInstance;

  function createService(settings: Record<string, string> = {}) {
    const config = {
      get: (key: string, fallback?: string) => settings[key] ?? fallback,
    };
    return new NotificationsService(
      asPrismaService(prisma),
      config as unknown as ConfigService,
      mailer as unknown as MailerService,
    );
  }

  beforeEach(() => {
    prisma = createPrismaMock();
    mailer = {
      isEnabled: jest.fn().mockReturnValue(false),
      send: jest.fn().mockResolvedValue(undefined),
    };
    fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
  });

  describe("createAndDispatch", () => {
    it("stores one notification per active admin", async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: "admin-1", email: "admin@company.com" },
        { id: "admin-2", email: "ops@company.com" },
      ]);

      await createService().createAndDispatch(payload);

      expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({
        role: "ADMIN",
        isActive: true,
      });
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          { userId: "admin-1", ...payload },
          { userId: "admin-2", ...payload },
        ],
      });
      expect(mailer.send).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("skips storing when there are no active admins", async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await createService().createAndDispatch(payload);

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    it("emails all active admins when email is enabled", async () => {
      mailer.isEnabled.mockReturnValue(true);
      prisma.user.findMany.mockResolvedValue([
        { id: "admin-1", email: "admin@company.com" },
        { id: "admin-2", email: "ops@company.com" },
      ]);

      await createService().createAndDispatch(payload);

      expect(mailer.send).toHaveBeenCalledWith({
        to: ["admin@company.com", "ops@company.com"],
        subject: payload.title,
        text: payload.message,
      });
    });

    it("posts to the Slack webhook when one is configured", async () => {
      prisma.user.findMany.mockResolvedValue([{ id: "admin-1" }]);

      await createService({
        SLACK_WEBHOOK_URL: "https://hooks.slack.test/abc",
      }).createAndDispatch(payload);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://hooks.slack.test/abc",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            text: `*${payload.title}*\n${payload.message}`,
          }),
        }),
      );
    });

    it("does not fail when Slack is down", async () => {
      prisma.user.findMany.mockResolvedValue([{ id: "admin-1" }]);
      fetchMock.mockRejectedValue(new Error("network down"));

      await expect(
        createService({
          SLACK_WEBHOOK_URL: "https://hooks.slack.test/abc",
        }).createAndDispatch(payload),
      ).resolves.toBeUndefined();
    });
  });

  describe("notifyEmployee", () => {
    const decision = {
      type: NotificationType.VACATION_APPROVED,
      title: "Vacation approved",
      message: "Your time off 22 Apr 2026 – 24 Apr 2026 was approved.",
    };

    it("stores an in-app notification and emails the employee", async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: "john.employee@company.com",
        isActive: true,
      });

      await createService().notifyEmployee("employee-1", decision);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId: "employee-1", ...decision },
      });
      expect(mailer.send).toHaveBeenCalledWith({
        to: ["john.employee@company.com"],
        subject: decision.title,
        text: decision.message,
      });
    });

    it("keeps the in-app notification but skips email for inactive employees", async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: "former@company.com",
        isActive: false,
      });

      await createService().notifyEmployee("employee-9", decision);

      expect(prisma.notification.create).toHaveBeenCalled();
      expect(mailer.send).not.toHaveBeenCalled();
    });

    it("does nothing for an unknown user", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await createService().notifyEmployee("missing", decision);

      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(mailer.send).not.toHaveBeenCalled();
    });
  });

  describe("notifyAllEmployees", () => {
    it("stores one in-app notification per active employee, without email", async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: "employee-1" },
        { id: "employee-2" },
      ]);

      await createService().notifyAllEmployees(payload);

      expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({
        role: "EMPLOYEE",
        isActive: true,
      });
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          { userId: "employee-1", ...payload },
          { userId: "employee-2", ...payload },
        ],
      });
      expect(mailer.send).not.toHaveBeenCalled();
    });

    it("does nothing when there are no active employees", async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await createService().notifyAllEmployees(payload);

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });

  it("lists only the user's unread notifications when asked", async () => {
    prisma.notification.findMany.mockResolvedValue([]);

    await createService().listForUser("employee-1", true);

    expect(prisma.notification.findMany.mock.calls[0][0].where).toEqual({
      userId: "employee-1",
      isRead: false,
    });
  });

  it("counts unread notifications", async () => {
    prisma.notification.count.mockResolvedValue(4);

    await expect(createService().getUnreadCount("admin-1")).resolves.toEqual({
      unread: 4,
    });
  });

  describe("markAsRead", () => {
    it("marks the user's own notification as read", async () => {
      prisma.notification.findFirst.mockResolvedValue({ id: "n-1" });
      prisma.notification.update.mockResolvedValue({ id: "n-1", isRead: true });

      await createService().markAsRead("employee-1", "n-1");

      expect(prisma.notification.findFirst.mock.calls[0][0].where).toEqual({
        id: "n-1",
        userId: "employee-1",
      });
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "n-1" },
        data: { isRead: true },
      });
    });

    it("refuses a notification that belongs to someone else", async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(
        createService().markAsRead("employee-1", "someone-elses"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });

  it("marks all unread notifications of the user as read", async () => {
    await expect(createService().markAllAsRead("employee-1")).resolves.toEqual({
      success: true,
    });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "employee-1", isRead: false },
      data: { isRead: true },
    });
  });

  it("sends a daily digest with pending and upcoming sick leave counts", async () => {
    prisma.vacationRequest.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);
    prisma.user.findMany.mockResolvedValue([{ id: "admin-1" }]);

    await createService().sendDailyDigest();

    expect(
      prisma.notification.createMany.mock.calls[0][0].data[0],
    ).toMatchObject({
      type: NotificationType.DAILY_DIGEST,
      message:
        "Daily digest: 3 pending approvals, 1 upcoming sick leave entries.",
    });
  });
});
