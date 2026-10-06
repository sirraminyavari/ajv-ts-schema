# Verifiers

These checks decide whether the task in [prompt.md](prompt.md) is complete. The task is complete only when every check passes.

## How to run them

- **Runtime checks** (sections A–F): run with any test runner. "Equals" means deep equality, in any key order. "Valid" and "invalid" refer to the boolean returned by a validator compiled with `new Ajv(opts)` from `ajv/dist/2020`, after `addFormats(ajv)` from `ajv-formats`. `opts` is `{}` unless a check says otherwise.
- **Compile-time checks** (sections G–I): put them in a `.ts` file with `strict: true` and standard decorators (`experimentalDecorators` off), then run `tsc --noEmit`.
- In this repo they are implemented in `src/tests/verifiers.tests.ts` (`yarn test`) and `src/tests/types/verifiers.ts` (`yarn typecheck`).
  - Each "must fail" line goes directly under `// @ts-expect-error`. A directive that ends up unused counts as a failure.
  - Each "must compile" line has no directive and must produce no error.
- All imports come from the library's single entry module: `AjvSchema`, `AjvObject`, `AjvProperty`, `getSchema`, `AjvJsonSchema`.

## Shared fixtures

```ts
@AjvObject({ required: true })
class Address extends AjvSchema {
  @AjvProperty({ type: "string", required: true }) street!: string;
}

@AjvObject<{ email: string; name?: string | null }>({
  additionalProperties: false,
  dependentRequired: { email: ["name"] },
})
class User extends AjvSchema {
  @AjvProperty({ type: "formatted-string", format: "email", required: true }) email!: string;
  @AjvProperty({ type: "string", nullable: true, minLength: 1 }) name?: string | null;
  @AjvProperty({ type: "integer", minimum: 0, default: 18 }) age?: number;
  @AjvProperty({ type: "array", items: Address, minItems: 1 }) addresses?: Address[];
  @AjvProperty(Address) home!: Address;
}

const ADDR = { type: "object", properties: { street: { type: "string" } }, required: ["street"] };
```

---

## A. Generated schema shape

**A1.** `User.getSchema()` equals:

```json
{
  "type": "object",
  "additionalProperties": false,
  "dependentRequired": { "email": ["name"] },
  "properties": {
    "email": { "type": "string", "format": "email" },
    "name": { "type": "string", "nullable": true, "minLength": 1 },
    "age": { "type": "integer", "minimum": 0, "default": 18 },
    "addresses": { "type": "array", "minItems": 1, "items": ADDR },
    "home": ADDR
  },
  "required": ["email", "home"]
}
```

**A2.** An `@AjvObject()` class with no fields produces exactly `{ type: "object", properties: {}, required: [] }`.

**A3.** A field without a decorator does not appear. Given `@AjvProperty({ type: "number" }) a?: number;` and an undecorated `plain?: string;`, the class produces `{ type: "object", properties: { a: { type: "number" } }, required: [] }`.

**A4.** Isolation between classes: two classes in the same module, `A` with field `a` and `B` with field `b`, give `Object.keys(A.getSchema().properties)` equal to `["a"]` and `Object.keys(B.getSchema().properties)` equal to `["b"]`.

**A5.** The output is plain JSON: `JSON.parse(JSON.stringify(User.getSchema()))` equals `User.getSchema()`. No class references or functions remain at any depth.

**A6.** A class decorated with `AjvObject({ required: true })` does not carry `required: true` in its own output. `Address.getSchema()` equals `ADDR`.

## B. Property keyword pass-through

**B1.** Each property type keeps its keywords exactly as given, apart from the conversions in section C:

| decorator argument | output |
|---|---|
| `{ type: "string", minLength: 1, maxLength: 3, pattern: "^a" }` | same object |
| `{ type: "number", minimum: 0, maximum: 9, exclusiveMinimum: -1, exclusiveMaximum: 10, multipleOf: 0.5 }` | same object |
| `{ type: "integer", multipleOf: 2 }` | same object |
| `{ type: "boolean" }` | same object |
| `{ type: "array", prefixItems: [{ type: "string" }, Address], items: { type: "number" }, contains: { type: "number" }, minContains: 1, maxContains: 2, uniqueItems: true, maxItems: 5 }` | same object, with `Address` replaced by `ADDR` |

