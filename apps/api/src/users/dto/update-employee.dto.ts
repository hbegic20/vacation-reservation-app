import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Trim } from "../../common/validators/trim";

export class UpdateEmployeeDto {
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsInt()
  @Min(1)
  @Max(365)
  vacationDaysTotal!: number;

  @IsBoolean()
  isActive!: boolean;
}
