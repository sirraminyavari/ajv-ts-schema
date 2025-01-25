import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({});

describe("Test 'integer'", () => {
  it("Test 'integer' with 'maximum' and 'minimum'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "integer", minimum: 2, maximum: 100, multipleOf: 2 })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: 1 })).toBe(false);
    expect(validate({ foo: 2 })).toBe(true);
    expect(validate({ foo: 22 })).toBe(true);
    expect(validate({ foo: 100 })).toBe(true);
    expect(validate({ foo: 120 })).toBe(false);
    expect(validate({ foo: 99 })).toBe(false);
    expect(validate({ foo: 98 })).toBe(true);
  });

  it("Test 'integer' with 'exclusiveMaximum' and 'exclusiveMinimum'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "integer", exclusiveMinimum: 2, exclusiveMaximum: 100, multipleOf: 2 })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: 1 })).toBe(false);
    expect(validate({ foo: 2 })).toBe(false);
    expect(validate({ foo: 22 })).toBe(true);
    expect(validate({ foo: 100 })).toBe(false);
    expect(validate({ foo: 120 })).toBe(false);
    expect(validate({ foo: 99 })).toBe(false);
    expect(validate({ foo: 98 })).toBe(true);
  });

  it("'integer' should not accept numbers with decimal places", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "integer" })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({ foo: 2 })).toBe(true);
    expect(validate({ foo: 2.5 })).toBe(false);
  });
});