**B2.** Combinators are kept as given. `{ type: "number", oneOf: [{ maximum: 3 }, { multipleOf: 1 }], allOf: [{ minimum: 0 }], not: { const: 2 } }` gives the same object back.

**B3.** Object-level options are kept as given. `@AjvObject({ not: { enum: [5] } })` gives `getSchema().not` equal to `{ enum: [5] }`.

## C. Conversion rules

**C1. `formatted-string`.** `getSchema({ type: "formatted-string", format: F })` equals `{ type: "string", format: F }` for each of `email`, `date`, `date-time`, `uuid`, `ipv4` and `uri`.

**C2. Nested `formatted-string`.** `getSchema({ type: "array", items: { type: "formatted-string", format: "email", minLength: 1 } })` equals `{ type: "array", items: { type: "string", format: "email", minLength: 1 } }`.

**C3. `required` removed, `nullable` kept.** `getSchema({ type: "string", required: true, nullable: true })` equals `{ type: "string", nullable: true }`.

**C4. Class references expand.**
- `getSchema(Address)` equals `Address.getSchema()`.
- `getSchema({ type: "array", items: Address })` equals `{ type: "array", items: ADDR }`.

**C5. Values copied verbatim.** Let `weird = { type: "formatted-string", required: true, nested: [{ type: "formatted-string" }] }`. A property `{ type: "array", default: [weird], enum: [[weird]], const: [weird], meta: { description: "d", readOnly: true, examples: [weird] } }` produces exactly:
- `type` is `"array"`
- `default` is `[weird]`, `enum` is `[[weird]]` and `const` is `[weird]`
- `meta` is `{ description: "d", readOnly: true, examples: [weird] }`

None of the `formatted-string` values or `required` keys inside these are converted or removed.

**C6. `meta` stays nested.** `@AjvObject({ meta: { title: "T", examples: [{ type: "formatted-string" }] } })` gives:
- `getSchema().meta` equal to `{ title: "T", examples: [{ type: "formatted-string" }] }`
- `getSchema().title` equal to `undefined`

**C7. Object options and nested classes.** Given:

```ts
@AjvObject() class Opt extends AjvSchema { @AjvProperty({ type: "number" }) v?: number; }
@AjvObject({ nullable: true }) class Nul extends AjvSchema { @AjvProperty({ type: "number" }) v?: number; }
@AjvObject({
  minProperties: 1, maxProperties: 2,
  patternProperties: { "^x": Address, "^num": { type: "number" } },
  additionalProperties: Opt,
})
class P extends AjvSchema {
  @AjvProperty(Opt) opt?: Opt;
  @AjvProperty(Nul) nul?: Nul;
}
```

with `OPT = { type: "object", properties: { v: { type: "number" } }, required: [] }`, `P.getSchema()` equals:

```json
{
  "type": "object", "minProperties": 1, "maxProperties": 2,
  "patternProperties": { "^x": ADDR, "^num": { "type": "number" } },
  "additionalProperties": OPT,
  "properties": {
    "opt": OPT,
    "nul": { "type": "object", "nullable": true, "properties": { "v": { "type": "number" } }, "required": [] }
  },
  "required": []
}
```

Note that `opt` and `nul` are not in `required`, because neither class was declared with `required: true`.

## D. Runtime validation (AJV)

**D1.** `User.getSchema()` compiles with `{ useDefaults: true }`. Then:

