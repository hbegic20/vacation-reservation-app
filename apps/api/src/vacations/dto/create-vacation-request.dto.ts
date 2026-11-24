import { Type } from "class-transformer";
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { IsOnOrAfter } from "../../common/validators/is-on-or-after";

export class CreateVacationRequestDto {
  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  @IsOnOrAfter("startDate")
  endDate!: Date;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  coverUserId?: string;
}
