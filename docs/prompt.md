GOAL

Build a TypeScript library that lets someone define an AJV JSON Schema (draft 2020-12) by writing a TypeScript class whose fields have decorators. The class must produce a plain JSON Schema object that `ajv/dist/2020` accepts, with `ajv-formats` registered. The TypeScript compiler must reject schema definitions that are wrong.

"Type-safe" has two meanings here, and both are required:

1. Invalid schema options cause a compile-time error. Examples: a keyword used with the wrong `type`, an unknown `format`, or a `dependentRequired` entry that names a property the class doesn't have.
2. Data that passed validation can be typed as a plain-JSON version of the class.


PUBLIC API (exact names, one entry module)

- `AjvSchema`: a base class. Every schema class extends it.
  - `static getSchema()`: returns the generated JSON Schema object for the class it is called on.
  - `static fromJson<T extends AjvSchema>(cls: new (...args: any[]) => T, json: any): T`: returns `new cls()` with every own key of `json` assigned onto it.
- `AjvObject<T extends object | undefined = undefined>(options?)`: a class decorator. It can only be applied to classes that extend `AjvSchema`.
- `AjvProperty(options | SchemaClass)`: a property decorator. Its argument is either an options object or a class that extends `AjvSchema`.
- `getSchema(schema)`: converts one property-options object, or one schema class, into JSON Schema without needing a class around it.
- `type AjvJsonSchema<T extends AjvSchema>`: the plain-JSON type for a schema class.

Both decorators are TypeScript legacy decorators (`experimentalDecorators: true`).


OPTIONS ACCEPTED BY `AjvProperty`

The argument is a discriminated union on `type`. Each member allows only the keywords listed for it:

- `type: "string"` allows `minLength`, `maxLength`, `pattern`.
- `type: "formatted-string"` allows `minLength`, `maxLength`, and a required `format`.
- `type: "number"` and `type: "integer"` allow `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`.
- `type: "boolean"` allows no type-specific keywords.
- `type: "array"` allows `minItems`, `maxItems`, `uniqueItems`, `prefixItems` (array of schemas), `items` (schema), `contains` (schema), `minContains`, `maxContains`.

No other `type` value is allowed. In particular, `"object"` is not a property type: object-valued properties are expressed by passing a schema class.

`format` must be one of these strings: email, date, time, date-time, iso-time, iso-date, duration, hostname, ipv4, ipv6, uri, uri-reference, uri-template, uuid, regex, json-pointer, relative-json-pointer, byte, int32, int64, float, double, password, binary.

Every member also accepts:

- `enum`, `const`, `default`. Their values are any JSON value: string, number, boolean, null, an array of these, or an object of these.
- `not` (one object), and `oneOf`, `anyOf`, `allOf` (arrays of objects). These sub-schemas may contain only the member's type-specific keywords plus `enum`, `const` and `default`. They may not contain `type`, `meta`, `required`, `nullable`, or another `not`/`oneOf`/`anyOf`/`allOf`.
- `meta`: an object with optional `title`, `description`, `$comment`, `examples` (an array of JSON values), `readOnly`, `writeOnly`, `contentMediaType` (string) and `contentEncoding` (one of `7bit`, `8bit`, `binary`, `quoted-printable`, `base64`, `ietf-token`, `x-token`). These keys are allowed only inside `meta`, not at the top level.
- `required?: boolean` and `nullable?: boolean`. These are allowed only at the top level of the `AjvProperty` argument. They are not allowed inside nested schemas such as `items`.

Wherever a "schema" is accepted (`items`, `prefixItems[]`, `contains`, `patternProperties` values, `additionalProperties`), it is either a property-options object (without `required`/`nullable`) or a class that extends `AjvSchema`.


OPTIONS ACCEPTED BY `AjvObject`

`AjvObject` takes no `type`. It accepts:

- `enum`, `const`, `default` and `meta`, as above.
- `not`, `oneOf`, `anyOf` and `allOf`, whose sub-schemas may contain only `enum`, `const` and `default`.
- `required?: boolean` and `nullable?: boolean`. These apply wherever the class is used as a property.
- `minProperties` and `maxProperties` (numbers).
- `patternProperties`: a record of regex string to schema.
- `additionalProperties`: `false` or a schema. `true` is not allowed.
- `dependentRequired`: allowed only when the generic `T` is given. Each key must be a key of `T`. Each value is an array of the other keys of `T`, and must not include the key itself. When `T` is not given, any `dependentRequired` value is a compile error.


RULES FOR THE GENERATED SCHEMA

For a class decorated with `AjvObject(options)`, `getSchema()` returns an object with:

- `type: "object"`
- every option from `AjvObject`, converted using the rules below
- `properties`: one entry per decorated field, keyed by field name, holding that field's converted schema. Fields without a decorator are not included.
- `required`: an array of the field names that are required. The array is always present, even when it is empty.

Conversion rules, applied recursively at every depth:

1. A schema class is replaced by its own `getSchema()` output.
2. `type: "formatted-string"` becomes `type: "string"`. `format` and the other keywords are kept.
3. The `required` key is removed from the output. A field counts as required when its options have `required: true`, or when it is a class reference and that class was decorated with `AjvObject({ required: true })`.
4. The values of `enum`, `const`, `default` and `meta` are copied exactly as given, without conversion, even if they contain keys such as `type` or `required`. `meta` stays a nested `meta` key in the output and is not merged into the schema.
5. `nullable` is passed through unchanged.
6. Arrays are converted element by element. Primitives and `false` are kept as they are.

`getSchema(x)` applies the same rules to a single options object or class.

Each class's schema contains only its own decorated fields. Two classes in the same module must never share or leak properties.


TYPING VALIDATED DATA

`AjvJsonSchema<T>` maps each key `K` of `T` as follows:

- If `T[K]` is an array of `AjvSchema` subclasses, it becomes an array of `AjvJsonSchema` of the element type.
- If `T[K]` is an `AjvSchema` subclass, it becomes `AjvJsonSchema<T[K]>`.
- Otherwise it stays `T[K]`.

A type guard `(x: any): x is AjvJsonSchema<MySchema> => validate(x)` must compile.


HOW COMPLETION IS VERIFIED

The verification suite checks the work in three ways:

- Exact schema output: the deep-equality of `getSchema()` output against expected JSON, in any key order.
- Runtime validation: compiling the generated schemas with `ajv/dist/2020` and `ajv-formats`, then checking which data is accepted and which is rejected.
- Compile-time behaviour: `tsc --noEmit` over files where every invalid usage is marked `// @ts-expect-error` (an unused directive is a failure) and every valid usage must compile cleanly.
