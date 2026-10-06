/* Every line marked @ts-expect-error must fail to compile. */
import { AjvObject, AjvProperty, AjvSchema, getSchema } from "../../index";

export class Address extends AjvSchema {
  @AjvProperty({ type: "string" })
  street?: string;
}

export class NotASchema {}

// @ts-expect-error object is not a property type
getSchema({ type: "object" });
// @ts-expect-error unknown type
getSchema({ type: "null" });
// @ts-expect-error missing type
getSchema({ minLength: 1 });
// @ts-expect-error a class that does not extend AjvSchema is not a schema
getSchema(NotASchema);

// keywords on the wrong type
// @ts-expect-error minimum on string
getSchema({ type: "string", minimum: 1 });
// @ts-expect-error pattern on formatted-string
getSchema({ type: "formatted-string", format: "email", pattern: "x" });
// @ts-expect-error minLength on number
getSchema({ type: "number", minLength: 1 });
// @ts-expect-error minLength on integer
getSchema({ type: "integer", minLength: 1 });
// @ts-expect-error boolean has no keywords
getSchema({ type: "boolean", minimum: 1 });
// @ts-expect-error minItems on string
getSchema({ type: "string", minItems: 1 });
// @ts-expect-error items on number
getSchema({ type: "number", items: { type: "string" } });
// @ts-expect-error format on plain string
getSchema({ type: "string", format: "email" });
// @ts-expect-error format is required on formatted-string
getSchema({ type: "formatted-string" });
// @ts-expect-error unknown format
getSchema({ type: "formatted-string", format: "phone" });
// @ts-expect-error minProperties is an object-only keyword
getSchema({ type: "string", minProperties: 1 });
// @ts-expect-error wrong value type
getSchema({ type: "string", minLength: "1" });
// @ts-expect-error wrong value type
getSchema({ type: "array", uniqueItems: 1 });

// nested schemas
// @ts-expect-error required is not allowed inside items
getSchema({ type: "array", items: { type: "string", required: true } });
// @ts-expect-error nullable is not allowed inside items
getSchema({ type: "array", items: { type: "string", nullable: true } });
// @ts-expect-error required is not allowed inside prefixItems
getSchema({ type: "array", prefixItems: [{ type: "string", required: true }] });
// @ts-expect-error nullable is not allowed inside contains
getSchema({ type: "array", contains: { type: "string", nullable: true } });
// @ts-expect-error wrong keyword inside items
getSchema({ type: "array", items: { type: "string", minimum: 1 } });
// @ts-expect-error items must be a schema
getSchema({ type: "array", items: "string" });
// @ts-expect-error items cannot be a non-schema class
getSchema({ type: "array", items: NotASchema });

// combinators
// @ts-expect-error type is not allowed in a sub-schema
getSchema({ type: "string", oneOf: [{ type: "string" }] });
// @ts-expect-error meta is not allowed in a sub-schema
getSchema({ type: "string", anyOf: [{ meta: { title: "x" } }] });
// @ts-expect-error required is not allowed in a sub-schema
getSchema({ type: "string", allOf: [{ required: true }] });
// @ts-expect-error nullable is not allowed in a sub-schema
getSchema({ type: "string", not: { nullable: true } });
// @ts-expect-error nested not is not allowed
getSchema({ type: "string", not: { not: { minLength: 1 } } });
// @ts-expect-error nested oneOf is not allowed
getSchema({ type: "number", oneOf: [{ oneOf: [{ minimum: 1 }] }] });
// @ts-expect-error nested anyOf is not allowed
getSchema({ type: "number", allOf: [{ anyOf: [{ minimum: 1 }] }] });
// @ts-expect-error nested allOf is not allowed
getSchema({ type: "number", anyOf: [{ allOf: [{ minimum: 1 }] }] });
// @ts-expect-error wrong-type keyword in a sub-schema
getSchema({ type: "string", oneOf: [{ minimum: 1 }] });
// @ts-expect-error not takes one object, not an array
getSchema({ type: "string", not: [{ minLength: 1 }] });
// @ts-expect-error oneOf takes an array
getSchema({ type: "string", oneOf: { minLength: 1 } });

