import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({});

describe("Test 'minProperties' of 'object'", () => {
  it("Check if 'minProperties' works as expected", () => {
    @AjvObject({ minProperties: 2 })
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "integer" })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(false);
    expect(validate({ foo: 1 })).toBe(false);
    expect(validate({ foo: 1, bar: "2" })).toBe(true);
    expect(validate({ bar: "2", baz: true })).toBe(true);
    expect(validate({ foo: 1, bar: "2", baz: true })).toBe(true);
  });
});
