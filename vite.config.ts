import path from "path";
import dts from "vite-plugin-dts";
import * as pkg from "./package.json";

const NODE_ENV =
  (process.argv as unknown as { mode: string }).mode || "development";
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

  plugins: [dts({ rollupTypes: true })],
};
