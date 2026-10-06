import { buildObjectSchema } from "./util";

/* ------------------------------------------------------------------ */
/* JSON values                                                          */
/* ------------------------------------------------------------------ */

export type JsonPrimitive = string | number | boolean | null;

/** Any JSON value: a primitive, an array of JSON values or an object of JSON values. */
export type JsonValue =
  JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

/* ------------------------------------------------------------------ */
/* Generated JSON Schema                                                */
/* ------------------------------------------------------------------ */

/** A generated JSON Schema object (plain JSON, accepted by Ajv). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonSchema = { [keyword: string]: any };

/** The JSON Schema generated for a class that extends `AjvSchema`. */
export interface ObjectJsonSchema extends JsonSchema {
  type: "object";
  properties: Record<string, JsonSchema>;
  required: string[];
}

/** A class that extends `AjvSchema`. */
export type AjvSchemaClass<T extends AjvSchema = AjvSchema> = (abstract new (
  ...args: never[]
) => T) & {
  getSchema(): ObjectJsonSchema;
};

/* ------------------------------------------------------------------ */
/* Formats and meta                                                     */
/* ------------------------------------------------------------------ */

/**
 * Formats require `ajv-formats` to be installed.
 * ```
 * import Ajv from "ajv/dist/2020";
 * import addFormats from "ajv-formats";
 *
 * const ajv = new Ajv({ ...options });
 * addFormats(ajv);
 * ```
 * https://github.com/ajv-validator/ajv-formats?tab=readme-ov-file
 */
export type AjvFormat =
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

export type AjvContentEncoding =
  "7bit" | "8bit" | "binary" | "quoted-printable" | "base64" | "ietf-token" | "x-token";

export interface AjvMeta {
  title?: string;
  description?: string;
  $comment?: string;
  examples?: readonly JsonValue[];
  readOnly?: boolean;
  writeOnly?: boolean;
  contentMediaType?: string;
  contentEncoding?: AjvContentEncoding;
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                      */
/* ------------------------------------------------------------------ */

/** Marks every key in `K` as not allowed. */
type Forbid<K extends PropertyKey> = { [P in K]?: never };

export interface AjvValueKeywords {
  /**
   * The value of the keyword should be an array of unique items of any types.
   * The data is valid if it is deeply equal to one of items in the array.
   * e.g.
   * Schema: `{ type: "array", enum: [2, "foo", {foo: "bar" }, [1, 2, 3]] }`
   * Valid: `[2]`, `["foo"]`, `[{foo: "bar"}]`, `[[1, 2, 3]]`
   * Invalid: `[1]`, `["bar"]`, `[{foo: "baz"}]`, `[[1, 2, 3, 4]]`, any value not in enum
   */
  enum?: readonly JsonValue[];

  /**
   * The value of this keyword can be anything. The data is valid if it is deeply equal to the value of the keyword.
   * e.g.
   * Schema: `{const: "foo"}`
   * Valid: `"foo"`
   * Invalid: any other value
   */
  const?: JsonValue;

  /**
   * Default value for the property.
   * It requires `useDefaults` option to be set to `true` in the `Ajv` instance.
   * e.g. `const ajv = new Ajv({ useDefaults: true });`
   */
  default?: JsonValue;
}

type SubSchemaForbidden =
  "type" | "meta" | "required" | "nullable" | "not" | "oneOf" | "anyOf" | "allOf";

/** A sub-schema of `not`/`oneOf`/`anyOf`/`allOf`: type-specific keywords plus enum/const/default. */
export type AjvSubSchema<K> = K & AjvValueKeywords & Forbid<SubSchemaForbidden>;

export interface AjvCombinators<K> {
  /**
   * The data is valid if it is invalid according to this schema.
   * e.g.
   * Schema: `{ type: "number", not: { minimum: 3 } }`
   * Valid: `1`, `2`
   * Invalid: `3`, `4`
   */
  not?: AjvSubSchema<K>;

