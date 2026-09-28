import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Convex rewrites these on every `convex dev`, carrying their own
    // eslint-disable headers. Linting them only ever reports that those
    // headers are unnecessary -- a warning about generated text that any
    // fix would undo on the next codegen.
    "convex/_generated/**",
  ]),
]);

export default eslintConfig;
