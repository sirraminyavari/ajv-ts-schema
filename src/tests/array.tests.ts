import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({});

describe("Test 'array'", () => {
  it("Test 'minItems'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "array", minItems: 2 })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: [] })).toBe(false);
    expect(validate({ foo: [1] })).toBe(false);
    expect(validate({ foo: [1, "2"] })).toBe(true);
    expect(validate({ foo: [1, "2", true] })).toBe(true);
  });

  it("Test 'maxItems'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "array", maxItems: 2 })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: [] })).toBe(true);
    expect(validate({ foo: [1] })).toBe(true);
    expect(validate({ foo: [1, "2"] })).toBe(true);
    expect(validate({ foo: [1, "2", true] })).toBe(false);
  });

  it("Test 'uniqueItems'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "array", uniqueItems: true })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: [] })).toBe(true);
    expect(validate({ foo: [1] })).toBe(true);
    expect(validate({ foo: [1, "2"] })).toBe(true);
    expect(validate({ foo: [1, 1] })).toBe(false);
    expect(validate({ foo: [[1], [1]] })).toBe(false);
    expect(validate({ foo: [[1], [2]] })).toBe(true);
    expect(
      validate({
        foo: [
          { foo: 1, bar: 2 },
          { bar: 2, foo: 1 },
        ],
      })
    ).toBe(false);
    expect(
      validate({
        foo: [
          { foo: 1, bar: 2 },
          { bar: 2, foo: 11 },
        ],
      })
    ).toBe(true);
  });

  it("Test 'prefixItems'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({
        type: "array",
        prefixItems: [{ type: "integer", maximum: 10 }, { type: "string" }],
      })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: [9] })).toBe(true);
    expect(validate({ foo: [9, "2"] })).toBe(true);
    expect(validate({ foo: [11, "2"] })).toBe(false);
    expect(validate({ foo: [9, 10] })).toBe(false);
    expect(validate({ foo: [9, "2", true, { a: 1 }] })).toBe(true);
  });

  it("Test 'items'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({
        type: "array",
        items: { type: "integer", maximum: 10, minimum: 5 },
      })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: [9] })).toBe(true);
    expect(validate({ foo: [9, "2"] })).toBe(false);
    expect(validate({ foo: [9, 11] })).toBe(false);
    expect(validate({ foo: [5, 8, 10] })).toBe(true);
  });

  it("Test 'contains', 'minContains', and 'maxContains'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({
        type: "array",
        contains: { type: "integer", maximum: 10, minimum: 5 },
        minContains: 2,
        maxContains: 4,
      })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: null })).toBe(false);
    expect(validate({ foo: undefined })).toBe(true);
    expect(validate({ foo: [9] })).toBe(false);
    expect(validate({ foo: [9, "2"] })).toBe(false);
    expect(validate({ foo: [9, 2] })).toBe(false);
    expect(validate({ foo: [9, 6] })).toBe(true);
    expect(validate({ foo: [9, 6, 5, 10] })).toBe(true);
    expect(validate({ foo: [9, 6, 5, 8, 10] })).toBe(false);
  });
});
