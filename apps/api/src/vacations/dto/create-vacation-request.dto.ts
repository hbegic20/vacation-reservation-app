import { Type } from "class-transformer";
import {
  IsDate,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidationArguments,
  registerDecorator,
} from "class-validator";

function IsEndAfterStart(property: string) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName,
      constraints: [property],
      options: {
        message: "endDate must be greater than or equal to startDate",
      },
      validator: {
        validate(value: Date, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as Record<string, Date>)[
            relatedPropertyName
          ];
          if (!relatedValue || !value) {
            return true;
          }

          return new Date(value) >= new Date(relatedValue);
        },
      },
    });
  };
}

export class CreateVacationRequestDto {
  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  @IsEndAfterStart("startDate")
  endDate!: Date;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
