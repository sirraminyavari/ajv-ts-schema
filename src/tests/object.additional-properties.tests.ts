import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({});

describe("Test 'additionalProperties: false' of 'object'", () => {
  it("Check 'additionalProperties'", () => {
    @AjvObject({ additionalProperties: false })
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "integer" })
      foo!: unknown;

      @AjvProperty({ type: "string" })
      bar!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({ bar: "abc" })).toBe(true);
    expect(validate({ foo: 2, bar: "abc" })).toBe(true);
    expect(validate({ foo: 2, bar: "abc", baz: "baz" })).toBe(false);
  });

  it("Check 'additionalProperties: false' when 'patternProperties' is provided", () => {
    @AjvObject({ additionalProperties: false, patternProperties: { "^x.*$": { type: "string" } } })
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "integer" })
      foo!: unknown;

      @AjvProperty({ type: "string" })
      bar!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({ foo: 2 })).toBe(true);
    expect(validate({ bar: "abc", x: "abc" })).toBe(true);
    expect(validate({ foo: 2, bar: "abc", xyz: "abc" })).toBe(true);
    expect(validate({ foo: 2, bar: "abc", baz: "baz" })).toBe(false);
    expect(validate({ foo: 2, bar: "abc", baz: "abc", xyz: "abc" })).toBe(false);
  });

  it("Check 'additionalProperties: schema'", () => {
    @AjvObject({
      additionalProperties: { type: "integer" },
      patternProperties: { "^x.*$": { type: "string" } },
    })
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "integer" })
      foo!: unknown;

      @AjvProperty({ type: "string" })
      bar!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({ foo: 2 })).toBe(true);
    expect(validate({ bar: "abc", x: "abc" })).toBe(true);
    expect(validate({ foo: 2, bar: "abc", xyz: "abc" })).toBe(true);
    expect(validate({ foo: 2, bar: "abc", baz: "baz" })).toBe(false);
    expect(validate({ foo: 2, bar: "abc", baz: 22 })).toBe(true);
    expect(validate({ foo: 2, bar: "abc", baz: 22, xyz: "abc" })).toBe(true);
  });
});
