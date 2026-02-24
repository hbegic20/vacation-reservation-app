import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequestUser } from "../auth/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("admin")
  listAdminNotifications(
    @CurrentUser() user: RequestUser,
    @Query("unreadOnly") unreadOnly?: string,
  ) {
    return this.notificationsService.listAdminNotifications(
      user.id,
      unreadOnly === "true",
    );
  }

  @Get("admin/unread-count")
  unreadCount(@CurrentUser() user: RequestUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(":id/read")
  markRead(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
