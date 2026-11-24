import { Module } from "@nestjs/common";
import { HolidaysController } from "./holidays.controller";
import { HolidaysService } from "./holidays.service";

@Module({
  providers: [HolidaysService],
  controllers: [HolidaysController],
  exports: [HolidaysService],
})
export class HolidaysModule {}
