import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({});

describe("Test 'string'", () => {
  it("Test 'string'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "string", minLength: 10, maxLength: 20 })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: "raminyavari" })).toBe(true);
    expect(validate({ foo: "ram@inav.ri" })).toBe(true);
    expect(validate({ foo: "sir.raminyavari@inav.ri" })).toBe(false);
    expect(validate({ foo: "sir.ramin@inav.ri" })).toBe(true);
  });

  it("Test 'string' with 'pattern'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "string", minLength: 1, maxLength: 20, pattern: "^x.*2$" })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: "" })).toBe(false);
    expect(validate({ foo: "raminyavari" })).toBe(false);
    expect(validate({ foo: "x-raminyavari-2" })).toBe(true);
    expect(validate({ foo: "x2" })).toBe(true);
    expect(validate({ foo: "2x2" })).toBe(false);
    expect(validate({ foo: "2x" })).toBe(false);
    expect(validate({ foo: "xxxxx22222" })).toBe(true);
  });
});
