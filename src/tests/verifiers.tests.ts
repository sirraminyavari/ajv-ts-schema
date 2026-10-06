/* eslint-disable @typescript-eslint/no-explicit-any -- verifier inputs are deliberately untyped */
import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { AjvObject, AjvProperty, AjvSchema, getSchema } from "../index";

const mk = (o: any = {}) => {
  const a = new Ajv(o);
  addFormats(a);
  return a;
};
const ADDR = { type: "object", properties: { street: { type: "string" } }, required: ["street"] };

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

@AjvObject()
class T extends AjvSchema {
  @AjvProperty({ type: "string", minLength: 1, maxLength: 3, pattern: "^a" }) s?: string;
  @AjvProperty({
    type: "number",
    minimum: 0,
    maximum: 9,
    exclusiveMinimum: -1,
    exclusiveMaximum: 10,
    multipleOf: 0.5,
  })
  n?: number;
  @AjvProperty({ type: "integer", multipleOf: 2 }) i?: number;
  @AjvProperty({ type: "boolean" }) b?: boolean;
  @AjvProperty({
    type: "array",
    prefixItems: [{ type: "string" }, Address],
    items: { type: "number" },
    contains: { type: "number" },
    minContains: 1,
    maxContains: 2,
    uniqueItems: true,
    maxItems: 5,
  })
  arr?: unknown[];
}

const B2 = {
  type: "number",
  oneOf: [{ maximum: 3 }, { multipleOf: 1 }],
  allOf: [{ minimum: 0 }],
  not: { const: 2 },
} as const;

@AjvObject()
class Opt extends AjvSchema {
  @AjvProperty({ type: "number" }) v?: number;
}
@AjvObject({ nullable: true })
class Nul extends AjvSchema {
  @AjvProperty({ type: "number" }) v?: number;
}
@AjvObject({
  minProperties: 1,
  maxProperties: 2,
  patternProperties: { "^x": Address, "^num": { type: "number" } },
  additionalProperties: Opt,
})
class P extends AjvSchema {
  @AjvProperty(Opt) opt?: Opt;
  @AjvProperty(Nul) nul?: Nul;
}
const OPT = { type: "object", properties: { v: { type: "number" } }, required: [] };

