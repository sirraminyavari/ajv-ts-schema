import Ajv from "ajv";
import { AjvObject, AjvSchemaBase, AjvProperty } from "./types";

const ajv = new Ajv({}); // options can be passed, e.g. {allErrors: true}

@AjvObject()
class ObjectProperty extends AjvSchemaBase {
  @AjvProperty({
    type: "string",
    minLength: 5,
    maxLength: 30,
    pattern: "[\\da-z\\-]+",
    required: true,
    format: "email",
    enum: ["ramin", "gesi"],
  })
  name!: any;
}

@AjvObject<{ a: "ramin"; b: "gesi" }>({ dependentRequired: { a: ["b"] } })
class Schema extends AjvSchemaBase {
  @AjvProperty({
    type: "string",
    minLength: 5,
    maxLength: 30,
    pattern: "[\\da-z\\-]+",
    required: true,
    format: "email",
    enum: ["ramin", "gesi"],
  })
  name!: any;

  @AjvProperty(ObjectProperty)
  obj!: any;

  @AjvProperty({ type: "boolean" })
  b!: string;
}

const schema1 = Schema.getSchema();

console.log({
  a: 22,
  schema1: JSON.stringify(schema1, null, 2),
});

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

export default { AjvSchemaBase, AjvObject, AjvProperty };
