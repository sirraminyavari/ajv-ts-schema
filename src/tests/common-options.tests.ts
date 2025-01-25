import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({ useDefaults: true });

describe("Test common options", () => {
  it("Test 'enum'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "string", enum: ["foo", "bar"] })
      foo!: unknown;

      @AjvProperty({ type: "number", enum: [2, 22] })
      bar!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: "f" })).toBe(false);
    expect(validate({ bar: 1 })).toBe(false);
    expect(validate({ foo: "foo" })).toBe(true);
    expect(validate({ bar: 2 })).toBe(true);
    expect(validate({ foo: "bar", bar: 22 })).toBe(true);
    expect(validate({ foo: "bar", bar: 20 })).toBe(false);
  });

  it("Test 'const'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "string", const: "abc" })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: "f" })).toBe(false);
    expect(validate({ foo: "abc" })).toBe(true);
  });

  it("Test 'default'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "string", default: "abc" })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    const data: any = {};
    validate(data);
    expect(data.foo).toBe("abc");
  });
});
