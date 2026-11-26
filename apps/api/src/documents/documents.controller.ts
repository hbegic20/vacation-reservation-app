import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@prisma/client";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequestUser } from "../auth/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { DocumentsService, maxDocumentBytes } from "./documents.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { contentDisposition, isPreviewable } from "./file-types";

@Controller("documents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.documentsService.list(user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: maxDocumentBytes, files: 1 },
    }),
  )
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentsService.create(user.id, dto, file);
  }

  @Get(":id/file")
  async file(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Query("download") download: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const document = await this.documentsService.getFile(user, id);
    const disposition =
      download === "1" || !isPreviewable(document.mimeType)
        ? "attachment"
        : "inline";
    response.set({
      "Content-Type": document.mimeType,
      "Content-Length": String(document.sizeBytes),
      "Content-Disposition": contentDisposition(disposition, document.fileName),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    return new StreamableFile(document.content);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  remove(@Param("id") id: string) {
    return this.documentsService.remove(id);
  }
}
