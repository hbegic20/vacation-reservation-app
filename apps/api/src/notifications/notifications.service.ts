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
import { MailerService } from "./mailer.service";

export interface NotificationPayload {
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
    private readonly mailer: MailerService,
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
    const admins = await this.activeAdmins();
    if (admins.length === 0) {
      return;
    }

    await this.prisma.notification.createMany({
      data: admins.map((admin) => ({ userId: admin.id, ...payload })),
    });
  }

  async createAndDispatch(payload: NotificationPayload) {
    await this.createForAllAdmins(payload);
    await Promise.all([this.sendSlack(payload), this.emailAdmins(payload)]);
  }

  async notifyEmployee(userId: string, payload: NotificationPayload) {
    const employee = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, isActive: true },
    });
    if (!employee) {
      return;
    }

    await this.prisma.notification.create({ data: { userId, ...payload } });

    if (employee.isActive) {
      await this.mailer.send({
        to: [employee.email],
        subject: payload.title,
        text: payload.message,
      });
    }
  }

  async notifyAllEmployees(payload: NotificationPayload) {
    const employees = await this.prisma.user.findMany({
      where: { role: UserRole.EMPLOYEE, isActive: true },
      select: { id: true },
    });
    if (employees.length === 0) {
      return;
    }

    await this.prisma.notification.createMany({
      data: employees.map((employee) => ({ userId: employee.id, ...payload })),
    });
  }

  listForUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
  }

  async getUnreadCount(userId: string) {
    const unread = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { unread };
  }

  async markAsRead(userId: string, notificationId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!existing) {
      throw new NotFoundException("Notification not found");
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
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

  private activeAdmins() {
    return this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true, email: true },
    });
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

  private async emailAdmins(payload: NotificationPayload) {
    if (!this.mailer.isEnabled()) {
      return;
    }

    const admins = await this.activeAdmins();
    await this.mailer.send({
      to: admins.map((admin) => admin.email),
      subject: payload.title,
      text: payload.message,
    });
  }
}
