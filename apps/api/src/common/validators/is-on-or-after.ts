import { ValidationArguments, registerDecorator } from "class-validator";

export function IsOnOrAfter(property: string) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName,
      constraints: [property],
      options: {
        message: `${propertyName} must be greater than or equal to ${property}`,
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
