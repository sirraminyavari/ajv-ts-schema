/**
 * Standard decorators share data between the decorators of one class through `context.metadata`,
 * which the runtime only provides when `Symbol.metadata` exists. Not every runtime defines it yet,
 * so it is polyfilled here. `Symbol.for` matches the fallback used by esbuild-compiled decorators.
 */
(Symbol as { metadata: symbol }).metadata ??= Symbol.for("Symbol.metadata");

/** Metadata key holding the decorated fields of a class (`Map<fieldName, options>`). */
export const PROPERTIES = Symbol("ajv-ts-schema:properties");

/** Metadata key holding the options passed to `AjvObject`. */
export const OPTIONS = Symbol("ajv-ts-schema:options");
