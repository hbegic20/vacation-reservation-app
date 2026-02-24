import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateAdminDto {
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
  password!: string;
}
