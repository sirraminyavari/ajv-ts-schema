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
  /**
   * The value of the keyword should be an array of unique items of any types.
   * The data is valid if it is deeply equal to one of items in the array.
   * e.g.
   * Schema: `{enum: [2, "foo", {foo: "bar" }, [1, 2, 3]]}`
   * Valid: `2`, `"foo"`, `{foo: "bar"}`, `[1, 2, 3]`
   * Invalid: `1`, `"bar"`, `{foo: "baz"}`, `[1, 2, 3, 4]`, any value not in enum
   */
  enum?: FreeValue[];

  /**
   * The value of this keyword can be anything. The data is valid if it is deeply equal to the value of the keyword.
   * e.g.
   * Schema: `{const: "foo"}`
   * Valid: `"foo"`
   * Invalid: any other value
   */
  const?: FreeValue;

  /**
   * Default value for the property.
   */
  default?: FreeValue;
};

type StringOptions = {
  /**
   * Minimum length of the string.
   */
  minLength?: number;

  /**
   * Maximum length of the string.
   */
  maxLength?: number;

  /**
   * Regexp pattern for string value.
   */
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
  /**
   * The array is valid if its size is greater than, or equal to, the value of this keyword.
   */
  minItems?: number;

  /**
   * The array is valid if its size is less than, or equal to, the value of this keyword.
   */
  maxItems?: number;

  /**
   * The array is valid if it does not contain any duplicate items.
   */
  uniqueItems?: boolean;

  /**
   * The array is valid if all the items with the same index as prefixItems are valid according to the schema.
   * e.g.
   * Schema: `{ prefixItems: [{ type: "string" }, { type: "number" }] }`
   * Valid: `["a", 1, "b", 2]`, `["a", 1]`
   * Invalid: `["a", "b", 2]`, `[1, "a"]`, `["a"]`
   */
  prefixItems?: JsonSchema[];

  /**
   * The array is valid if all its items are valid according to the schema.
   * If `prefixItems` is defined, this applies to the rest of the items after `prefixItems`.
   */
  items?: JsonSchema;

  /**
   * The array is valid if it contains at least one item that is valid according to the schema.
   */
  contains?: JsonSchema;

  /**
   * The array is valid if it contains at least `minContains` items
   * that are valid against the schema in `contains` keyword.
   * It is ignored if `contains` is not present.
   * e.g.
   * Schema: `{ contains: { type: "number" }, minContains: 2 }`
   * Valid: `[1, "a", 2]`, `[1, 2, 3]`
   * Invalid: `[1, "a"]`, `["a", "b", "c"]`
   */
  minContains?: number;

  /**
   * The array is valid if it contains no more than `maxContains` items
   * that are valid against the schema in `contains` keyword.
   * It is ignored if `contains` is not present.
   * e.g.
   * Schema: `{ contains: { type: "number" }, maxContains: 3 }`
   * Valid: `[1, "a", 2]`, `[1, 2, 3]`, `[1, "a", 2, 3]`
   * Invalid: `[1, "a", 2, "b", 3, 4]`, `[1, 2, 3, 4]`
   */
  maxContains?: number;
};

type GenericType<T extends string, Options extends object, AllOptions = Options & CommonOptions> = {
  type: T;

  /**
   * The data is valid if it is invalid according to this schema.
   * e.g.
   * Schema: `{ type: "number", not: { minimum: 3 } }`
   * Valid: `1`, `2`
   * Invalid: `3`, `4`
   */
  not?: AllOptions;

  /**
   * The data is valid if it is valid according to exactly one schema in this array.
   * e.g.
   * Schema: `{ type: "number", oneOf: [{maximum: 3}, {type: "integer"}] }`
   * Valid: `1.5`, `2.5`, `4`, `5`
   * Invalid: `2`, `3`, `4.5`, `5.5`
   */
  oneOf?: AllOptions[];

  /**
   * The data is valid if it is valid according to at least one schema in this array.
   * e.g.
   * Schema: `{ type: "number", oneOf: [{maximum: 3}, {type: "integer"}] }`
   * Valid: `1.5`, `2`, `2.5`, `3`, `4`, `5`
   * Invalid: `4.5`, `5.5`
   */
  anyOf?: AllOptions[];

  /**
   * The data is valid if it is valid according to all schemas in this array.
   * e.g.
   * Schema: `{ type: "number", oneOf: [{maximum: 3}, {type: "integer"}] }`
   * Valid: `2`, `3`
   * Invalid: `1.5`, `2.5`, `4`, `4.5`, `5`, `5.5`
   */
  allOf?: AllOptions[];
} & AllOptions & { meta?: MetaData };

/**
 * The purpose of this type is to define dependencies between properties in an object.
 * For example, if we have `{ a: "ramin"; b: "gesi" }` as a type,
 * we can define that 'a' requires 'b' as: `{ a: ["b"] }`.
 */