  /**
   * The data is valid if it is valid according to exactly one schema in this array.
   * e.g.
   * Schema: `{ type: "number", oneOf: [{maximum: 3}, {multipleOf: 1}] }`
   * Valid: `1.5`, `2.5`, `4`, `5`
   * Invalid: `2`, `3`, `4.5`, `5.5`
   */
  oneOf?: readonly AjvSubSchema<K>[];

  /**
   * The data is valid if it is valid according to at least one schema in this array.
   * e.g.
   * Schema: `{ type: "number", anyOf: [{maximum: 3}, {multipleOf: 1}] }`
   * Valid: `1.5`, `2`, `2.5`, `3`, `4`, `5`
   * Invalid: `4.5`, `5.5`
   */
  anyOf?: readonly AjvSubSchema<K>[];

  /**
   * The data is valid if it is valid according to all schemas in this array.
   * e.g.
   * Schema: `{ type: "number", allOf: [{maximum: 3}, {multipleOf: 1}] }`
   * Valid: `2`, `3`
   * Invalid: `1.5`, `2.5`, `4`, `4.5`, `5`, `5.5`
   */
  allOf?: readonly AjvSubSchema<K>[];
}

/** Keywords every schema accepts: enum/const/default, meta and combinators. */
export interface AjvCommonKeywords<K> extends AjvValueKeywords, AjvCombinators<K> {
  meta?: AjvMeta;
}

/** Keywords allowed only at the top level of an `AjvProperty` or `AjvObject` argument. */
export interface AjvTopLevelKeywords {
  required?: boolean;
  nullable?: boolean;
}

/* ------------------------------------------------------------------ */
/* Type-specific keywords                                               */
/* ------------------------------------------------------------------ */

export interface AjvStringKeywords {
  /** Minimum length of the string. */
  minLength?: number;

  /** Maximum length of the string. */
  maxLength?: number;

  /** Regexp pattern for string value. */
  pattern?: string;
}

export interface AjvFormattedStringKeywords {
  /** Minimum length of the string. */
  minLength?: number;

  /** Maximum length of the string. */
  maxLength?: number;

  format: AjvFormat;
}

export interface AjvNumberKeywords {
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AjvBooleanKeywords {}

export interface AjvArrayKeywords {
  /** The array is valid if its size is greater than or equal to the value of this keyword. */
  minItems?: number;

  /** The array is valid if its size is less than or equal to the value of this keyword. */
  maxItems?: number;

  /** The array is valid if it does not contain any duplicate items. */
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
  prefixItems?: readonly AjvNestedSchema[];

  /**
   * The array is valid if all its items are valid according to the schema.
   * If `prefixItems` is defined, this applies to the rest of the items after `prefixItems`.
   */
  items?: AjvNestedSchema;

