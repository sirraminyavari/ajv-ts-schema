A TypeScript-first approach to defining JSON Schemas for use with `AJV`.

## Overview

`AJV` is a powerful JSON Schema validator, but creating schemas directly in JavaScript or TypeScript can be verbose and error-prone. This package, `@raminy/ajv-ts-schema`, bridges the gap by allowing you to define schemas using TypeScript decorators, making your schemas type-safe and reusable.

## Features

- **Type-Safe Validation**: Leverages TypeScript for safer, cleaner schema definitions.
- **Decorator-Based**: Simplifies schema creation with class and property decorators.
- **AJV Integration**: Easily compile and validate schemas using `AJV`.
- **Schema Reusability**: Use defined schemas for validation, request processing, and more.

## Installation

```bash
npm install @raminy/ajv-ts-schema
```

Or if you use yarn:

```bash
yarn add @raminy/ajv-ts-schema
```

The package uses standard (TC39) decorators, which TypeScript supports from version 5.2. No extra compiler options or `reflect-metadata` are needed. Make sure `experimentalDecorators` is **not** enabled in your `tsconfig.json`, because it switches TypeScript to the legacy decorators.

The decorators rely on `Symbol.metadata`. The package defines it when the runtime does not, so importing the package is enough.

_If you are a contributor and want to clone and run on your local_

Make sure `Husky` will run properly by running this command from the root of the project:

```bash
chmod +x .husky/pre-commit
```

Then run:

```bash
yarn
yarn test # or 'yarn test:ui'
yarn typecheck # type-level tests in 'src/tests/types'
```

## Quick Start

Define your schema using decorators:

```tsx
import { AjvObject, AjvProperty, AjvSchema } from "@raminy/ajv-ts-schema";

@AjvObject()
class MySchema extends AjvSchema {
  @AjvProperty({ type: "number", required: true })
  foo!: number;

  @AjvProperty({ type: "string", nullable: true })
  bar?: string | null;
}

const schema = MySchema.getSchema();
```

A class that extends another schema class inherits its decorated fields. `AjvObject` options are not inherited, so decorate the subclass with its own `AjvObject` when it needs them.

```tsx
@AjvObject({ additionalProperties: false })
class Admin extends MySchema {
  @AjvProperty({ type: "boolean" })
  root?: boolean;
}

// properties: foo, bar and root
const adminSchema = Admin.getSchema();
```

Validate with `AJV`:

```tsx
import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { AjvSchema, type AjvJsonSchema } from "@raminy/ajv-ts-schema";

const ajv = new Ajv({ useDefaults: true });
addFormats(ajv);
const validate = ajv.compile(schema); // 'schema' comes from 'MySchema.getSchema()'

const myFunction = (input: any) => {
  if (!validate(input)) {
    console.error(validate.errors);
  }

  // 'fromJson' returns and instance of 'MySchema'
  const typedSchema = AjvSchema.fromJson<MySchema>(MySchema, input);
};

// or you can do this instead

const isMySchema = (input: any): input is AjvJsonSchema<MySchema> => {
  return validate(input);
};

const myFunction = (input: any) => {
  if (!isMySchema(input)) {
    console.error(validate.errors);
  }

  // for the rest of the code 'input' is of type 'AjvJsonSchema<MySchema>'
  // which is a JSON object
};
```

## Key Advantages

- **Code Completion**: Enhanced development experience with IDE suggestions.
- **Error Prevention**: Catch issues at compile-time rather than runtime.
- **Reusability**: Convert validated JSON objects into typed instances using `fromJson`.

## Documentation

- Full documentation and examples: [Documentation](https://www.raminy.dev/article/18712bd0-e06d-80b2-8e76-f86720b48d01/Simplifying%20AJV%20Schema%20Validation%20with%20TypeScript)
- NPM Package: [@raminy/ajv-ts-schema](https://www.npmjs.com/package/@raminy/ajv-ts-schema)
- JSON Schema Reference: [AJV Docs](https://github.com/ajv-validator/ajv/blob/master/docs/json-schema.md)

## Contributing

Contributions are welcome! Please submit issues or pull requests on the [GitHub Repository](https://github.com/sirraminyavari/ajv-ts-schema).
