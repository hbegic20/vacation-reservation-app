import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequestUser } from "../auth/types";
import { AdminCommentDto } from "./dto/admin-comment.dto";
import { CreateSickLeaveDto } from "./dto/create-sick-leave.dto";
import { CreateVacationRequestDto } from "./dto/create-vacation-request.dto";
import { TeamAbsencesQueryDto } from "./dto/team-absences-query.dto";
import { VacationsService } from "./vacations.service";

@Controller("vacations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class VacationsController {
  constructor(private readonly vacationsService: VacationsService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE)
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateVacationRequestDto,
  ) {
    return this.vacationsService.createRequest(user, dto);
  }

  @Post("sick")
  @Roles(UserRole.ADMIN)
  createSickLeave(@Body() dto: CreateSickLeaveDto) {
    return this.vacationsService.createSickLeave(dto);
  }

  @Get()
  list(@CurrentUser() user: RequestUser) {
    if (user.role === UserRole.ADMIN) {
      return this.vacationsService.listAll();
    }

    return this.vacationsService.listForEmployee(user.id);
  }

  @Get("approved")
  @Roles(UserRole.ADMIN)
  listApproved() {
    return this.vacationsService.listApproved();
  }

  @Get("team")
  team(@CurrentUser() user: RequestUser, @Query() query: TeamAbsencesQueryDto) {
    return this.vacationsService.listTeamAbsences(user, query.from, query.to);
  }

  @Get("summary")
  summary(@CurrentUser() user: RequestUser) {
    return this.vacationsService.getSummary(user);
  }

  @Get("calendar")
  @Roles(UserRole.ADMIN)
  calendar(@Query("year") year?: string) {
    const parsedYear = year ? Number(year) : new Date().getUTCFullYear();
    return this.vacationsService.getCalendarByYear(parsedYear);
  }

  @Patch(":id/cancel")
  @Roles(UserRole.EMPLOYEE)
  cancel(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.vacationsService.cancel(user, id);
  }

  @Patch(":id/approve")
  @Roles(UserRole.ADMIN)
  approve(@Param("id") id: string, @Body() dto: AdminCommentDto) {
    return this.vacationsService.approve(id, dto.adminComment);
  }

  @Patch(":id/reject")
  @Roles(UserRole.ADMIN)
  reject(@Param("id") id: string, @Body() dto: AdminCommentDto) {
    return this.vacationsService.reject(id, dto.adminComment);
  }
}
