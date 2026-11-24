import { Module } from "@nestjs/common";
import { HolidaysModule } from "../holidays/holidays.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { VacationsController } from "./vacations.controller";
import { VacationsService } from "./vacations.service";

@Module({
  imports: [NotificationsModule, HolidaysModule],
  controllers: [VacationsController],
  providers: [VacationsService],
})
export class VacationsModule {}
