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

export class UpdateEmployeeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

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
