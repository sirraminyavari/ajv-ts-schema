import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({});
addFormats(ajv);

describe("Test 'formatted-string'", () => {
  it("Test 'formatted-string'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "formatted-string", format: "email", minLength: 10, maxLength: 20 })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: "raminyavari" })).toBe(false);
    expect(validate({ foo: "ram@inav.ri" })).toBe(true);
    expect(validate({ foo: "sir.raminyavari@inav.ri" })).toBe(false);
    expect(validate({ foo: "sir.ramin@inav.ri" })).toBe(true);
  });
});
