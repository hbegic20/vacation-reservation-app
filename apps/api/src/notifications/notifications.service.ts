import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AbsenceType,
  NotificationType,
  Prisma,
  UserRole,
  VacationStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private digestTimer: NodeJS.Timeout | null = null;
  private lastDigestDate = "";

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    // Daily digest polling without external scheduler dependency.
    this.digestTimer = setInterval(
      () => {
        void this.runDigestIfDue();
      },
      60 * 60 * 1000,
    );
    void this.runDigestIfDue();
  }

  onModuleDestroy() {
    if (this.digestTimer) {
      clearInterval(this.digestTimer);
    }
  }

  private async runDigestIfDue() {
    const now = new Date();
    const utcDate = now.toISOString().slice(0, 10);
    const utcHour = now.getUTCHours();

    if (utcHour !== 8 || this.lastDigestDate === utcDate) {
      return;
    }

    this.lastDigestDate = utcDate;
    await this.sendDailyDigest();
  }

  async createForAllAdmins(payload: NotificationPayload) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        isActive: true,
      },
      select: { id: true },
    });

    if (admins.length === 0) {
      return;
    }

    await this.prisma.adminNotification.createMany({
      data: admins.map((admin) => ({
        adminId: admin.id,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata,
      })),
    });
  }

  async createAndDispatch(payload: NotificationPayload) {
    await this.createForAllAdmins(payload);
    await this.dispatchExternal(payload);
  }

  async listAdminNotifications(adminId: string, unreadOnly = false) {
    return this.prisma.adminNotification.findMany({
      where: {
        adminId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
  }

  async getUnreadCount(adminId: string) {
    const unread = await this.prisma.adminNotification.count({
      where: { adminId, isRead: false },
    });

    return { unread };
  }

  async markAsRead(adminId: string, notificationId: string) {
    const existing = await this.prisma.adminNotification.findFirst({
      where: {
        id: notificationId,
        adminId,
      },
    });

    if (!existing) {
      throw new NotFoundException("Notification not found");
    }

    return this.prisma.adminNotification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(adminId: string) {
    await this.prisma.adminNotification.updateMany({
      where: {
        adminId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  }

  async sendDailyDigest() {
    const [pending, upcomingSickLeaves] = await Promise.all([
      this.prisma.vacationRequest.count({
        where: { status: VacationStatus.PENDING },
      }),
      this.prisma.vacationRequest.count({
        where: {
          absenceType: AbsenceType.SICK,
          startDate: { gte: new Date() },
        },
      }),
    ]);

    const message = `Daily digest: ${pending} pending approvals, ${upcomingSickLeaves} upcoming sick leave entries.`;

    await this.createAndDispatch({
      type: NotificationType.DAILY_DIGEST,
      title: "Daily admin digest",
      message,
      metadata: { pending, upcomingSickLeaves },
    });
  }

  private async dispatchExternal(payload: NotificationPayload) {
    await Promise.all([this.sendSlack(payload), this.sendEmail(payload)]);
  }

  private async sendSlack(payload: NotificationPayload) {
    const webhook = this.config.get<string>("SLACK_WEBHOOK_URL");
    if (!webhook) {
      return;
    }

    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `*${payload.title}*\n${payload.message}` }),
    }).catch(() => undefined);
  }

  private async sendEmail(payload: NotificationPayload) {
    const provider = this.config.get<string>("EMAIL_PROVIDER", "");

    if (provider === "resend") {
      await this.sendEmailResend(payload);
    }
  }

  private async sendEmailResend(payload: NotificationPayload) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    const from = this.config.get<string>("EMAIL_FROM");

    if (!apiKey || !from) {
      return;
    }

    const admins = await this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        isActive: true,
      },
      select: { email: true },
    });

    if (admins.length === 0) {
      return;
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: admins.map((admin) => admin.email),
        subject: payload.title,
        text: payload.message,
      }),
    }).catch(() => undefined);
  }
}
