import { Type } from "class-transformer";
import { IsDate, IsString, MaxLength, MinLength } from "class-validator";

export class CreateHolidayDto {
  @Type(() => Date)
  @IsDate()
  date!: Date;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
}
