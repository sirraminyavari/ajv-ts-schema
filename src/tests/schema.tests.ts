import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { AjvJsonSchema, AjvObject, AjvProperty, AjvSchema, getSchema } from "../index";

function compile(schema: object) {
  const ajv = new Ajv2020();
  addFormats(ajv);
  ajv.addKeyword("meta");
  return ajv.compile(schema);
}

describe("getSchema() on a class", () => {
  it("emits type object, properties and an empty required array for an undecorated empty class", () => {
    class Empty extends AjvSchema {}
    expect(Empty.getSchema()).toEqual({ type: "object", properties: {}, required: [] });
  });

  it("emits every decorated field and collects required names", () => {
    @AjvObject()
    class User extends AjvSchema {
      @AjvProperty({ type: "string", minLength: 1, required: true })
      name!: string;

      @AjvProperty({ type: "integer", minimum: 0 })
      age?: number;

      notDecorated?: string;
    }
    expect(User.getSchema()).toEqual({
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        age: { type: "integer", minimum: 0 },
      },
      required: ["name"],
    });
  });

  it("rewrites formatted-string to string and keeps format", () => {
    class A extends AjvSchema {
      @AjvProperty({ type: "formatted-string", format: "email", maxLength: 50 })
      email!: string;
    }
    expect(A.getSchema().properties).toEqual({
      email: { type: "string", format: "email", maxLength: 50 },
    });
  });

  it("passes nullable through and strips required at every depth", () => {
    class A extends AjvSchema {
      @AjvProperty({ type: "number", nullable: true, required: false })
      n!: number | null;
    }
    expect(A.getSchema()).toEqual({
      type: "object",
      properties: { n: { type: "number", nullable: true } },
      required: [],
    });
  });

  it("inlines a referenced class and honours its required option", () => {
    @AjvObject({ required: true, nullable: true })
    class Address extends AjvSchema {
      @AjvProperty({ type: "string", required: true })
      street!: string;
    }
    @AjvObject()
    class Optional extends AjvSchema {
      @AjvProperty({ type: "string" })
      x?: string;
    }
    class Person extends AjvSchema {
      @AjvProperty(Address)
      address!: Address;

      @AjvProperty(Optional)
      opt?: Optional;
    }
    expect(Person.getSchema()).toEqual({
      type: "object",
      properties: {
        address: {
          type: "object",
          nullable: true,
          properties: { street: { type: "string" } },
          required: ["street"],
        },
        opt: { type: "object", properties: { x: { type: "string" } }, required: [] },
      },
      required: ["address"],
    });
  });

  it("converts array keywords recursively, including classes and formatted strings", () => {
    class Tag extends AjvSchema {
      @AjvProperty({ type: "string", required: true })
      label!: string;
    }
    class A extends AjvSchema {
      @AjvProperty({
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: Tag,
        prefixItems: [{ type: "formatted-string", format: "uuid" }, Tag],
        contains: { type: "integer" },
        minContains: 1,
        maxContains: 3,
        required: true,
      })
      tags!: Tag[];
    }
    const tag = { type: "object", properties: { label: { type: "string" } }, required: ["label"] };
    expect(A.getSchema()).toEqual({
      type: "object",
      properties: {
        tags: {
          type: "array",
          minItems: 1,
          uniqueItems: true,
          items: tag,
          prefixItems: [{ type: "string", format: "uuid" }, tag],
          contains: { type: "integer" },
          minContains: 1,
          maxContains: 3,
        },
      },
      required: ["tags"],
    });
  });

  it("copies enum, const, default and meta verbatim, even with schema-looking keys", () => {
    const def = { type: "required", required: true, nested: [1, "a", null] };
    class A extends AjvSchema {
      @AjvProperty({
        type: "string",
        enum: ["a", "b"],
        const: "a",
        default: def,
        meta: {
          title: "T",
          description: "D",
          examples: [{ required: true }],
          contentEncoding: "base64",
        },
      })
      s!: string;
    }
    const out = A.getSchema();
    expect(out.properties.s).toEqual({
      type: "string",
      enum: ["a", "b"],
      const: "a",
      default: def,
      meta: {
        title: "T",
        description: "D",
        examples: [{ required: true }],
        contentEncoding: "base64",
      },
    });
    expect(out.properties.s.default).toBe(def);
  });

  it("converts combinator sub-schemas", () => {
    class A extends AjvSchema {
      @AjvProperty({
        type: "string",
        not: { pattern: "^x" },
        oneOf: [{ minLength: 1 }, { enum: ["z"] }],
        anyOf: [{ maxLength: 3 }],
        allOf: [{ const: "q" }],
      })
      s!: string;
    }
    expect(A.getSchema().properties.s).toEqual({
      type: "string",
      not: { pattern: "^x" },
      oneOf: [{ minLength: 1 }, { enum: ["z"] }],
      anyOf: [{ maxLength: 3 }],
      allOf: [{ const: "q" }],
    });
  });

  it("converts every AjvObject option", () => {
    class Inner extends AjvSchema {
      @AjvProperty({ type: "boolean" })
      b?: boolean;
    }
    @AjvObject<Outer>({
      minProperties: 1,
      maxProperties: 5,
      patternProperties: { "^x-": { type: "formatted-string", format: "date" }, "^y-": Inner },
      additionalProperties: false,
      dependentRequired: { a: ["b"] },
      meta: { title: "Outer" },
      default: { a: "1" },
      not: { const: { a: "nope" } },
      oneOf: [{ enum: [{ a: "1" }] }],
    })
    class Outer extends AjvSchema {
      @AjvProperty({ type: "string" })
      a?: string;

      @AjvProperty({ type: "string" })
      b?: string;
    }
    expect(Outer.getSchema()).toEqual({
      type: "object",
      minProperties: 1,
      maxProperties: 5,
      patternProperties: {
        "^x-": { type: "string", format: "date" },
        "^y-": { type: "object", properties: { b: { type: "boolean" } }, required: [] },
      },
      additionalProperties: false,
      dependentRequired: { a: ["b"] },
      meta: { title: "Outer" },
      default: { a: "1" },
      not: { const: { a: "nope" } },
      oneOf: [{ enum: [{ a: "1" }] }],
      properties: { a: { type: "string" }, b: { type: "string" } },
      required: [],
    });
  });

  it("supports additionalProperties as a schema", () => {
    @AjvObject({ additionalProperties: { type: "number" } })
    class A extends AjvSchema {}
    expect(A.getSchema()).toEqual({
      type: "object",
      additionalProperties: { type: "number" },
      properties: {},
      required: [],
    });
  });

  it("never leaks properties between classes in the same module", () => {
    class A extends AjvSchema {
      @AjvProperty({ type: "string" })
      a?: string;
    }
    class B extends AjvSchema {
      @AjvProperty({ type: "number" })
      b?: number;
    }
    expect(Object.keys(A.getSchema().properties)).toEqual(["a"]);
    expect(Object.keys(B.getSchema().properties)).toEqual(["b"]);
  });

  it("inherits the parent's fields without changing the parent's schema", () => {
    @AjvObject({ additionalProperties: false })
    class Base extends AjvSchema {
      @AjvProperty({ type: "number", required: true })
      a!: number;
    }
    @AjvObject()
    class Child extends Base {
      @AjvProperty({ type: "string" })
      b?: string;
    }
    class Plain extends Base {}

    expect(Base.getSchema()).toEqual({
      type: "object",
      additionalProperties: false,
      properties: { a: { type: "number" } },
      required: ["a"],
    });
    expect(Child.getSchema()).toEqual({
      type: "object",
      properties: { a: { type: "number" }, b: { type: "string" } },
      required: ["a"],
    });
    expect(Plain.getSchema()).toEqual({
      type: "object",
      properties: { a: { type: "number" } },
      required: ["a"],
    });
  });

  it("lets a subclass redefine an inherited field", () => {
    class Base extends AjvSchema {
      @AjvProperty({ type: "number" })
      a?: number;
    }
    class Child extends Base {
      @AjvProperty({ type: "integer", required: true })
      a: number = 0;
    }
    expect(Base.getSchema().properties.a).toEqual({ type: "number" });
    expect(Child.getSchema()).toEqual({
      type: "object",
      properties: { a: { type: "integer" } },
      required: ["a"],
    });
  });

  it("does not mutate the options object passed to the decorator", () => {
    const opts = { type: "formatted-string", format: "email", required: true } as const;
    class A extends AjvSchema {
      @AjvProperty(opts)
      e!: string;
    }
    A.getSchema();
    expect(opts).toEqual({ type: "formatted-string", format: "email", required: true });
  });
});

