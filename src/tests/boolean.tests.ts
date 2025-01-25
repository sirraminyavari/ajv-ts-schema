import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({});

describe("Test 'boolean'", () => {
  it("Test 'boolean'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "boolean" })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: true })).toBe(true);
    expect(validate({ foo: false })).toBe(true);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: 1 })).toBe(false);
  });
});
