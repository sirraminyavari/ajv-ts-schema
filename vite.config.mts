import path from "path";
import dts from "vite-plugin-dts";
import * as pkg from "./package.json";
import { configDefaults } from "vitest/config";

const NODE_ENV = (process.argv as unknown as { mode: string }).mode || "development";
const VERSION = pkg.version;

export default {
  build: {
    copyPublicDir: false,
    lib: {
      entry: path.resolve(__dirname, "src", "index.ts"),
      name: "Index",
      fileName: "index",
    },
  },
  define: {
    NODE_ENV: JSON.stringify(NODE_ENV),
    VERSION: JSON.stringify(VERSION),
  },
  test: {
    globals: true, // Enables global test functions like 'describe' and 'it'
    environment: "node", // Use a Node.js-like environment
    include: ["src/**/*.tests.ts"],
    exclude: [...configDefaults.exclude], // Exclude node_modules and build files
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"], // Coverage reporters
    },
  },

  plugins: [dts({ rollupTypes: true })],
};
