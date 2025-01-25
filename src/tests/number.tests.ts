import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({});

describe("Test 'number'", () => {
  it("Test 'number' with 'maximum' and 'minimum'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "number", minimum: 2.5, maximum: 99.75, multipleOf: 0.25 })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: 1 })).toBe(false);
    expect(validate({ foo: 2.4999999 })).toBe(false);
    expect(validate({ foo: 2.5 })).toBe(true);
    expect(validate({ foo: 2.50000001 })).toBe(false);
    expect(validate({ foo: 22.25 })).toBe(true);
    expect(validate({ foo: 99.75 })).toBe(true);
    expect(validate({ foo: 120 })).toBe(false);
    expect(validate({ foo: 98.8 })).toBe(false);
    expect(validate({ foo: 98.75 })).toBe(true);
  });

  it("Test 'number' with 'exclusiveMaximum' and 'exclusiveMinimum'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({
        type: "number",
        exclusiveMinimum: 2.5,
        exclusiveMaximum: 99.75,
        multipleOf: 0.25,
      })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: 1 })).toBe(false);
    expect(validate({ foo: 2.4999999 })).toBe(false);
    expect(validate({ foo: 2.5 })).toBe(false);
    expect(validate({ foo: 2.50000001 })).toBe(false);
    expect(validate({ foo: 22.25 })).toBe(true);
    expect(validate({ foo: 99.75 })).toBe(false);
    expect(validate({ foo: 120 })).toBe(false);
    expect(validate({ foo: 98.8 })).toBe(false);
    expect(validate({ foo: 98.75 })).toBe(true);
  });
});