| data | result |
|---|---|
| `{ email: "a@b.co", name: "n", home: { street: "x" } }` | valid, and the object now has `age === 18` |
| `{ email: "a@b.co", name: null, home: { street: "x" } }` | valid |
| `{ email: "a@b.co", name: "n", home: { street: "x" }, addresses: [{ street: "y" }] }` | valid |
| `{ email: "a@b.co", home: { street: "x" } }` | invalid (`dependentRequired`: email requires name) |
| `{ email: "a@b.co", name: "", home: { street: "x" } }` | invalid (`minLength`) |
| `{ email: "bad", name: "n", home: { street: "x" } }` | invalid (`format`) |
| `{ email: "a@b.co" }` | invalid (`home` required) |
| `{ home: { street: "x" } }` | invalid (`email` required) |
| `{ email: "a@b.co", home: {} }` | invalid (nested `street` required) |
| `{ email: "a@b.co", home: null }` | invalid (not nullable) |
| `{ email: "a@b.co", name: "n", home: { street: "x" }, extra: 1 }` | invalid (`additionalProperties: false`) |
| `{ email: "a@b.co", name: "n", home: { street: "x" }, addresses: [] }` | invalid (`minItems`) |
| `{ email: "a@b.co", name: "n", home: { street: "x" }, addresses: [{}] }` | invalid (item `street` required) |
| `{ email: "a@b.co", name: "n", home: { street: "x" }, age: 1.5 }` | invalid (integer) |
| `{ email: "a@b.co", name: "n", home: { street: "x" }, age: -1 }` | invalid (`minimum`) |

**D2.** For the class `T` in B1, with fields `s`, `n`, `i`, `b` and `arr`:

| data | result |
|---|---|
| `{ s: "ab", n: 4.5, i: 4, b: true, arr: ["x", { street: "s" }, 1] }` | valid |
| `{ s: "b" }` | invalid (`pattern`) |
| `{ s: "abcd" }` | invalid (`maxLength`) |
| `{ n: 0.3 }` | invalid (`multipleOf`) |
| `{ i: 3 }` | invalid (`multipleOf`) |
| `{ b: "true" }` | invalid (type) |
| `{ arr: [1, {}, 1] }` | invalid (`prefixItems`) |
| `{ arr: ["x", { street: "s" }, 1, 1] }` | invalid (`uniqueItems`) |
| `{ arr: ["x", { street: "s" }, "y"] }` | invalid (`items`) |
| `{ arr: ["x", { street: "s" }, 1, 2, 3] }` | invalid (`maxContains`) |

**D3.** For the property schema in B2, with `oneOf` max 3 / integer, `allOf` min 0, and `not` const 2:
- `1.5` and `4` are valid
- `2`, `1`, `4.5` and `-0.5` are invalid

**D4.** For `P` in C7:

| data | result |
|---|---|
| `{}` | invalid (`minProperties`) |
| `{ opt: {} }` | valid |
| `{ nul: null }` | valid (nullable class) |
| `{ opt: null }` | invalid (class not nullable) |
| `{ xa: { street: "s" } }` | valid (`patternProperties` class) |
| `{ xa: {} }` | invalid |
| `{ num1: "s" }` | invalid (`patternProperties` options) |
| `{ zz: { v: 1 } }` | valid (`additionalProperties` class) |
| `{ zz: 1 }` | invalid |
| `{ opt: {}, nul: null, zz: {} }` | invalid (`maxProperties`) |

**D5. Formats.** For each `[format, valid, invalid]` below, `getSchema({ type: "formatted-string", format })` validates the first sample and rejects the second:
- `email`: `"a@b.co"`, `"x"`
- `date`: `"2024-01-31"`, `"2024-13-01"`
- `date-time`: `"2024-01-31T10:00:00Z"`, `"nope"`
- `uuid`: `"123e4567-e89b-12d3-a456-426614174000"`, `"123"`
- `ipv4`: `"1.2.3.4"`, `"999.1.1.1"`
- `uri`: `"https://x.y"`, `"not a uri"`

**D6.** For every allowed format except `iso-date`, compiling `getSchema({ type: "formatted-string", format })` does not throw. (`ajv-formats` itself does not define `iso-date`.)

**D7. Strict mode.** `User.getSchema()` compiles without throwing under `{ strict: true }`.

## E. `fromJson`

Fixture:

```ts
@AjvObject()
class W extends AjvSchema {
  @AjvProperty({ type: "number" }) a?: number;
  b = 7;
  hi() { return "hi"; }
}
const json = { a: 1, extra: "e", nested: { k: 1 } };
const w = AjvSchema.fromJson(W, json);
```

