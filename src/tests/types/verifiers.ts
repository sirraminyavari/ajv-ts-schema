/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any -- type-level assertions */
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty, AjvSchema, type AjvJsonSchema } from "../../index";

type Equals<A, B> =
  (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
const assertTrue = <V extends true>(_?: V) => {};

@AjvObject({ required: true })
class Address extends AjvSchema {
  @AjvProperty({ type: "string", required: true }) street!: string;
}

// ===== G. must compile =====
AjvProperty({
  type: "string",
  minLength: 1,
  maxLength: 2,
  pattern: "x",
  required: true,
  nullable: true,
});
AjvProperty({ type: "formatted-string", format: "email", minLength: 1, maxLength: 9 });
AjvProperty({
  type: "number",
  minimum: 0,
  maximum: 1,
  exclusiveMinimum: 0,
  exclusiveMaximum: 1,
  multipleOf: 1,
});
AjvProperty({ type: "integer", minimum: 0 });
AjvProperty({ type: "boolean", default: true });
AjvProperty({
  type: "array",
  prefixItems: [{ type: "string" }, Address],
  items: { type: "number" },
  contains: Address,
  minContains: 1,
  maxContains: 2,
  uniqueItems: true,
  minItems: 0,
  maxItems: 1,
});
AjvProperty(Address);
AjvProperty({
  type: "string",
  enum: ["a", 1, true, null, [1], { k: [null] }],
  const: { a: 1 },
  default: "x",
});
AjvProperty({
  type: "string",
  not: { minLength: 3 },
  oneOf: [{ maxLength: 1 }, { const: "x" }],
  anyOf: [{ pattern: "a" }],
  allOf: [{ enum: ["a"] }],
});
AjvProperty({
  type: "string",
  meta: {
    title: "t",
    description: "d",
    $comment: "c",
    examples: ["x", 1],
    readOnly: true,
    writeOnly: false,
    contentEncoding: "base64",
    contentMediaType: "image/png",
  },
});
AjvObject();
AjvObject({
  required: true,
  nullable: true,
  minProperties: 0,
  maxProperties: 1,
  patternProperties: { "^x": Address, "^y": { type: "number" } },
  additionalProperties: { type: "string" },
  meta: { title: "t" },
  enum: [{}],
  default: {},
  not: { const: {} },
});
AjvObject({ additionalProperties: false });
AjvObject({ additionalProperties: Address });
AjvObject<{ a: string; b: string; c?: number }>({ dependentRequired: { a: ["b", "c"], c: ["a"] } });
for (const format of [
  "email",
  "date",
  "time",
  "date-time",
  "iso-time",
  "iso-date",
  "duration",
  "hostname",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "uri-template",
  "uuid",
  "regex",
  "json-pointer",
  "relative-json-pointer",
  "byte",
  "int32",
  "int64",
  "float",
  "double",
  "password",
  "binary",
] as const) {
  AjvProperty({ type: "formatted-string", format });
}

// ===== H. must fail =====
// @ts-expect-error must fail
AjvProperty({ type: "string", minimum: 1 });
// @ts-expect-error must fail
AjvProperty({ type: "number", minLength: 1 });
// @ts-expect-error must fail
AjvProperty({ type: "integer", pattern: "x" });
// @ts-expect-error must fail
AjvProperty({ type: "boolean", minimum: 1 });
// @ts-expect-error must fail
AjvProperty({ type: "boolean", items: { type: "string" } });
// @ts-expect-error must fail
AjvProperty({ type: "array", minLength: 1 });
// @ts-expect-error must fail
AjvProperty({ type: "string", format: "email" });
// @ts-expect-error must fail
AjvProperty({ type: "formatted-string", format: "email", pattern: "x" });
// @ts-expect-error must fail
AjvProperty({ type: "object" });
// @ts-expect-error must fail
AjvProperty({ type: "null" });
// @ts-expect-error must fail
AjvProperty({ minLength: 1 });
// @ts-expect-error must fail
AjvProperty({ type: "formatted-string" });
// @ts-expect-error must fail
AjvProperty({ type: "formatted-string", format: "phone" });
// @ts-expect-error must fail
AjvProperty({ type: "string", minLength: "1" });
// @ts-expect-error must fail
AjvProperty({ type: "array", uniqueItems: "yes" });
// @ts-expect-error must fail
AjvProperty({ type: "string", enum: [undefined] });
// @ts-expect-error must fail
AjvProperty({ type: "string", default: () => 1 });
// @ts-expect-error must fail
AjvProperty({ type: "array", items: { type: "string", required: true } });
// @ts-expect-error must fail
AjvProperty({ type: "array", items: { type: "string", nullable: true } });
// @ts-expect-error must fail
AjvProperty({ type: "array", items: { type: "object" } });
// @ts-expect-error must fail
AjvProperty({ type: "string", not: { type: "string" } });
// @ts-expect-error must fail
AjvProperty({ type: "string", not: { minimum: 1 } });
// @ts-expect-error must fail
AjvProperty({ type: "string", oneOf: [{ minimum: 1 }] });
// @ts-expect-error must fail
AjvProperty({ type: "string", not: { not: { minLength: 1 } } });
// @ts-expect-error must fail
AjvProperty({ type: "string", meta: { contentEncoding: "utf8" } });
// @ts-expect-error must fail
AjvProperty({ type: "string", meta: { title: 1 } });
// @ts-expect-error must fail
AjvProperty({ type: "string", meta: { foo: 1 } });
// @ts-expect-error must fail
AjvProperty({ type: "string", title: "t" });
class NotSchema {}
// @ts-expect-error must fail
AjvProperty(NotSchema);
// @ts-expect-error must fail
AjvProperty({ type: "array", items: NotSchema });
// @ts-expect-error must fail
@AjvObject()
class PlainClass {}
void PlainClass;
// @ts-expect-error must fail
AjvObject({ type: "object" });
// @ts-expect-error must fail
AjvObject({ additionalProperties: true });
// @ts-expect-error must fail
AjvObject({ minProperties: "1" });
// @ts-expect-error must fail
AjvObject({ minLength: 1 });
// @ts-expect-error must fail
AjvObject({ not: { minLength: 1 } });
// @ts-expect-error must fail
AjvObject({ patternProperties: { "^x": { type: "object" } } });
// @ts-expect-error must fail
AjvObject({ dependentRequired: { a: ["b"] } });
// @ts-expect-error must fail
AjvObject<{ a: string; b: string }>({ dependentRequired: { a: ["a"] } });
// @ts-expect-error must fail
AjvObject<{ a: string; b: string }>({ dependentRequired: { c: ["a"] } });
// @ts-expect-error must fail
AjvObject<{ a: string; b: string }>({ dependentRequired: { a: ["z"] } });
// @ts-expect-error must fail
AjvObject<{ a: string; b: string }>({ dependentRequired: { a: "b" } });

// ===== I. typing of data =====
@AjvObject()
class User extends AjvSchema {
  @AjvProperty({ type: "formatted-string", format: "email", required: true }) email!: string;
  @AjvProperty({ type: "string", nullable: true }) name?: string | null;
  @AjvProperty({ type: "array", items: Address }) addresses!: Address[];
  @AjvProperty(Address) home!: Address;
}
declare const j: AjvJsonSchema<User>;

assertTrue<Equals<typeof j.email, string>>(); // I1
assertTrue<Equals<typeof j.home.street, string>>(); // I2
assertTrue<Equals<typeof j.addresses, AjvJsonSchema<Address>[]>>(); // I3
assertTrue<Equals<typeof j.name, string | null | undefined>>(); // I4
const ok: AjvJsonSchema<User> = { email: "a", home: { street: "s" }, addresses: [{ street: "t" }] }; // I5
const isUser = (x: any): x is AjvJsonSchema<User> => new Ajv().compile(User.getSchema())(x); // I6
const u: User = AjvSchema.fromJson(User, {}); // I7
const a: Address = AjvSchema.fromJson(Address, { street: "x" }); // I7
// @ts-expect-error must fail: I8
const bad8: AjvJsonSchema<User> = { email: "a", home: { street: 1 }, addresses: [] };
// @ts-expect-error must fail: I9
const bad9: AjvJsonSchema<User> = { home: { street: "s" }, addresses: [] };
// @ts-expect-error must fail: I10
const bad10: AjvJsonSchema<User> = { email: "a", home: { street: "s" }, addresses: [{}] };
// @ts-expect-error must fail: I11
const bad11: Address = AjvSchema.fromJson(User, {});
void [ok, isUser, u, a, bad8, bad9, bad10, bad11];
