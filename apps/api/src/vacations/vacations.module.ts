import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { VacationsController } from "./vacations.controller";
import { VacationsService } from "./vacations.service";

@Module({
  imports: [NotificationsModule],
  controllers: [VacationsController],
  providers: [VacationsService],
})
export class VacationsModule {}