- **E1.** `w instanceof W` and `w instanceof AjvSchema`.
- **E2.** `w !== json`.
- **E3.** `w.a === 1`, `w.extra === "e"` and `w.nested` equals `{ k: 1 }`. Keys that are not in the schema are still copied.
- **E4.** `w.b === 7` (field initialisers run) and `w.hi() === "hi"` (prototype methods work).
- **E5.** `json` is unchanged after the call.
- **E6.** `AjvSchema.fromJson(W, { b: 9 }).b === 9`. JSON values override initialisers.
- **E7.** `AjvSchema.fromJson(W, {})` is an instance of `W`.

## F. Existing behaviour scenarios

- **F1. Required property.** With `@AjvProperty({ type: "number", required: true }) foo`: `{}`, `{ foo: undefined }` and `{ foo: null }` are invalid, and `{ foo: 1 }` is valid.
- **F2. Required class.** With `@AjvProperty(Item) foo`, where `Item` uses `@AjvObject({ required: true })`, and `@AjvProperty(ItemOptional) bar`, where `ItemOptional` uses `@AjvObject({})`:
  - `{}`, `{ foo: undefined }` and `{ foo: null }` are invalid
  - `{ foo: { value: 1 } }` is valid, with or without `bar`
- **F3. Nullable property.** With `@AjvProperty({ type: "number", nullable: true }) foo` and `@AjvProperty({ type: "number" }) bar`:
  - `{}`, `{ foo: null }` and `{ foo: 1 }` are valid
  - `{ bar: null }` is invalid
- **F4. Nullable class.** Same as F3, with `@AjvObject({ nullable: true })` on the referenced class.

## G. Compile-time: must compile

```ts
AjvProperty({ type: "string", minLength: 1, maxLength: 2, pattern: "x", required: true, nullable: true });
AjvProperty({ type: "formatted-string", format: "email", minLength: 1, maxLength: 9 });
AjvProperty({ type: "number", minimum: 0, maximum: 1, exclusiveMinimum: 0, exclusiveMaximum: 1, multipleOf: 1 });
AjvProperty({ type: "integer", minimum: 0 });
AjvProperty({ type: "boolean", default: true });
AjvProperty({ type: "array", prefixItems: [{ type: "string" }, Address], items: { type: "number" }, contains: Address,
              minContains: 1, maxContains: 2, uniqueItems: true, minItems: 0, maxItems: 1 });
AjvProperty(Address);
AjvProperty({ type: "string", enum: ["a", 1, true, null, [1], { k: [null] }], const: { a: 1 }, default: "x" });
AjvProperty({ type: "string", not: { minLength: 3 }, oneOf: [{ maxLength: 1 }, { const: "x" }],
              anyOf: [{ pattern: "a" }], allOf: [{ enum: ["a"] }] });
AjvProperty({ type: "string", meta: { title: "t", description: "d", $comment: "c", examples: ["x", 1], readOnly: true,
              writeOnly: false, contentEncoding: "base64", contentMediaType: "image/png" } });
AjvObject();
AjvObject({ required: true, nullable: true, minProperties: 0, maxProperties: 1,
            patternProperties: { "^x": Address, "^y": { type: "number" } }, additionalProperties: { type: "string" },
            meta: { title: "t" }, enum: [{}], default: {}, not: { const: {} } });
AjvObject({ additionalProperties: false });
AjvObject({ additionalProperties: Address });
AjvObject<{ a: string; b: string; c?: number }>({ dependentRequired: { a: ["b", "c"], c: ["a"] } });
```

All 24 `format` values from the prompt must also be accepted by `AjvProperty({ type: "formatted-string", format })`.

## H. Compile-time: must fail

Each line below is a compile error.

`AjvProperty`, wrong keyword for the type:
```ts
AjvProperty({ type: "string", minimum: 1 });
AjvProperty({ type: "number", minLength: 1 });
AjvProperty({ type: "integer", pattern: "x" });
AjvProperty({ type: "boolean", minimum: 1 });
AjvProperty({ type: "boolean", items: { type: "string" } });
AjvProperty({ type: "array", minLength: 1 });
AjvProperty({ type: "string", format: "email" });                     // format only on formatted-string
AjvProperty({ type: "formatted-string", format: "email", pattern: "x" });
```

`AjvProperty`, invalid `type` or `format`:
```ts
AjvProperty({ type: "object" });
AjvProperty({ type: "null" });
AjvProperty({ minLength: 1 });                                        // type missing
AjvProperty({ type: "formatted-string" });                            // format missing
AjvProperty({ type: "formatted-string", format: "phone" });
```

