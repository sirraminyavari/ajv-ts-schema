import { OPTIONS, PROPERTIES } from "./metadata";
import {
  AjvSchema,
  type AjvNestedSchema,
  type AjvObjectOptions,
  type AjvPropertyOptions,
  type AjvSchemaClass,
  type JsonSchema,
  type ObjectJsonSchema,
} from "./types";

export type PropertyEntry = AjvPropertyOptions | AjvSchemaClass;

/** The decorator metadata of a class, as written by `AjvObject` and `AjvProperty`. */
export interface SchemaMetadata {
  [PROPERTIES]?: Map<string, PropertyEntry>;
  [OPTIONS]?: AjvObjectOptions<object>;
}

const metadataOf = (cls: object): SchemaMetadata | undefined =>
  (cls as { [Symbol.metadata]?: SchemaMetadata | null })[Symbol.metadata] ?? undefined;

/**
 * Decorated fields of a class, including the ones it inherits.
 * The metadata object of a subclass inherits from its parent's, so the lookup falls through to the parent.
 */
const propertiesOf = (cls: object) => metadataOf(cls)?.[PROPERTIES];

/**
 * `AjvObject` options of exactly this class. They are not inherited: a class without decorators of its own
 * sees its parent's metadata object, so the metadata must also be the class's own.
 */
const optionsOf = (cls: object) => {
  if (!Object.hasOwn(cls, Symbol.metadata)) return undefined;
  const metadata = metadataOf(cls);
  return metadata && Object.hasOwn(metadata, OPTIONS) ? metadata[OPTIONS] : undefined;
};

export function isSchemaClass(value: unknown): value is AjvSchemaClass {
  return typeof value === "function" && value.prototype instanceof AjvSchema;
}

function isRequired(entry: PropertyEntry): boolean {
  if (isSchemaClass(entry)) return optionsOf(entry)?.required === true;
  return entry.required === true;
}

/** Keys whose values are copied exactly as given, because they are values, not schemas. */
const VERBATIM_KEYS = new Set(["enum", "const", "default", "meta", "dependentRequired"]);

function convertAny(value: unknown): unknown {
  if (isSchemaClass(value)) return value.getSchema();
  if (Array.isArray(value)) return value.map(convertAny);
  if (value !== null && typeof value === "object") return convertObject(value);
  return value;
}

function convertObject(options: object): JsonSchema {
  const out: JsonSchema = {};

  for (const [key, raw] of Object.entries(options)) {
    // 'required' is collected into the parent's 'required' array instead.
    if (raw === undefined || key === "required") continue;

    if (VERBATIM_KEYS.has(key)) {
      out[key] = raw;
    } else if (key === "type") {
      // 'formatted-string' is an alias for 'string' that is not supported by ajv. So we convert it to 'string'.
      out.type = raw === "formatted-string" ? "string" : raw;
    } else if (key === "patternProperties") {
      const patterns: Record<string, JsonSchema> = {};
      for (const [pattern, schema] of Object.entries(raw as Record<string, AjvNestedSchema>)) {
        patterns[pattern] = convertSchema(schema);
      }
      out[key] = patterns;
    } else {
      out[key] = convertAny(raw);
    }
  }

  return out;
}

/** Converts a property-options object or a schema class into JSON Schema. */
export function convertSchema(value: AjvNestedSchema | AjvPropertyOptions): JsonSchema {
  return isSchemaClass(value) ? value.getSchema() : convertObject(value);
}

/** Builds the JSON Schema of a class from its decorator metadata. */
export function buildObjectSchema(cls: object): ObjectJsonSchema {
  const options = optionsOf(cls);
  const schema: ObjectJsonSchema = {
    type: "object",
    ...(options ? convertObject(options) : {}),
    properties: {},
    required: [],
  };

  for (const [name, entry] of propertiesOf(cls) ?? []) {
    schema.properties[name] = convertSchema(entry);
    if (isRequired(entry)) schema.required.push(name);
  }

  return schema;
}
