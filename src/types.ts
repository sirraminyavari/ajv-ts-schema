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
   * Schema: `{ type: "array", enum: [2, "foo", {foo: "bar" }, [1, 2, 3]] }`
   * Valid: `[2]`, `["foo"]`, `[{foo: "bar"}]`, `[[1, 2, 3]]`
   * Invalid: `[1]`, `["bar"]`, `[{foo: "baz"}]`, `[[1, 2, 3, 4]]`, any value not in enum
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
   * It requires `useDefaults` option to be set to `true` in the `Ajv` instance.
   * e.g. `const ajv = new Ajv({ useDefaults: true });`
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
  /**
   * Minimum length of the string.
   */
  minLength?: number;

  /**
   * Maximum length of the string.
   */
  maxLength?: number;

  /**
   * This requires `ajv-formats` to be installed.
   * ```
   * import Ajv from "ajv/dist/2020";
   * import addFormats from "ajv-formats";
   *
   * const ajv = new Ajv({ ...options });
   * addFormats(ajv);
   * ```
   * https://github.com/ajv-validator/ajv-formats?tab=readme-ov-file
   */
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

type NumberOptions = {
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
};

type ArrayOptions = {
  /**
   * The array is valid if its size is greater than or equal to the value of this keyword.
   */
  minItems?: number;

  /**
   * The array is valid if its size is less than or equal to the value of this keyword.
   */
  maxItems?: number;

  /**
   * The array is valid if it does not contain any duplicate items.
   */
  uniqueItems?: boolean;

  /**
   * The array is valid if all the items with the same index as prefixItems are valid according to the schema.
   * prefixItems doesn't enforce the length of the array.
   * If the array is shorter than prefixItems, only the provided items are checked.
   * e.g.
   * Schema: `{ prefixItems: [{ type: "string" }, { type: "number" }] }`
   * Valid: `["a", 1, "b", 2]`, `["a", 1]`, `["a"]`
   * Invalid: `["a", "b", 2]`, `[1, "a"]`
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
   * Schema: `{ type: "number", oneOf: [{maximum: 3}, {multipleOf: 1}] }`
   * Valid: `1.5`, `2.5`, `4`, `5`
   * Invalid: `2`, `3`, `4.5`, `5.5`
   */
  oneOf?: AllOptions[];

  /**
   * The data is valid if it is valid according to at least one schema in this array.
   * e.g.
   * Schema: `{ type: "number", oneOf: [{maximum: 3}, {multipleOf: 1}] }`
   * Valid: `1.5`, `2`, `2.5`, `3`, `4`, `5`
   * Invalid: `4.5`, `5.5`
   */
  anyOf?: AllOptions[];

  /**
   * The data is valid if it is valid according to all schemas in this array.
   * e.g.
   * Schema: `{ type: "number", oneOf: [{maximum: 3}, {multipleOf: 1}] }`
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

export type ObjectOptions<T extends object | undefined = undefined> = Omit<
  GenericType<"object", {}>,
  "type"
> & {
  /**
   * Maximum number of properties.
   */
  minProperties?: number;

  /**
   * Minimum number of properties.
   */
  maxProperties?: number;

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
   * If `false`, the object must not have `additionalProperties`.
   * If has a value, all additional properties not mathcing `properties` and `patternProperties` must match the schema.
   */
  additionalProperties?: false | JsonSchema;

  /**
   * Defines the dependencies between properties.
   * e.g.
   * Schema: `{ dependentRequired: { foo: ["bar", "baz"] } }`
   * Valid: `{}`, `{a: 1}`, `{foo: 1, bar: 2, baz: 3}`
   * Invalid: `{foo: 1}`, `{foo: 1, bar: 2}`, `{foo: 1, baz: 22}`
   */
  dependentRequired?: T extends object ? PartialKeyedArray<T> : never;
};

export type PropertyOptions =
  | GenericType<"string", StringOptions>
  | GenericType<"formatted-string", FormattedStringOptions>
  | GenericType<"number", NumberOptions>
  | GenericType<"integer", NumberOptions>
  | GenericType<"boolean", {}>
  | GenericType<"array", ArrayOptions>;

export type JsonSchema = PropertyOptions | typeof AjvSchema;

export class AjvSchema {
  static getSchema() {
    return Reflect.getMetadata("schema", this);
  }

  /**
   * Converts a JSON object to an instance of a schema class that extends AjvSchema.
   * e.g.
   * If we have `class MySchema extends AjvSchema { foo: number; }` and `json = { foo: 2 }`,
   * `AjvSchema.fromJson(MySchema, json)` will return an instance of `MySchema` with `foo` set to `2`.
   */
  static fromJson = <T>(cls: new (...args: any[]) => T, json: any): T => {
    const instance = new cls();

    Object.keys(json).forEach((key) => {
      let value: unknown = undefined;

      if (json[key] && typeof json[key] === "object" && cls.prototype[key]?.constructor) {
        value = this.fromJson(cls.prototype[key].constructor, json[key]);
      } else {
        value = json[key];
      }

      (instance as Record<string, unknown>)[key] = value;
    });

    return instance;
  };
}
