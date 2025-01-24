import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import { AjvObject, AjvProperty } from "../../ajv-schema";
import { AjvSchema } from "../../types";

const ajv = new Ajv({}); // options can be passed, e.g. {allErrors: true}

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

    const lessProps = validate({ bar: "abc" });
    const allProps = validate({ foo: 2, bar: "abc" });
    const extraProps = validate({ foo: 2, bar: "abc", baz: "baz" });

    expect(lessProps).toBe(true);
    expect(allProps).toBe(true);
    expect(extraProps).toBe(false);
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

    const oneProp = validate({ foo: 2 });
    const lessProps = validate({ bar: "abc", x: "abc" });
    const allProps = validate({ foo: 2, bar: "abc", xyz: "abc" });
    const extraProps = validate({ foo: 2, bar: "abc", baz: "baz" });
    const manyProps = validate({ foo: 2, bar: "abc", baz: "abc", xyz: "abc" });

    expect(oneProp).toBe(true);
    expect(lessProps).toBe(true);
    expect(allProps).toBe(true);
    expect(extraProps).toBe(false);
    expect(manyProps).toBe(false);
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

    const oneProp = validate({ foo: 2 });
    const lessProps = validate({ bar: "abc", x: "abc" });
    const allProps = validate({ foo: 2, bar: "abc", xyz: "abc" });
    const extraPropsString = validate({ foo: 2, bar: "abc", baz: "baz" });
    const extraPropsNumber = validate({ foo: 2, bar: "abc", baz: 22 });
    const manyProps = validate({ foo: 2, bar: "abc", baz: 22, xyz: "abc" });

    expect(oneProp).toBe(true);
    expect(lessProps).toBe(true);
    expect(allProps).toBe(true);
    expect(extraPropsString).toBe(false);
    expect(extraPropsNumber).toBe(true);
    expect(manyProps).toBe(true);
  });
});
