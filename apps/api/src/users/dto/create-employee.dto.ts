import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateEmployeeDto {
  @IsEmail()
  email!: string;

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

  @IsString()
  @MinLength(8)
  temporaryPassword!: string;

  @IsInt()
  @Min(1)
  @Max(365)
  vacationDaysTotal!: number;
}
