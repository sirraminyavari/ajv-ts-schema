import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({ useDefaults: true });

describe("Test generic options", () => {
  it("Test 'not'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "number", not: { minimum: 3 } })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({ foo: 1 })).toBe(true);
    expect(validate({ foo: 2 })).toBe(true);
    expect(validate({ foo: 3 })).toBe(false);
    expect(validate({ foo: 4 })).toBe(false);
  });

  it("Test 'oneOf'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "number", oneOf: [{ maximum: 3 }, { multipleOf: 1 }] })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({ foo: 1.5 })).toBe(true);
    expect(validate({ foo: 2 })).toBe(false);
    expect(validate({ foo: 2.5 })).toBe(true);
    expect(validate({ foo: 3 })).toBe(false);
    expect(validate({ foo: 4 })).toBe(true);
    expect(validate({ foo: 4.5 })).toBe(false);
    expect(validate({ foo: 5 })).toBe(true);
    expect(validate({ foo: 5.5 })).toBe(false);
  });

  it("Test 'anyOf'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "number", anyOf: [{ maximum: 3 }, { multipleOf: 1 }] })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({ foo: 1.5 })).toBe(true);
    expect(validate({ foo: 2 })).toBe(true);
    expect(validate({ foo: 2.5 })).toBe(true);
    expect(validate({ foo: 3 })).toBe(true);
    expect(validate({ foo: 4 })).toBe(true);
    expect(validate({ foo: 4.5 })).toBe(false);
    expect(validate({ foo: 5 })).toBe(true);
    expect(validate({ foo: 5.5 })).toBe(false);
  });

  it("Test 'allOf'", () => {
    @AjvObject()
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "number", allOf: [{ maximum: 3 }, { multipleOf: 1 }] })
      foo!: unknown;
    }

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({ foo: 1.5 })).toBe(false);
    expect(validate({ foo: 2 })).toBe(true);
    expect(validate({ foo: 2.5 })).toBe(false);
    expect(validate({ foo: 3 })).toBe(true);
    expect(validate({ foo: 4 })).toBe(false);
    expect(validate({ foo: 4.5 })).toBe(false);
    expect(validate({ foo: 5 })).toBe(false);
    expect(validate({ foo: 5.5 })).toBe(false);
  });
});
