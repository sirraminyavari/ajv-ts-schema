import "reflect-metadata";
import { AjvSchema, JsonSchema, ObjectOptions, PropertyOptions } from "./types";
import { isRequired, parseOptions, parseSchema } from "./util";

type BaseOptions = { required?: boolean; nullable?: boolean };

export function AjvProperty(options: (PropertyOptions & BaseOptions) | typeof AjvSchema) {
  return function (target: AjvSchema, propertyKey: string) {
    const existingProperties = Reflect.getMetadata("properties", target) || {};
    existingProperties[propertyKey] = options;
    Reflect.defineMetadata("properties", existingProperties, target);
  };
}

export function AjvObject<T extends object | undefined = undefined>(
  options?: ObjectOptions<T> & BaseOptions
) {
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
      required: Object.keys(properties).filter((key) => isRequired(properties[key])),
    };

    Reflect.defineMetadata("schema", schema, constructor);
    Reflect.defineMetadata("objectIsRequired", options?.required, constructor);
  };
}

export const getSchema = (schema: JsonSchema): any => {
  return parseSchema(schema);
};
