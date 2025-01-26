import { AjvSchema, JsonSchema } from "./types";

export function isSubclassOfAjvSchema(cls: Function | JsonSchema): boolean {
  while (cls) {
    if (cls === AjvSchema) {
      return true;
    }

    cls = Object.getPrototypeOf(cls);
  }

  return false;
}

export const parseOptions = (options: any): object | undefined => {
  if (typeof options === "undefined") return undefined;
  else if (Array.isArray(options)) {
    return options.map((option) => parseOptions(option));
  } else if (isSubclassOfAjvSchema(options)) {
    return parseSchema(options);
  } else if (typeof options === "object") {
    return Object.keys(options).reduce<Record<string, any>>((acc, key) => {
      /**
       * Properties of free value types don't need conversion.
       * Because they are values not schemas.
       */
      if (["enum", "const", "default", "meta"].some((k) => k === key)) {
        acc[key] = options[key];
      } else if (key === "type" && options[key] === "formatted-string") {
        // 'formatted-string' is an alias for 'string' that is not supported by ajv. So we convert it to 'string'.
        acc["type"] = "string";
      } else if (key === "required") {
        // 'required' is handled separately.
        return acc;
      } else {
        acc[key] = parseOptions(options[key]);
      }

      return acc;
    }, {});
  } else {
    return options;
  }
};

export const parseSchema = (schema: any): object | undefined => {
  if (!schema) return undefined;
  else if (isSubclassOfAjvSchema(schema)) {
    return (schema as typeof AjvSchema).getSchema();
  } else {
    return parseOptions(schema);
  }
};

export const isRequired = (schema: any): boolean => {
  if (!schema) return false;
  if (isSubclassOfAjvSchema(schema)) {
    return !!Reflect.getMetadata("objectIsRequired", schema);
  } else return !!schema.required;
};
