import "reflect-metadata";

type FreeValue = string | number | boolean | null | FreeValue[] | { [key: string]: FreeValue };

type MetaData = {
  title?: string;
  description?: string;
  $comment?: string;
  examples?: FreeValue[];
  readOnly?: boolean;
  writeOnly?: boolean;
  contentEncoding?:
    | "7bit"
    | "8bit"
    | "binary"
    | "quoted-printable"
    | "base64"
    | "ietf-token"
    | "x-token";
  contentMediaType?: string;
};

type CommonOptions = {
  enum?: FreeValue[];
  const?: FreeValue;
  default?: FreeValue;
};

type StringOptions = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

type FormattedStringOptions = {
  /* https://github.com/ajv-validator/ajv-formats?tab=readme-ov-file */
  format:
    | "email"
    | "date"
    | "time"
    | "date-time"
    | "iso-time"
    | "iso-date"
    | "duration"
    | "hostname"
    | "ipv4"
    | "ipv6"
    | "uri"
    | "uri-reference"
    | "uri-template"
    | "uuid"
    | "regex"
    | "json-pointer"
    | "relative-json-pointer"
    | "byte"
    | "int32"
    | "int64"
    | "float"
    | "double"
    | "password"
    | "binary";
  formatMaximum?: string;
  formatMinimum?: string;
  formatExclusiveMaximum?: string;
  formatExclusiveMinimum?: string;
};

type IntegerOptions = {
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
};

type NumberOptions = {
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
};

type ArrayOptions = {
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
};

type GenericType<T extends string, Options extends object, AllOptions = Options & CommonOptions> = {
  type: T;
  not?: AllOptions;
  oneOf?: AllOptions[];
  anyOf?: AllOptions[];
  allOf?: AllOptions[];
} & AllOptions & { meta?: MetaData };

/**
 * The purpose of this type is to define dependencies between properties in an object.
 * For example, if we have '{ a: "ramin"; b: "gesi" }' as a type,
 * we can define that 'a' requires 'b' as: '{ a: ["b"] }'.
 */
type PartialKeyedArray<T extends object> = {
  [K in keyof T]?: Array<Exclude<keyof T, K>>;
};

type ObjectOptions<T extends object | undefined = undefined> = {
  maxProperties?: number;
  minProperties?: number;
  patternProperties?: Record<string, string>;
  additionalProperties?: boolean;
  dependentRequired?: T extends object ? PartialKeyedArray<T> : never;
};

type PropertyOptions /*<T extends object | undefined = undefined>*/ =
  | GenericType<"string", StringOptions>
  | GenericType<"string", FormattedStringOptions>
  | GenericType<"integer", IntegerOptions>
  | GenericType<"number", NumberOptions>
  | GenericType<"boolean", {}>
  | GenericType<"array", ArrayOptions>;
//| GenericType<"object", ObjectOptions<T>>;

export function AjvProperty(
  options: (PropertyOptions & { required?: boolean; nullable?: boolean }) | typeof AjvSchemaBase
) {
  return function (target: any, propertyKey: string) {
    const existingProperties = Reflect.getMetadata("properties", target) || {};
    existingProperties[propertyKey] = options;
    Reflect.defineMetadata("properties", existingProperties, target);
  };
}

export function AjvObject<T extends object | undefined = undefined>(options?: ObjectOptions<T>) {
  return function (constructor: typeof AjvSchemaBase) {
    const properties = Reflect.getMetadata("properties", constructor.prototype) || {};

    const schema = {
      type: "object",
      properties: {
        body: {
          type: "object",
          minProperties: options?.minProperties,
          maxProperties: options?.maxProperties,
          patternProperties: options?.patternProperties,
          additionalProperties: options?.additionalProperties,
          dependentRequired: options?.dependentRequired,
          properties: Object.keys(properties).reduce(
            (acc, key) => {
              if (typeof properties[key] === typeof AjvSchemaBase) {
                acc[key] = properties[key].getSchema().properties.body;
              } else {
                /**
                 * Extract some keys such as 'required' from the options and remove it from the rest of the properties.
                 */
                const { required, ...prop } = properties[key];
                acc[key] = { ...prop };
              }
              return acc;
            },
            {} as Record<string, unknown>
          ),
          required: Object.keys(properties).filter((key) => properties[key].required),
        },
      },
    };

    Reflect.defineMetadata("schema", schema, constructor);
  };
}

export class AjvSchemaBase {
  static getSchema() {
    return Reflect.getMetadata("schema", this);
  }
}