// meta
// @ts-expect-error title only inside meta
getSchema({ type: "string", title: "x" });
// @ts-expect-error description only inside meta
getSchema({ type: "string", description: "x" });
// @ts-expect-error examples only inside meta
getSchema({ type: "string", examples: ["x"] });
// @ts-expect-error unknown meta key
getSchema({ type: "string", meta: { foo: 1 } });
// @ts-expect-error unknown contentEncoding
getSchema({ type: "string", meta: { contentEncoding: "utf8" } });
// @ts-expect-error title must be a string
getSchema({ type: "string", meta: { title: 1 } });
// @ts-expect-error examples must be an array
getSchema({ type: "string", meta: { examples: "x" } });

// json values
// @ts-expect-error functions are not JSON values
getSchema({ type: "string", const: () => 1 });
// @ts-expect-error nested non-JSON value
getSchema({ type: "string", enum: [{ a: () => 1 }] });
// @ts-expect-error undefined is not a JSON value
getSchema({ type: "string", default: [undefined] });

// AjvObject
// @ts-expect-error only classes extending AjvSchema
@AjvObject()
export class Bad1 {}

// @ts-expect-error object options have no type
@AjvObject({ type: "object" })
export class Bad2 extends AjvSchema {}

// @ts-expect-error additionalProperties true is not allowed
@AjvObject({ additionalProperties: true })
export class Bad3 extends AjvSchema {}

// @ts-expect-error dependentRequired requires the generic
@AjvObject({ dependentRequired: { a: ["b"] } })
export class Bad4 extends AjvSchema {
  @AjvProperty({ type: "string" })
  a?: string;

  @AjvProperty({ type: "string" })
  b?: string;
}

// @ts-expect-error dependentRequired key must be a property
@AjvObject<Bad5>({ dependentRequired: { nope: ["a"] } })
export class Bad5 extends AjvSchema {
  @AjvProperty({ type: "string" })
  a?: string;
}

// @ts-expect-error dependentRequired value must name other properties
@AjvObject<Bad6>({ dependentRequired: { a: ["nope"] } })
export class Bad6 extends AjvSchema {
  @AjvProperty({ type: "string" })
  a?: string;
}

// @ts-expect-error dependentRequired value must not include the key itself
@AjvObject<Bad7>({ dependentRequired: { a: ["a"] } })
export class Bad7 extends AjvSchema {
  @AjvProperty({ type: "string" })
  a?: string;

  @AjvProperty({ type: "string" })
  b?: string;
}

// @ts-expect-error object sub-schemas allow only enum, const and default
@AjvObject({ oneOf: [{ minProperties: 1 }] })
export class Bad8 extends AjvSchema {}

// @ts-expect-error object sub-schemas allow no meta
@AjvObject({ not: { meta: { title: "x" } } })
export class Bad9 extends AjvSchema {}

// @ts-expect-error string keywords are not object keywords
@AjvObject({ minLength: 1 })
export class Bad10 extends AjvSchema {}

// @ts-expect-error patternProperties values must be schemas
@AjvObject({ patternProperties: { "^x": "string" } })
export class Bad11 extends AjvSchema {}

// @ts-expect-error nested required is not allowed in patternProperties
@AjvObject({ patternProperties: { "^x": { type: "string", required: true } } })
export class Bad12 extends AjvSchema {}

// @ts-expect-error nested nullable is not allowed in additionalProperties
@AjvObject({ additionalProperties: { type: "string", nullable: true } })
export class Bad13 extends AjvSchema {}

// @ts-expect-error title only inside meta
@AjvObject({ title: "x" })
export class Bad14 extends AjvSchema {}

// @ts-expect-error minProperties must be a number
@AjvObject({ minProperties: "1" })
export class Bad15 extends AjvSchema {}

export class Bad16 extends AjvSchema {
  // @ts-expect-error AjvProperty rejects non-schema classes
  @AjvProperty(NotASchema)
  x?: NotASchema;

  // @ts-expect-error AjvProperty rejects wrong keywords
  @AjvProperty({ type: "boolean", maxLength: 1 })
  y?: boolean;
}

export class Bad17 {
  // @ts-expect-error AjvProperty only decorates fields of classes extending AjvSchema
  @AjvProperty({ type: "string" })
  x?: string;
}

export class Bad18 extends AjvSchema {
  // @ts-expect-error AjvProperty does not decorate static fields
  @AjvProperty({ type: "string" })
  static x?: string;

  // @ts-expect-error AjvProperty does not decorate private fields
  @AjvProperty({ type: "string" })
  #y?: string;
}

// @ts-expect-error fromJson needs an AjvSchema subclass
AjvSchema.fromJson(NotASchema, {});
