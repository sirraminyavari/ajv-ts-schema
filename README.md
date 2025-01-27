A TypeScript-first approach to defining JSON Schemas for use with `AJV`.

## Overview

`AJV` is a powerful JSON Schema validator, but creating schemas directly in JavaScript or TypeScript can be verbose and error-prone. This package, `@raminyavari/ajv-ts-schema`, bridges the gap by allowing you to define schemas using TypeScript decorators, making your schemas type-safe and reusable.

## Features

- **Type-Safe Validation**: Leverages TypeScript for safer, cleaner schema definitions.
- **Decorator-Based**: Simplifies schema creation with class and property decorators.
- **AJV Integration**: Easily compile and validate schemas using `AJV`.
- **Schema Reusability**: Use defined schemas for validation, request processing, and more.

## Installation

```bash
npm install @raminyavari/ajv-ts-schema
```

Or if you use yarn:

```bash
yarn add @raminyavari/ajv-ts-schema
```

Enable decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

_If you are a contributor and wnat to clone and run on your local_

Make sure `Husky` will run properly by running these commands from the root of the project:

```bash
chmod +x .husky/pre-commit
chmod +x .husky/_/husky.sh
```

Then run:

```bash
yarn
yarn test # or 'yarn test:ui'
```

## Quick Start

Define your schema using decorators:

```tsx
import { AjvObject, AjvProperty, AjvSchema } from "@raminyavari/ajv-ts-schema";

@AjvObject()
class MySchema extends AjvSchema {
  @AjvProperty({ type: "number", required: true })
  foo!: number;

  @AjvProperty({ type: "string", nullable: true })
  bar?: string | null;
}

const schema = MySchema.getSchema();
```

Validate with `AJV`:

```tsx
import Ajv from "ajv/dist/2020";

const ajv = new Ajv();
const validate = ajv.compile(schema);

if (!validate(input)) {
  console.error(validate.errors);
}
```

## Key Advantages

- **Code Completion**: Enhanced development experience with IDE suggestions.
- **Error Prevention**: Catch issues at compile-time rather than runtime.
- **Reusability**: Convert validated JSON objects into typed instances using `fromJson`.

## Documentation

- Full documentation and examples: [Documentation](https://www.raminy.dev/article/18712bd0-e06d-80b2-8e76-f86720b48d01/Simplifying%20AJV%20Schema%20Verification%20with%20TypeScript)
- NPM Package: [@raminyavari/ajv-ts-schema](https://www.npmjs.com/package/@raminyavari/ajv-ts-schema)
- JSON Schema Reference: [AJV Docs](https://github.com/ajv-validator/ajv/blob/master/docs/json-schema.md)

## Contributing

Contributions are welcome! Please submit issues or pull requests on the [GitHub Repository](https://github.com/sirraminyavari/ajv-ts-schema).