describe("A. Generated schema shape", () => {
  it("A1", () => {
    expect(User.getSchema()).toEqual({
      type: "object",
      additionalProperties: false,
      dependentRequired: { email: ["name"] },
      properties: {
        email: { type: "string", format: "email" },
        name: { type: "string", nullable: true, minLength: 1 },
        age: { type: "integer", minimum: 0, default: 18 },
        addresses: { type: "array", minItems: 1, items: ADDR },
        home: ADDR,
      },
      required: ["email", "home"],
    });
  });
  it("A2", () => {
    @AjvObject()
    class E extends AjvSchema {}
    expect(E.getSchema()).toEqual({ type: "object", properties: {}, required: [] });
  });
  it("A3", () => {
    @AjvObject()
    class F extends AjvSchema {
      @AjvProperty({ type: "number" }) a?: number;
      plain?: string;
    }
    expect(F.getSchema()).toEqual({
      type: "object",
      properties: { a: { type: "number" } },
      required: [],
    });
  });
  it("A4", () => {
    @AjvObject()
    class A extends AjvSchema {
      @AjvProperty({ type: "number" }) a?: number;
    }
    @AjvObject()
    class B extends AjvSchema {
      @AjvProperty({ type: "string" }) b?: string;
    }
    expect(Object.keys(A.getSchema().properties)).toEqual(["a"]);
    expect(Object.keys(B.getSchema().properties)).toEqual(["b"]);
  });
  it("A5", () => {
    const s = User.getSchema();
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
  it("A6", () => {
    expect(Address.getSchema()).toEqual(ADDR);
  });
});

describe("B. Property keyword pass-through", () => {
  it("B1", () => {
    expect(T.getSchema().properties).toEqual({
      s: { type: "string", minLength: 1, maxLength: 3, pattern: "^a" },
      n: {
        type: "number",
        minimum: 0,
        maximum: 9,
        exclusiveMinimum: -1,
        exclusiveMaximum: 10,
        multipleOf: 0.5,
      },
      i: { type: "integer", multipleOf: 2 },
      b: { type: "boolean" },
      arr: {
        type: "array",
        prefixItems: [{ type: "string" }, ADDR],
        items: { type: "number" },
        contains: { type: "number" },
        minContains: 1,
        maxContains: 2,
        uniqueItems: true,
        maxItems: 5,
      },
    });
  });
  it("B2", () => {
    expect(getSchema(B2 as any)).toEqual(B2);
    @AjvObject()
    class C extends AjvSchema {
      @AjvProperty({
        type: "number",
        oneOf: [{ maximum: 3 }, { multipleOf: 1 }],
        allOf: [{ minimum: 0 }],
        not: { const: 2 },
      })
      n?: number;
    }
    expect(C.getSchema().properties.n).toEqual(B2);
  });
  it("B3", () => {
    @AjvObject({ not: { enum: [5] } })
    class C extends AjvSchema {}
    expect(C.getSchema().not).toEqual({ enum: [5] });
  });
});

describe("C. Conversion rules", () => {
  it("C1", () => {
    for (const f of ["email", "date", "date-time", "uuid", "ipv4", "uri"] as const) {
      expect(getSchema({ type: "formatted-string", format: f })).toEqual({
        type: "string",
        format: f,
      });
    }
  });
  it("C2", () => {
    expect(
      getSchema({
        type: "array",
        items: { type: "formatted-string", format: "email", minLength: 1 },
      })
    ).toEqual({
      type: "array",
      items: { type: "string", format: "email", minLength: 1 },
    });
  });
  it("C3", () => {
    expect(getSchema({ type: "string", required: true, nullable: true } as any)).toEqual({
      type: "string",
      nullable: true,
    });
  });
  it("C4", () => {
    expect(getSchema(Address)).toEqual(Address.getSchema());
    expect(getSchema({ type: "array", items: Address })).toEqual({ type: "array", items: ADDR });
  });
  it("C5", () => {
    const weird = {
      type: "formatted-string",
      required: true,
      nested: [{ type: "formatted-string" }],
    };
    @AjvObject()
    class V extends AjvSchema {
      @AjvProperty({
        type: "array",
        default: [weird] as any,
        enum: [[weird]] as any,
        const: [weird] as any,
        meta: { description: "d", readOnly: true, examples: [weird] as any },
      })
      a?: unknown;
    }
    expect(V.getSchema().properties.a).toEqual({
      type: "array",
      default: [weird],
      enum: [[weird]],
      const: [weird],
      meta: { description: "d", readOnly: true, examples: [weird] },
    });
  });
  it("C6", () => {
    @AjvObject({ meta: { title: "T", examples: [{ type: "formatted-string" }] } })
    class M extends AjvSchema {}
    expect(M.getSchema().meta).toEqual({ title: "T", examples: [{ type: "formatted-string" }] });
    expect(M.getSchema().title).toBeUndefined();
  });
  it("C7", () => {
    expect(P.getSchema()).toEqual({
      type: "object",
      minProperties: 1,
      maxProperties: 2,
      patternProperties: { "^x": ADDR, "^num": { type: "number" } },
      additionalProperties: OPT,
      properties: {
        opt: OPT,
        nul: {
          type: "object",
          nullable: true,
          properties: { v: { type: "number" } },
          required: [],
        },
      },
      required: [],
    });
  });
});

describe("D. Runtime validation", () => {
  it("D1", () => {
    const v = mk({ useDefaults: true }).compile(User.getSchema());
    const d: any = { email: "a@b.co", name: "n", home: { street: "x" } };
    expect(v(d)).toBe(true);
    expect(d.age).toBe(18);
    const ok = (x: any) => expect(v(x)).toBe(true);
    const bad = (x: any) => expect(v(x)).toBe(false);
    ok({ email: "a@b.co", name: null, home: { street: "x" } });
    ok({ email: "a@b.co", name: "n", home: { street: "x" }, addresses: [{ street: "y" }] });
    bad({ email: "a@b.co", home: { street: "x" } });
    bad({ email: "a@b.co", name: "", home: { street: "x" } });
    bad({ email: "bad", name: "n", home: { street: "x" } });
    bad({ email: "a@b.co" });
    bad({ home: { street: "x" } });
    bad({ email: "a@b.co", home: {} });
    bad({ email: "a@b.co", home: null });
    bad({ email: "a@b.co", name: "n", home: { street: "x" }, extra: 1 });
    bad({ email: "a@b.co", name: "n", home: { street: "x" }, addresses: [] });
    bad({ email: "a@b.co", name: "n", home: { street: "x" }, addresses: [{}] });
    bad({ email: "a@b.co", name: "n", home: { street: "x" }, age: 1.5 });
    bad({ email: "a@b.co", name: "n", home: { street: "x" }, age: -1 });
  });
  it("D2", () => {
    const v = mk().compile(T.getSchema());
    expect(v({ s: "ab", n: 4.5, i: 4, b: true, arr: ["x", { street: "s" }, 1] })).toBe(true);
    for (const x of [
      { s: "b" },
      { s: "abcd" },
      { n: 0.3 },
      { i: 3 },
      { b: "true" },
      { arr: [1, {}, 1] },
      { arr: ["x", { street: "s" }, 1, 1] },
      { arr: ["x", { street: "s" }, "y"] },
      { arr: ["x", { street: "s" }, 1, 2, 3] },
    ])
      expect(v(x)).toBe(false);
  });
  it("D3", () => {
    const v = mk().compile(getSchema(B2 as any));
    for (const x of [1.5, 4]) expect(v(x)).toBe(true);
    for (const x of [2, 1, 4.5, -0.5]) expect(v(x)).toBe(false);
  });
  it("D4", () => {
    const v = mk().compile(P.getSchema());
    const cases: [any, boolean][] = [
      [{}, false],
      [{ opt: {} }, true],
      [{ nul: null }, true],
      [{ opt: null }, false],
      [{ xa: { street: "s" } }, true],
      [{ xa: {} }, false],
      [{ num1: "s" }, false],
      [{ zz: { v: 1 } }, true],
      [{ zz: 1 }, false],
      [{ opt: {}, nul: null, zz: {} }, false],
    ];
    for (const [x, r] of cases) expect(v(x)).toBe(r);
  });
  it("D5", () => {
    const fmts: [any, string, string][] = [
      ["email", "a@b.co", "x"],
      ["date", "2024-01-31", "2024-13-01"],
      ["date-time", "2024-01-31T10:00:00Z", "nope"],
      ["uuid", "123e4567-e89b-12d3-a456-426614174000", "123"],
      ["ipv4", "1.2.3.4", "999.1.1.1"],
      ["uri", "https://x.y", "not a uri"],
    ];
    for (const [format, ok, bad] of fmts) {
      const v = mk().compile(getSchema({ type: "formatted-string", format }));
      expect(v(ok)).toBe(true);
      expect(v(bad)).toBe(false);
    }
  });
  it("D6", () => {
    const all = [
      "email",
      "date",
      "time",
      "date-time",
      "iso-time",
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
    for (const format of all)
      expect(() => mk().compile(getSchema({ type: "formatted-string", format }))).not.toThrow();
  });
  it("D7", () => {
    expect(() => mk({ strict: true }).compile(User.getSchema())).not.toThrow();
  });
});

describe("E. fromJson", () => {
  @AjvObject()
  class W extends AjvSchema {
    @AjvProperty({ type: "number" }) a?: number;
    b = 7;
    hi() {
      return "hi";
    }
  }
  const json = { a: 1, extra: "e", nested: { k: 1 } };
  const snapshot = JSON.parse(JSON.stringify(json));
  const w = AjvSchema.fromJson(W, json);
  it("E1", () => {
    expect(w).toBeInstanceOf(W);
    expect(w).toBeInstanceOf(AjvSchema);
  });
  it("E2", () => expect(w).not.toBe(json));
  it("E3", () => {
    expect(w.a).toBe(1);
    expect((w as any).extra).toBe("e");
    expect((w as any).nested).toEqual({ k: 1 });
  });
  it("E4", () => {
    expect(w.b).toBe(7);
    expect(w.hi()).toBe("hi");
  });
  it("E5", () => expect(json).toEqual(snapshot));
  it("E6", () => expect(AjvSchema.fromJson(W, { b: 9 }).b).toBe(9));
  it("E7", () => expect(AjvSchema.fromJson(W, {})).toBeInstanceOf(W));
});

describe("F. Existing behaviour scenarios", () => {
  const ajv = new Ajv();
  it("F1", () => {
    @AjvObject()
    class S extends AjvSchema {
      @AjvProperty({ type: "number", required: true }) foo!: unknown;
    }
    const v = ajv.compile(S.getSchema());
    expect(v({})).toBe(false);
    expect(v({ foo: undefined })).toBe(false);
    expect(v({ foo: null })).toBe(false);
    expect(v({ foo: 1 })).toBe(true);
  });
  it("F2", () => {
    @AjvObject({ required: true })
    class Item extends AjvSchema {
      @AjvProperty({ type: "number" }) value!: unknown;
    }
    @AjvObject({})
    class ItemOptional extends AjvSchema {
      @AjvProperty({ type: "number" }) value!: unknown;
    }
    @AjvObject()
    class S extends AjvSchema {
      @AjvProperty(Item) foo!: unknown;
      @AjvProperty(ItemOptional) bar!: unknown;
    }
    const v = ajv.compile(S.getSchema());
    expect(v({})).toBe(false);
    expect(v({ foo: undefined })).toBe(false);
    expect(v({ foo: null })).toBe(false);
    expect(v({ foo: { value: 1 } })).toBe(true);
    expect(v({ foo: { value: 1 }, bar: { value: 1 } })).toBe(true);
  });
  it("F3", () => {
    @AjvObject()
    class S extends AjvSchema {
      @AjvProperty({ type: "number", nullable: true }) foo!: unknown;
      @AjvProperty({ type: "number" }) bar!: unknown;
    }
    const v = ajv.compile(S.getSchema());
    expect(v({})).toBe(true);
    expect(v({ foo: null })).toBe(true);
    expect(v({ foo: 1 })).toBe(true);
    expect(v({ bar: null })).toBe(false);
  });
  it("F4", () => {
    @AjvObject({ nullable: true })
    class Item extends AjvSchema {
      @AjvProperty({ type: "number" }) value!: unknown;
    }
    @AjvObject({})
    class ItemNonNull extends AjvSchema {
      @AjvProperty({ type: "number" }) value!: unknown;
    }
    @AjvObject()
    class S extends AjvSchema {
      @AjvProperty(Item) foo!: unknown;
      @AjvProperty(ItemNonNull) bar!: unknown;
    }
    const v = ajv.compile(S.getSchema());
    expect(v({})).toBe(true);
    expect(v({ foo: null })).toBe(true);
    expect(v({ foo: { value: 1 } })).toBe(true);
    expect(v({ bar: null })).toBe(false);
  });
});
