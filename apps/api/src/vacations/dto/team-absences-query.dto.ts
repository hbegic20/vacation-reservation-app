import { Type } from "class-transformer";
import { IsDate } from "class-validator";
import { IsOnOrAfter } from "../../common/validators/is-on-or-after";

export class TeamAbsencesQueryDto {
  @Type(() => Date)
  @IsDate()
  from!: Date;

  @Type(() => Date)
  @IsDate()
  @IsOnOrAfter("from")
  to!: Date;
}