describe("getSchema(x) standalone", () => {
  it("converts a property options object", () => {
    expect(
      getSchema({ type: "formatted-string", format: "ipv4", required: true, nullable: true })
    ).toEqual({
      type: "string",
      format: "ipv4",
      nullable: true,
    });
  });

  it("converts a class", () => {
    class A extends AjvSchema {
      @AjvProperty({ type: "boolean", required: true })
      ok!: boolean;
    }
    expect(getSchema(A)).toEqual({
      type: "object",
      properties: { ok: { type: "boolean" } },
      required: ["ok"],
    });
  });
});

describe("fromJson", () => {
  it("returns an instance with every own key of the json assigned", () => {
    class A extends AjvSchema {
      @AjvProperty({ type: "string" })
      a?: string;
      extra = 1;
    }
    const inst = AjvSchema.fromJson(A, { a: "x", z: 2 });
    expect(inst).toBeInstanceOf(A);
    expect(inst.a).toBe("x");
    expect((inst as unknown as { z: number }).z).toBe(2);
    expect(inst.extra).toBe(1);
  });
});

describe("runtime validation with ajv/dist/2020 and ajv-formats", () => {
  @AjvObject({ required: true })
  class Address extends AjvSchema {
    @AjvProperty({ type: "string", minLength: 1, required: true })
    street!: string;

    @AjvProperty({ type: "formatted-string", format: "ipv4", nullable: true })
    ip?: string | null;
  }

  @AjvObject<User>({ additionalProperties: false, dependentRequired: { nick: ["name"] } })
  class User extends AjvSchema {
    @AjvProperty({ type: "string", minLength: 2, required: true })
    name!: string;

    @AjvProperty({ type: "string" })
    nick?: string;

    @AjvProperty({ type: "formatted-string", format: "email", required: true })
    email!: string;

    @AjvProperty({ type: "integer", minimum: 0, maximum: 150, nullable: true })
    age?: number | null;

    @AjvProperty(Address)
    address!: Address;

    @AjvProperty({ type: "array", items: Address, maxItems: 2 })
    previous?: Address[];

    @AjvProperty({ type: "string", enum: ["admin", "user"], default: "user" })
    role?: "admin" | "user";
  }

  const validate = compile(User.getSchema());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guard = (x: any): x is AjvJsonSchema<User> => validate(x) as boolean;

  const good = {
    name: "Ann",
    email: "ann@example.com",
    age: null,
    address: { street: "Main", ip: "10.0.0.1" },
    previous: [{ street: "Old" }],
    role: "admin",
  };

  it("accepts valid data", () => {
    expect(guard(good)).toBe(true);
    if (guard(good)) {
      const street: string = good.address.street;
      const prev: string = good.previous![0].street;
      expect(street).toBe("Main");
      expect(prev).toBe("Old");
    }
  });

  it("rejects missing required fields", () => {
    expect(validate({ ...good, name: undefined })).toBe(false);
    expect(validate({ ...good, address: { ip: null } })).toBe(false);
  });

  it("rejects wrong formats and bounds", () => {
    expect(validate({ ...good, email: "nope" })).toBe(false);
    expect(validate({ ...good, address: { street: "x", ip: "999.1.1.1" } })).toBe(false);
    expect(validate({ ...good, age: 151 })).toBe(false);
    expect(validate({ ...good, age: 1.5 })).toBe(false);
    expect(validate({ ...good, previous: [good.address, good.address, good.address] })).toBe(false);
  });

  it("applies enum, nullable, additionalProperties and dependentRequired", () => {
    expect(validate({ ...good, role: "root" })).toBe(false);
    expect(validate({ ...good, age: 30 })).toBe(true);
    expect(validate({ ...good, age: "30" })).toBe(false);
    expect(validate({ ...good, unknown: 1 })).toBe(false);
    const { name: _n, ...noName } = good;
    expect(validate({ ...noName, nick: "a" })).toBe(false);
    expect(validate({ ...good, nick: "a" })).toBe(true);
  });

  it("compiles combinators and array keywords in strict mode", () => {
    class A extends AjvSchema {
      @AjvProperty({
        type: "array",
        prefixItems: [{ type: "string", oneOf: [{ minLength: 5 }, { enum: ["a"] }] }],
        items: { type: "integer", not: { const: 0 } },
        contains: { type: "integer", minimum: 10 },
        minContains: 1,
        meta: { title: "Mixed", description: "d", examples: [["a", 11]] },
      })
      list?: unknown[];
    }
    const v = compile(A.getSchema());
    expect(v({ list: ["a", 11] })).toBe(true);
    expect(v({ list: ["hello", 1, 10] })).toBe(true);
    expect(v({ list: ["ab", 11] })).toBe(false);
    expect(v({ list: ["a", 0, 11] })).toBe(false);
    expect(v({ list: ["a", 1] })).toBe(false);
  });
});
