import { IsOptional, IsString, MaxLength } from "class-validator";

export class AdminCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminComment?: string;
}
