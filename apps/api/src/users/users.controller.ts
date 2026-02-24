import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { UsersService } from "./users.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("employees")
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.usersService.createEmployee(dto);
  }

  @Get("employees")
  listEmployees() {
    return this.usersService.listEmployees();
  }

  @Get("employees/:id")
  getEmployeeById(@Param("id") id: string) {
    return this.usersService.getEmployeeById(id);
  }

  @Patch("employees/:id")
  updateEmployee(@Param("id") id: string, @Body() dto: UpdateEmployeeDto) {
    return this.usersService.updateEmployee(id, dto);
  }

  @Patch("employees/:id/reset-password")
  resetEmployeePassword(
    @Param("id") id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.usersService.resetEmployeePassword(id, dto);
  }

  @Post("admins")
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.usersService.createAdmin(dto);
  }

  @Get("admins")
  listAdmins() {
    return this.usersService.listAdmins();
  }
}