  /** The array is valid if it contains at least one item that is valid according to the schema. */
  contains?: AjvNestedSchema;

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
}

/* ------------------------------------------------------------------ */
/* Property schemas                                                     */
/* ------------------------------------------------------------------ */

type AjvPropertyMember<Name extends string, K, SubK = K> = { type: Name } & K &
  AjvCommonKeywords<SubK>;

export type AjvStringSchema = AjvPropertyMember<"string", AjvStringKeywords>;
/** 'formatted-string' is an alias for 'string' with a required `format`. It is emitted as `type: "string"`. */
export type AjvFormattedStringSchema = AjvPropertyMember<
  "formatted-string",
  AjvFormattedStringKeywords,
  Partial<AjvFormattedStringKeywords>
>;
export type AjvNumberSchema = AjvPropertyMember<"number", AjvNumberKeywords>;
export type AjvIntegerSchema = AjvPropertyMember<"integer", AjvNumberKeywords>;
export type AjvBooleanSchema = AjvPropertyMember<"boolean", AjvBooleanKeywords>;
export type AjvArraySchema = AjvPropertyMember<"array", AjvArrayKeywords>;

/** A property schema without the top-level-only keywords. */
export type AjvNestedSchemaOptions =
  | AjvStringSchema
  | AjvFormattedStringSchema
  | AjvNumberSchema
  | AjvIntegerSchema
  | AjvBooleanSchema
  | AjvArraySchema;

/** Anything accepted where a schema is expected inside another schema. */
export type AjvNestedSchema =
  (AjvNestedSchemaOptions & Forbid<keyof AjvTopLevelKeywords>) | AjvSchemaClass;

/** The options object accepted by `AjvProperty`. */
export type AjvPropertyOptions = AjvNestedSchemaOptions & AjvTopLevelKeywords;

/* ------------------------------------------------------------------ */
/* Object schemas                                                       */
/* ------------------------------------------------------------------ */

/**
 * Dependencies between properties of `T`.
 * e.g. for `{ a: string; b: string }`, `{ a: ["b"] }` means 'a' requires 'b'.
 */
export type AjvDependentRequired<T> = {
  [K in keyof T]?: readonly Exclude<keyof T, K>[];
};

/** The options object accepted by `AjvObject`. Combinator sub-schemas may contain only enum, const and default. */
export interface AjvObjectOptions<T extends object | undefined = undefined>
  extends AjvCommonKeywords<object>, AjvTopLevelKeywords {
  /** Minimum number of properties. */
  minProperties?: number;

  /** Maximum number of properties. */
  maxProperties?: number;

  /**
   * A map where keys are `regex` patterns and values are `JSON Schemas`.
   * The regular expressions **SHOULD NOT** match any `property` names in the schema.
   * e.g.
   * Schema: `{ patternProperties: { "^fo.*$": {type: "string"}, "^ba.*$": {type: "number"} } }`
   * Valid: `{}`, `{foo: "a"}`, `{foo: "a", bar: 1}`
   * Invalid: `{foo: 1}`, `{foo: "a", bar: "b"}`
   */
  patternProperties?: { readonly [pattern: string]: AjvNestedSchema };

  /**
   * If `false`, the object must not have additional properties.
   * If it is a schema, all properties not matching `properties` and `patternProperties` must match it.
   */
  additionalProperties?: false | AjvNestedSchema;

  /**
   * Defines the dependencies between properties. Requires the class type as the generic of `AjvObject`.
   * e.g.
   * Schema: `{ dependentRequired: { foo: ["bar", "baz"] } }`
   * Valid: `{}`, `{a: 1}`, `{foo: 1, bar: 2, baz: 3}`
   * Invalid: `{foo: 1}`, `{foo: 1, bar: 2}`, `{foo: 1, baz: 22}`
   */
  dependentRequired?: [T] extends [undefined] ? never : AjvDependentRequired<T>;
}

/* ------------------------------------------------------------------ */
/* Base class                                                           */
/* ------------------------------------------------------------------ */

export class AjvSchema {
  /** Nominal brand, so that only classes extending `AjvSchema` are accepted as schemas. */
  declare private readonly __ajvSchema: never;

  /** The JSON Schema for the class this is called on. Returns a new object on every call. */
  static getSchema(): ObjectJsonSchema {
    return buildObjectSchema(this);
  }

  /**
   * Converts a JSON object to an instance of a schema class that extends AjvSchema.
   * e.g.
   * If we have `class MySchema extends AjvSchema { foo: number; }` and `json = { foo: 2 }`,
   * `AjvSchema.fromJson(MySchema, json)` will return an instance of `MySchema` with `foo` set to `2`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromJson<T extends AjvSchema>(cls: new (...args: any[]) => T, json: any): T {
    return Object.assign(new cls(), json);
  }
}

/* ------------------------------------------------------------------ */
/* Plain-JSON type of validated data                                    */
/* ------------------------------------------------------------------ */

type JsonOf<V> = V extends readonly (infer U)[]
  ? [U] extends [AjvSchema]
    ? AjvJsonSchema<U>[]
    : V
  : V extends AjvSchema
    ? AjvJsonSchema<V>
    : V;

/** The plain-JSON type for a schema class: nested schema classes (also optional ones) become their JSON types. */
export type AjvJsonSchema<T extends AjvSchema> = {
  [K in keyof T]: JsonOf<T[K]>;
};
