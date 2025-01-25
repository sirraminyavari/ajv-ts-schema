import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({});

describe("Test 'dependentRequired' of 'object'", () => {
  it("Check if 'dependentRequired' works as expected", () => {
    @AjvObject<MySchema>({ dependentRequired: { foo: ["bar", "baz"] } })
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "integer" })
      foo!: unknown;

      @AjvProperty({ type: "integer" })
      bar!: unknown;

      @AjvProperty({ type: "integer" })
      baz!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: 1, bar: 2, baz: 3 })).toBe(true);
    expect(validate({ a: 1 })).toBe(true);
    expect(validate({ foo: 1 })).toBe(false);
    expect(validate({ foo: 1, bar: 2 })).toBe(false);
    expect(validate({ foo: 1, baz: 22 })).toBe(false);
  });
});
