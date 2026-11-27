import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestUser } from "./types";

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveUser(id: string): Promise<RequestUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user?.isActive) {
      return null;
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
