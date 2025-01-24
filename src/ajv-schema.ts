import "reflect-metadata";
import { AjvSchema, JsonSchema, ObjectOptions, PropertyOptions } from "./types";
import { parseOptions, parseSchema } from "./util";

export function AjvProperty(
  options: (PropertyOptions & { required?: boolean; nullable?: boolean }) | typeof AjvSchema
) {
  return function (target: any, propertyKey: string) {
    const existingProperties = Reflect.getMetadata("properties", target) || {};
    existingProperties[propertyKey] = options;
    Reflect.defineMetadata("properties", existingProperties, target);
  };
}

export function AjvObject<T extends object | undefined = undefined>(options?: ObjectOptions<T>) {
  return function (constructor: typeof AjvSchema) {
    const properties = Reflect.getMetadata("properties", constructor.prototype) || {};

    const schema = {
      type: "object",
      ...(parseOptions(options) || {}),
      properties: Object.keys(properties).reduce(
        (acc, key) => {
          const schema = parseSchema(properties[key]);
          if (schema) acc[key] = schema;
          return acc;
        },
        {} as Record<string, unknown>
      ),
      required: Object.keys(properties).filter((key) => properties[key].required),
    };

    Reflect.defineMetadata("schema", schema, constructor);
  };
}

export const getSchema = (schema: JsonSchema): any => {
  return parseSchema(schema);
};
