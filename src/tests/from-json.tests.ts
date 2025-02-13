import { describe, it, expect } from "vitest";
import { AjvObject, AjvProperty } from "../ajv-schema";
import { AjvJsonSchema, AjvSchema } from "../types";

describe("Test 'fromJson' method of 'AjvSchema' class", () => {
  it("fromJson should convert a JSON object to an 'AjvSchema' instance", () => {
    @AjvObject({ additionalProperties: false })
    class Item extends AjvSchema {
      @AjvProperty({ type: "integer" })
      baz?: number;

      @AjvProperty({ type: "string" })
      zad?: string;
    }

    @AjvObject({ additionalProperties: false })
    class MySchema extends AjvSchema {
      @AjvProperty({ type: "integer" })
      foo?: number;

      @AjvProperty({ type: "string" })
      bar?: string;

      @AjvProperty(Item)
      item?: Item;

      @AjvProperty({ type: "array", items: Item })
      list?: Item[];
    }

    const json: AjvJsonSchema<MySchema> = {
      foo: 2,
      bar: "abc",
      item: { baz: 1, zad: "zad" },
      list: [
        { baz: 1, zad: "zad" },
        { baz: 2, zad: "zad 2" },
      ],
    };

    const instance = MySchema.fromJson(MySchema, json);

    expect(instance.foo).toBe(json.foo);
    expect(instance.bar).toBe(json.bar);
    expect(instance.item?.baz).toBe(json.item?.baz);
    expect(instance.item?.zad).toBe(json.item?.zad);
    expect(instance.list?.length).toBe(json.list?.length);
    expect(instance.list?.[0].baz).toBe(json.list?.[0].baz);
    expect(instance.list?.[0].zad).toBe(json.list?.[0].zad);
    expect(instance.list?.[1].baz).toBe(json.list?.[1].baz);
    expect(instance.list?.[1].zad).toBe(json.list?.[1].zad);
  });
});
