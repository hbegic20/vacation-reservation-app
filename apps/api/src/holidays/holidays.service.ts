import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { countWorkingDays, startOfUtcDay, toDateKey } from "../common/dates";
import { CreateHolidayDto } from "./dto/create-holiday.dto";

const minYear = 2000;
const maxYear = 2100;

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  listForYear(year: number) {
    if (!Number.isInteger(year) || year < minYear || year > maxYear) {
      throw new BadRequestException(
        `year must be a number between ${minYear} and ${maxYear}`,
      );
    }

    return this.prisma.publicHoliday.findMany({
      where: {
        date: {
          gte: new Date(Date.UTC(year, 0, 1)),
          lt: new Date(Date.UTC(year + 1, 0, 1)),
        },
      },
      orderBy: { date: "asc" },
    });
  }

  async create(dto: CreateHolidayDto) {
    const date = startOfUtcDay(dto.date);
    const existing = await this.prisma.publicHoliday.findUnique({
      where: { date },
    });
    if (existing) {
      throw new ConflictException(
        `${toDateKey(date)} is already a holiday (${existing.name})`,
      );
    }

    return this.prisma.publicHoliday.create({
      data: { date, name: dto.name.trim() },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.publicHoliday.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException("Holiday not found");
    }

    await this.prisma.publicHoliday.delete({ where: { id } });
    return { success: true };
  }

  async countWorkingDays(startDate: Date, endDate: Date): Promise<number> {
    const holidays = await this.prisma.publicHoliday.findMany({
      where: {
        date: { gte: startOfUtcDay(startDate), lte: startOfUtcDay(endDate) },
      },
      select: { date: true },
    });
    const holidayKeys = new Set(holidays.map(({ date }) => toDateKey(date)));
    return countWorkingDays(startDate, endDate, holidayKeys);
  }
}
