import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { AbsenceType, NotificationType, VacationStatus } from "@prisma/client";
import { addDays, formatDateRange, toDateKey } from "../common/dates";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

const checkIntervalInMilliseconds = 60 * 60 * 1000;
const earliestReminderHourUtc = 7;

@Injectable()
export class RemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RemindersService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(
      () => this.runSafely(),
      checkIntervalInMilliseconds,
    );
    this.runSafely();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async sendDueReminders(now: Date = new Date()): Promise<number> {
    if (now.getUTCHours() < earliestReminderHourUtc) {
      return 0;
    }

    const tomorrow = addDays(toDateKey(now), 1);
    const due = await this.prisma.vacationRequest.findMany({
      where: {
        status: VacationStatus.APPROVED,
        absenceType: AbsenceType.VACATION,
        reminderSentAt: null,
        startDate: {
          gte: new Date(`${tomorrow}T00:00:00.000Z`),
          lt: new Date(`${addDays(tomorrow, 1)}T00:00:00.000Z`),
        },
      },
      include: {
        coverUser: { select: { firstName: true, lastName: true } },
      },
    });

    let sent = 0;
    for (const request of due) {
      const claimed = await this.prisma.vacationRequest.updateMany({
        where: { id: request.id, reminderSentAt: null },
        data: { reminderSentAt: now },
      });
      if (claimed.count === 0) {
        continue;
      }

      const handover = request.coverUser
        ? ` to ${request.coverUser.firstName} ${request.coverUser.lastName}`
        : "";
      await this.notificationsService.notifyEmployee(request.userId, {
        type: NotificationType.LEAVE_REMINDER,
        title: "Your time off starts tomorrow",
        message: `Your vacation ${formatDateRange(request.startDate, request.endDate)} starts tomorrow. Set your out-of-office reply and hand over open work${handover} before you leave.`,
        metadata: { requestId: request.id },
      });
      sent += 1;
    }
    return sent;
  }

  private runSafely() {
    this.sendDueReminders().catch((error: unknown) => {
      this.logger.error(
        `Leave reminders failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }
}