type PartialKeyedArray<T extends object> = {
  [K in keyof T]?: Array<Exclude<keyof T, K>>;
};

type ObjectOptions<T extends object | undefined = undefined> = {
  /**
   * Minimum number of properties.
   */
  maxProperties?: number;

  /**
   * Maximum number of properties.
   */
  minProperties?: number;

  /**
   * A map where keys are `regex` patterns and values are `JSON Schemas`.
   * The regular expressions **SHOULD NOT** match any `property` names in the schema.
   * e.g.
   * Schema:
   * ```
   * {
   *    patternProperties: {
   *      "^fo.*$": {type: "string"},
   *      "^ba.*$": {type: "number"}
   *    }
   * }
   * ```
   * Valid: `{}`, `{foo: "a"}`, `{foo: "a", bar: 1}`
   * Invalid: `{foo: 1}`, `{foo: "a", bar: "b"}`
   */
  patternProperties?: Record<string, JsonSchema>;

  /**
   * If `false`, the object must not have `additional properties`.
   * If has a value, all additional properties not mathcing `properties` and `patternProperties` must match the schema.
   */
  additionalProperties?: false | JsonSchema;

  /**
   * Defines the dependencies between properties.
   * e.g.
   * Schema: `{ dependentRequired: { foo: ["bar", "baz"] } }`
   * Valid: `{foo: 1, bar: 2, baz: 3}`, `{}`, `{a: 1}`
   * Invalid: `{foo: 1}`, `{foo: 1, bar: 2}`, `{foo: 1, baz: 3}`
   */
  dependentRequired?: T extends object ? PartialKeyedArray<T> : never;
};

type PropertyOptions =
  | GenericType<"string", StringOptions>
  | GenericType<"formatted-string", FormattedStringOptions>
  | GenericType<"integer", IntegerOptions>
  | GenericType<"number", NumberOptions>
  | GenericType<"boolean", {}>
  | GenericType<"array", ArrayOptions>;

type JsonSchema = PropertyOptions | typeof AjvSchema;

export function AjvProperty(
  options: (PropertyOptions & { required?: boolean; nullable?: boolean }) | typeof AjvSchema
) {
  return function (target: any, propertyKey: string) {
    const existingProperties = Reflect.getMetadata("properties", target) || {};
    existingProperties[propertyKey] = options;
    Reflect.defineMetadata("properties", existingProperties, target);
  };
}

function isSubclassOfAjvSchema(cls: Function | JsonSchema): boolean {
  while (cls) {
    if (cls === AjvSchema) {
      return true;
    }

    cls = Object.getPrototypeOf(cls);
  }

  return false;
}

const parseOptions = (options: any): object | undefined => {
  if (typeof options === "undefined") return undefined;
  else if (Array.isArray(options)) {
    return options.map((option) => parseOptions(option));
  } else if (isSubclassOfAjvSchema(options)) {
    return parseSchema(options);
  } else if (typeof options === "object") {
    return Object.keys(options).reduce<Record<string, any>>((acc, key) => {
      /**
       * Properties of free value types don't need conversion.
       * Because they are values not schemas.
       */
      if (["enum", "const", "default", "meta"].some((k) => k === key)) {
        acc[key] = options[key];
      } else if (key === "type" && options[key] === "formatted-string") {
        // 'formatted-string' is an alias for 'string' that is not supported by ajv. So we convert it to 'string'.
        acc["type"] = "string";
      } else if (key === "required") {
        // 'required' is handled separately.
        return acc;
      } else {
        acc[key] = parseOptions(options[key]);
      }

      return acc;
    }, {});
  } else {
    return options;
  }
};

const parseSchema = (schema: any): object | undefined => {
  if (!schema) return undefined;
  else if (isSubclassOfAjvSchema(schema)) {
    return (schema as typeof AjvSchema).getSchema();
  } else {
    return parseOptions(schema);
  }
};

export function AjvObject<T extends object | undefined = undefined>(options?: ObjectOptions<T>) {
  return function (constructor: typeof AjvSchema) {
    const properties = Reflect.getMetadata("properties", constructor.prototype) || {};

    const schema = {
      type: "object",
      ...(parseOptions(options) || {}),
      properties: Object.keys(properties).reduce(
        (acc, key) => {
          const schema = parseSchema(properties[key]);
          if (schema) acc[key] = schema;
          return acc;
        },
        {} as Record<string, unknown>
      ),
      required: Object.keys(properties).filter((key) => properties[key].required),
    };

    Reflect.defineMetadata("schema", schema, constructor);
  };
}

export const getSchema = (schema: JsonSchema): any => {
  return parseSchema(schema);
};

export class AjvSchema {
  static getSchema() {
    return Reflect.getMetadata("schema", this);
  }
}
