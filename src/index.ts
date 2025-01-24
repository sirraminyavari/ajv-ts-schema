import { AjvObject, AjvSchema, AjvProperty, getSchema } from "./types";
/*
import Ajv from "ajv";

const ajv = new Ajv({}); // options can be passed, e.g. {allErrors: true}

@AjvObject()
class ListItem extends AjvSchema {
  @AjvProperty({ type: "string" })
  label!: string;
}

@AjvObject()
class ObjectProperty extends AjvSchema {
  @AjvProperty({
    type: "formatted-string",
    required: true,
    format: "email",
    enum: ["ramin", "gesi"],
  })
  title!: unknown;

  @AjvProperty({
    type: "array",
    prefixItems: [ListItem, { type: "number", anyOf: [{ minimum: 0 }, { maximum: 10 }] }],
    items: { type: "formatted-string", format: "ipv4" },
    enum: [{ type: "formatted-string", required: true }],
    required: true,
  })
  list!: unknown;
}

@AjvObject<MySchema>({ dependentRequired: { b: ["name"] } })
class MySchema extends AjvSchema {
  @AjvProperty({
    type: "string",
    minLength: 5,
    maxLength: 30,
    pattern: "[\\da-z\\-]+",
    required: true,
    enum: ["ramin", "gesi"],
  })
  name!: any;

  @AjvProperty(ObjectProperty)
  obj!: any;

  @AjvProperty({ type: "boolean" })
  b!: string;
}

const singleProperty = getSchema({ type: "string", minLength: 5, maxLength: 30 });

console.log({
  singleProperty: JSON.stringify(singleProperty, null, 2),
});

console.log(JSON.stringify(MySchema.getSchema()));

const schema = {
  type: "object",
  properties: {
    foo: { type: "integer" },
    bar: { type: "string" },
  },
  required: ["foo"],
  additionalProperties: false,
};

const data = {
  bar: "abc",
};

const validate = ajv.compile(schema);
const valid = validate(data);
if (!valid) console.log(validate.errors);

export const test = "test";
*/

export default { AjvSchema, AjvObject, AjvProperty, getSchema };
