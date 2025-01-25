import { describe, it, expect } from "vitest";
import Ajv from "ajv/dist/2020";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvSchema } from "../types";

const ajv = new Ajv({});

describe("Test 'patternProperties' of 'object'", () => {
  it("Check if 'patternProperties' works as expected", () => {
    @AjvObject({
      patternProperties: {
        "^fo.*$": { type: "string" },
        "^ba.*$": { type: "number" },
      },
    })
    class MySchema extends AjvSchema {}

    const schema = MySchema.getSchema();
    const validate = ajv.compile(schema);

    expect(validate({})).toBe(true);
    expect(validate({ foo: "a" })).toBe(true);
    expect(validate({ bar: 1 })).toBe(true);
    expect(validate({ foo: 1 })).toBe(false);
    expect(validate({ foo: "a", bar: "b" })).toBe(false);
  });

  it("'patternProperties' should not match any `property` names in the schema", () => {
    @AjvObject({
      patternProperties: {
        "^fo.*$": { type: "string" },
        "^ba.*$": { type: "number" },
      },
    })
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "string" })
      foo?: string;
    }

    const schema = MySchema.getSchema();

    try {
      ajv.compile(schema);

      /**
       * If we reach here, the test should fail, because the pattern matches a property name.
       */
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeTruthy();
    }
  });
});
