/* Every usage in this file must compile cleanly. */
import { AjvJsonSchema, AjvObject, AjvProperty, AjvSchema, getSchema } from "../../index";

@AjvObject({ required: true, nullable: true, meta: { title: "Address" } })
export class Address extends AjvSchema {
  @AjvProperty({ type: "string", minLength: 1, maxLength: 10, pattern: "^.*$", required: true })
  street!: string;

  @AjvProperty({ type: "formatted-string", format: "ipv6", minLength: 1, maxLength: 40 })
  ip?: string;
}

@AjvObject<User>({
  enum: [{ a: 1 }],
  const: null,
  default: { x: [1, "a", true, null, { y: [] }] },
  meta: {
    title: "t",
    description: "d",
    $comment: "c",
    examples: [1, "a", { b: null }],
    readOnly: true,
    writeOnly: false,
    contentMediaType: "application/json",
    contentEncoding: "base64",
  },
  not: { const: 1 },
  oneOf: [{ enum: [1] }, { default: 2 }],
  anyOf: [{ const: "a" }],
  allOf: [{}],
  required: false,
  nullable: false,
  minProperties: 1,
  maxProperties: 10,
  patternProperties: { "^x-": { type: "number" }, "^y-": Address },
  additionalProperties: false,
  dependentRequired: { name: ["age"], age: ["name", "address"] },
})
export class User extends AjvSchema {
  @AjvProperty({ type: "string", required: true })
  name!: string;

  @AjvProperty({
    type: "integer",
    minimum: 0,
    maximum: 1,
    exclusiveMinimum: -1,
    exclusiveMaximum: 2,
    multipleOf: 1,
    nullable: true,
  })
  age?: number | null;

  @AjvProperty({
    type: "number",
    minimum: 0,
    oneOf: [{ maximum: 5 }, { multipleOf: 2, enum: [2] }],
  })
  score?: number;

  @AjvProperty({ type: "boolean", enum: [true], const: true, default: true, meta: { title: "b" } })
  flag?: boolean;

  @AjvProperty({
    type: "formatted-string",
    format: "email",
    not: { minLength: 100 },
    oneOf: [{ maxLength: 10 }, { minLength: 50, format: "uri" }],
  })
  email?: string;

  @AjvProperty(Address)
  address!: Address;

  @AjvProperty({
    type: "array",
    minItems: 0,
    maxItems: 5,
    uniqueItems: true,
    prefixItems: [
      { type: "string", pattern: "a" },
      Address,
      { type: "formatted-string", format: "uuid" },
    ],
    items: Address,
    contains: { type: "array", items: { type: "integer" } },
    minContains: 1,
    maxContains: 2,
    not: { minItems: 10 },
    allOf: [{ maxItems: 4, uniqueItems: true, items: { type: "boolean" } }],
  })
  previous?: Address[];

  @AjvProperty({ type: "string", enum: ["a", "b"], const: "a", default: "b" })
  role?: "a" | "b";
}

@AjvObject()
export class Plain extends AjvSchema {}

@AjvObject({ additionalProperties: { type: "string" } })
export class WithAdditional extends AjvSchema {}

@AjvObject({ additionalProperties: Address })
export class WithAdditionalClass extends AjvSchema {}

export const formats = [
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
] as const;
export const formatSchemas = formats.map((format) =>
  getSchema({ type: "formatted-string", format })
);

export const encodings = [
  "7bit",
  "8bit",
  "binary",
  "quoted-printable",
  "base64",
  "ietf-token",
  "x-token",
] as const;
export const encodingSchemas = encodings.map((contentEncoding) =>
  getSchema({ type: "string", meta: { contentEncoding } })
);

export const standalone1 = getSchema({ type: "string", required: true, nullable: true });
export const standalone2 = getSchema(User);
export const classSchema: object = User.getSchema();
export const instance: User = AjvSchema.fromJson(User, { name: "x" });

declare const validate: (x: unknown) => boolean;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const guard = (x: any): x is AjvJsonSchema<User> => validate(x);

declare const data: unknown;
if (guard(data)) {
  const name: string = data.name;
  const age: number | null | undefined = data.age;
  const street: string = data.address.street;
  const prev: string | undefined = data.previous?.[0]?.street;
  const role: "a" | "b" | undefined = data.role;
  void [name, age, street, prev, role];
}

type JsonUser = AjvJsonSchema<User>;
export const plainJson: JsonUser = {
  name: "n",
  address: { street: "s" },
  previous: [{ street: "p", ip: "::1" }],
};
