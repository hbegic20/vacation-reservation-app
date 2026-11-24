import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateHolidayDto } from "./dto/create-holiday.dto";
import { HolidaysService } from "./holidays.service";

@Controller("holidays")
@UseGuards(JwtAuthGuard, RolesGuard)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  list(@Query("year") year?: string) {
    const parsedYear = year ? Number(year) : new Date().getUTCFullYear();
    return this.holidaysService.listForYear(parsedYear);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateHolidayDto) {
    return this.holidaysService.create(dto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  remove(@Param("id") id: string) {
    return this.holidaysService.remove(id);
  }
}
