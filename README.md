This package supports `Ajv draft 2020-12`.
If you want to directly use `Ajv` to validate, import like this:

```
import Ajv from 'ajv/dist/2020'
```

If you want to use with other versions of `Ajv`, there might be some differences in terms of schema definition.
For example, `dependentRequired` is supported in version `2020` and older versions might throw an error
if the it exists in the schema.

## Reference

https://github.com/ajv-validator/ajv/blob/master/docs/json-schema.md

## Dependencies

This package depends on `ajv` and has been fully tested with `ajv@8.17.1`.
It supports `Ajv draft 2020-12`.
If you want to directly use `Ajv` to validate, import like this:

```
import Ajv from 'ajv/dist/2020'
```

If you want to have string format validation in your schema (such as `email`, `url`, `ipv4`, etc.),
you also need to make sure `ajv-formats` package is installed.

## Installation

- Make sure `Husky` will run properly by running these commands from the root of the project:

```bash
chmod +x .husky/pre-commit
chmod +x .husky/_/husky.sh
```

Then run:

```bash
yarn
yarn test # or 'yarn test:ui'
```

## How to use

This package uses TypeScript decorators. So, you need to enable the options below in your `tsconfig`:

```
"emitDecoratorMetadata": true,
"experimentalDecorators": true
```
