import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { NotificationType, UserRole } from "@prisma/client";
import { RequestUser } from "../auth/types";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { detectFileType, safeFileName } from "./file-types";

export const maxDocumentBytes = 10 * 1024 * 1024;

const documentSummary = {
  id: true,
  title: true,
  description: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  isPublished: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  uploadedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

export interface UploadedDocumentFile {
  originalname: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  list(user: RequestUser) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.prisma.document.findMany({
      where: isAdmin ? {} : { isPublished: true },
      select: documentSummary,
      orderBy: isAdmin ? { createdAt: "desc" } : { publishedAt: "desc" },
    });
  }

  async create(
    uploaderId: string,
    dto: CreateDocumentDto,
    file: UploadedDocumentFile | undefined,
  ) {
    if (!file || file.size === 0) {
      throw new BadRequestException("Choose a file to upload");
    }
    if (file.size > maxDocumentBytes) {
      throw new BadRequestException("Files can be at most 10 MB");
    }

    const fileType = detectFileType(file.buffer);
    if (!fileType) {
      throw new BadRequestException(
        "Upload a PDF, PNG, JPG, WebP, Word (.docx) or Excel (.xlsx) file",
      );
    }

    return this.prisma.document.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        fileName: safeFileName(file.originalname, fileType.extension),
        mimeType: fileType.mimeType,
        sizeBytes: file.size,
        content: file.buffer,
        uploadedById: uploaderId,
      },
      select: documentSummary,
    });
  }

  async update(documentId: string, dto: UpdateDocumentDto) {
    const existing = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { isPublished: true, publishedAt: true },
    });
    if (!existing) {
      throw new NotFoundException("Document not found");
    }

    const isFirstPublication =
      dto.isPublished === true && !existing.publishedAt;
    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        title: dto.title,
        description:
          dto.description === undefined ? undefined : dto.description || null,
        isPublished: dto.isPublished,
        publishedAt: isFirstPublication ? new Date() : undefined,
      },
      select: documentSummary,
    });

    if (isFirstPublication) {
      await this.notificationsService.notifyAllEmployees({
        type: NotificationType.DOCUMENT_PUBLISHED,
        title: `New document: ${updated.title}`,
        message:
          updated.description ?? "A new document is available in Documents.",
        metadata: { documentId: updated.id },
      });
    }

    return updated;
  }

  async remove(documentId: string) {
    const existing = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException("Document not found");
    }

    await this.prisma.document.delete({ where: { id: documentId } });
    return { success: true };
  }

  async getFile(user: RequestUser, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        ...(user.role === UserRole.ADMIN ? {} : { isPublished: true }),
      },
      select: {
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        content: true,
      },
    });
    if (!document) {
      throw new NotFoundException("Document not found");
    }
    return document;
  }
}