`AjvProperty`, wrong value types:
```ts
AjvProperty({ type: "string", minLength: "1" });
AjvProperty({ type: "array", uniqueItems: "yes" });
AjvProperty({ type: "string", enum: [undefined] });
AjvProperty({ type: "string", default: () => 1 });
```

`AjvProperty`, nested schemas:
```ts
AjvProperty({ type: "array", items: { type: "string", required: true } });
AjvProperty({ type: "array", items: { type: "string", nullable: true } });
AjvProperty({ type: "array", items: { type: "object" } });
AjvProperty({ type: "string", not: { type: "string" } });
AjvProperty({ type: "string", not: { minimum: 1 } });
AjvProperty({ type: "string", oneOf: [{ minimum: 1 }] });
AjvProperty({ type: "string", not: { not: { minLength: 1 } } });
```

`AjvProperty`, `meta`:
```ts
AjvProperty({ type: "string", meta: { contentEncoding: "utf8" } });
AjvProperty({ type: "string", meta: { title: 1 } });
AjvProperty({ type: "string", meta: { foo: 1 } });
AjvProperty({ type: "string", title: "t" });                          // meta keys only inside meta
```

Non-schema classes:
```ts
class NotSchema {}
AjvProperty(NotSchema);
AjvProperty({ type: "array", items: NotSchema });
@AjvObject() class PlainClass {}                                       // class does not extend AjvSchema
```

`AjvObject`:
```ts
AjvObject({ type: "object" });
AjvObject({ additionalProperties: true });
AjvObject({ minProperties: "1" });
AjvObject({ minLength: 1 });
AjvObject({ not: { minLength: 1 } });
AjvObject({ patternProperties: { "^x": { type: "object" } } });
```

`dependentRequired`:
```ts
AjvObject({ dependentRequired: { a: ["b"] } });                        // no generic
AjvObject<{ a: string; b: string }>({ dependentRequired: { a: ["a"] } });   // self-reference
AjvObject<{ a: string; b: string }>({ dependentRequired: { c: ["a"] } });   // unknown key
AjvObject<{ a: string; b: string }>({ dependentRequired: { a: ["z"] } });   // unknown value
AjvObject<{ a: string; b: string }>({ dependentRequired: { a: "b" } });     // not an array
```

## I. Compile-time: typing of data

Use these fixtures, which differ from the shared ones:

```ts
@AjvObject()
class User extends AjvSchema {
  @AjvProperty({ type: "formatted-string", format: "email", required: true }) email!: string;
  @AjvProperty({ type: "string", nullable: true }) name?: string | null;
  @AjvProperty({ type: "array", items: Address }) addresses!: Address[];
  @AjvProperty(Address) home!: Address;
}
declare const j: AjvJsonSchema<User>;
type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
```

Must compile, with each `Equals` resolving to `true`:

- **I1.** `Equals<typeof j.email, string>`
- **I2.** `Equals<typeof j.home.street, string>`
- **I3.** `Equals<typeof j.addresses, AjvJsonSchema<Address>[]>`
- **I4.** `Equals<typeof j.name, string | null | undefined>`
- **I5.** `const ok: AjvJsonSchema<User> = { email: "a", home: { street: "s" }, addresses: [{ street: "t" }] };`
- **I6.** `const isUser = (x: any): x is AjvJsonSchema<User> => new Ajv().compile(User.getSchema())(x);`
- **I7.** `const u: User = AjvSchema.fromJson(User, {});` and `const a: Address = AjvSchema.fromJson(Address, { street: "x" });`

Must fail:

- **I8.** `const bad: AjvJsonSchema<User> = { email: "a", home: { street: 1 }, addresses: [] };` (wrong nested type)
- **I9.** `const bad: AjvJsonSchema<User> = { home: { street: "s" }, addresses: [] };` (missing `email`)
- **I10.** `const bad: AjvJsonSchema<User> = { email: "a", home: { street: "s" }, addresses: [{}] };` (array item missing `street`)
- **I11.** `const bad: Address = AjvSchema.fromJson(User, {});` (`fromJson` returns the class passed in)
