import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { MailerService } from "./mailer.service";
import { NotificationsService } from "./notifications.service";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, MailerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
