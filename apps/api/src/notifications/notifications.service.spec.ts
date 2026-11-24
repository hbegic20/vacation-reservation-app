import { NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NotificationType } from "@prisma/client";
import {
  PrismaMock,
  asPrismaService,
  createPrismaMock,
} from "../../test/prisma-mock";
import { NotificationsService } from "./notifications.service";

const payload = {
  type: NotificationType.VACATION_REQUEST_SUBMITTED,
  title: "New vacation request submitted",
  message: "John Employee requested vacation.",
};

describe("NotificationsService", () => {
  let prisma: PrismaMock;
  let fetchMock: jest.SpyInstance;

  function createService(settings: Record<string, string> = {}) {
    const config = {
      get: (key: string, fallback?: string) => settings[key] ?? fallback,
    };
    return new NotificationsService(
      asPrismaService(prisma),
      config as unknown as ConfigService,
    );
  }

  beforeEach(() => {
    prisma = createPrismaMock();
    fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
  });

  describe("createAndDispatch", () => {
    it("stores one notification per active admin and sends nothing external by default", async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: "admin-1" },
        { id: "admin-2" },
      ]);

      await createService().createAndDispatch(payload);

      expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({
        role: "ADMIN",
        isActive: true,
      });
      expect(prisma.adminNotification.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ adminId: "admin-1", type: payload.type }),
          expect.objectContaining({ adminId: "admin-2", type: payload.type }),
        ],
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("skips storing when there are no active admins", async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await createService().createAndDispatch(payload);

      expect(prisma.adminNotification.createMany).not.toHaveBeenCalled();
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

    it("emails active admins through Resend when configured", async () => {
      prisma.user.findMany
        .mockResolvedValueOnce([{ id: "admin-1" }])
        .mockResolvedValueOnce([{ email: "admin@company.com" }]);

      await createService({
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "re_test",
        EMAIL_FROM: "hub@company.com",
      }).createAndDispatch(payload);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.resend.com/emails");
      expect(init.headers.Authorization).toBe("Bearer re_test");
      expect(JSON.parse(init.body)).toEqual({
        from: "hub@company.com",
        to: ["admin@company.com"],
        subject: payload.title,
        text: payload.message,
      });
    });

    it("does not fail when an external channel is down", async () => {
      prisma.user.findMany.mockResolvedValue([{ id: "admin-1" }]);
      fetchMock.mockRejectedValue(new Error("network down"));

      await expect(
        createService({
          SLACK_WEBHOOK_URL: "https://hooks.slack.test/abc",
        }).createAndDispatch(payload),
      ).resolves.toBeUndefined();
    });
  });

  it("lists only unread notifications for the admin when asked", async () => {
    prisma.adminNotification.findMany.mockResolvedValue([]);

    await createService().listAdminNotifications("admin-1", true);

    expect(prisma.adminNotification.findMany.mock.calls[0][0].where).toEqual({
      adminId: "admin-1",
      isRead: false,
    });
  });

  it("counts unread notifications", async () => {
    prisma.adminNotification.count.mockResolvedValue(4);

    await expect(createService().getUnreadCount("admin-1")).resolves.toEqual({
      unread: 4,
    });
  });

  describe("markAsRead", () => {
    it("marks the admin's own notification as read", async () => {
      prisma.adminNotification.findFirst.mockResolvedValue({ id: "n-1" });
      prisma.adminNotification.update.mockResolvedValue({
        id: "n-1",
        isRead: true,
      });

      await createService().markAsRead("admin-1", "n-1");

      expect(prisma.adminNotification.findFirst.mock.calls[0][0].where).toEqual(
        {
          id: "n-1",
          adminId: "admin-1",
        },
      );
      expect(prisma.adminNotification.update).toHaveBeenCalledWith({
        where: { id: "n-1" },
        data: { isRead: true },
      });
    });

    it("refuses a notification that belongs to another admin", async () => {
      prisma.adminNotification.findFirst.mockResolvedValue(null);

      await expect(
        createService().markAsRead("admin-1", "someone-elses"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.adminNotification.update).not.toHaveBeenCalled();
    });
  });

  it("marks all unread notifications of the admin as read", async () => {
    await expect(createService().markAllAsRead("admin-1")).resolves.toEqual({
      success: true,
    });
    expect(prisma.adminNotification.updateMany).toHaveBeenCalledWith({
      where: { adminId: "admin-1", isRead: false },
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
      prisma.adminNotification.createMany.mock.calls[0][0].data[0],
    ).toMatchObject({
      type: NotificationType.DAILY_DIGEST,
      message:
        "Daily digest: 3 pending approvals, 1 upcoming sick leave entries.",
    });
  });
});
