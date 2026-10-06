import { OPTIONS, PROPERTIES } from "./metadata";
import type {
  AjvObjectOptions,
  AjvPropertyOptions,
  AjvSchema,
  AjvSchemaClass,
  JsonSchema,
} from "./types";
import { convertSchema, type PropertyEntry, type SchemaMetadata } from "./util";

/**
 * Field decorator. Takes an options object or a class that extends `AjvSchema`.
 * Only public, non-static fields of classes that extend `AjvSchema` can be decorated.
 */
export function AjvProperty(options: AjvPropertyOptions | AjvSchemaClass) {
  return function <This extends AjvSchema, Value>(
    _value: undefined,
    context: ClassFieldDecoratorContext<This, Value> & {
      name: string;
      static: false;
      private: false;
    }
  ): void {
    const metadata = context.metadata as SchemaMetadata;

    // A subclass's metadata inherits from its parent's. Copy the parent's fields on first write,
    // so the subclass keeps them and the parent never sees the subclass's fields.
    const properties: Map<string, PropertyEntry> = Object.hasOwn(metadata, PROPERTIES)
      ? metadata[PROPERTIES]!
      : (metadata[PROPERTIES] = new Map(metadata[PROPERTIES]));

    properties.set(context.name, options);
  };
}

/** Class decorator. Only classes that extend `AjvSchema` can be decorated. */
export function AjvObject<T extends object | undefined = undefined>(options?: AjvObjectOptions<T>) {
  return function <C extends AjvSchemaClass>(_value: C, context: ClassDecoratorContext<C>): void {
    (context.metadata as SchemaMetadata)[OPTIONS] = options ?? {};
  };
}

/** Converts one property-options object, or one schema class, into JSON Schema. */
export function getSchema(schema: AjvPropertyOptions | AjvSchemaClass): JsonSchema {
  return convertSchema(schema);
}
