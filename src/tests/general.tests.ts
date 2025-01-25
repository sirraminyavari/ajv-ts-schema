import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty, getSchema } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv();

describe("General tests", () => {
  it("Test 'required'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "number", required: true })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(false);
    expect(validate({ foo: undefined })).toBe(false);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: 1 })).toBe(true);
  });

  it("Test 'nullable'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "number", nullable: true })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: null })).toBe(true);
    expect(validate({ foo: 1 })).toBe(true);
  });

  it("Test 'meta'", () => {
    @AjvObject({ meta: { title: "ramin" } })
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "number", nullable: true, meta: { $comment: "abd", readOnly: true } })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();

    expect(schema.meta.title).toBe("ramin");
    expect(schema.properties.foo.meta.$comment).toBe("abd");
    expect(schema.properties.foo.meta.readOnly).toBe(true);
  });

  it("Test parsing a property schema", () => {
    const schema = getSchema({
      type: "array",
      items: { type: "formatted-string", minLength: 1, format: "email" },
    });

    expect(schema.type).toBe("array");
    expect(schema.items.type).toBe("string");
    expect(schema.items.minLength).toBe(1);
    expect(schema.items.format).toBe("email");
  });
});
