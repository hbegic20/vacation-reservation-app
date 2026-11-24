import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequestUser } from "../auth/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query("unreadOnly") unreadOnly?: string,
  ) {
    return this.notificationsService.listForUser(
      user.id,
      unreadOnly === "true",
    );
  }

  @Get("unread-count")
  unreadCount(@CurrentUser() user: RequestUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch(":id/read")
  markRead(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }
}
