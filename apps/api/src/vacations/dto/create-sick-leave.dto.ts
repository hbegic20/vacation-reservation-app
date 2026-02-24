import { Type } from "class-transformer";
import {
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateSickLeaveDto {
  @IsString()
  userId!: string;

  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminComment?: string;
}
