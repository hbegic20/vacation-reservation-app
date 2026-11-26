import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Trim } from "../../common/validators/trim";

export class CreateDocumentDto {
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
