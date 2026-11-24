import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Trim } from "../../common/validators/trim";

export class CreateAdminDto {
  @IsEmail()
  email!: string;

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

  @IsString()
  @MinLength(8)
  password!: string;
}
