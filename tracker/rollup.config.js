import path from "path";
import ts from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import { fileURLToPath } from "node:url";
const __filenameNew = fileURLToPath(import.meta.url);
const __dirnameNew = path.dirname(__filenameNew);
export default [
  // 打包ts文件生成js
  {
    input: "./src/core/index.ts",
    output: [
      // 打包生成esmodule规范js文件
      {
        file: path.resolve(__dirnameNew, "./dist/index.mjs"),
        format: "es",
      },
      // 打包生成commanjs规范js文件
      {
        file: path.resolve(__dirnameNew, "./dist/index.cjs"),
        format: "cjs",
      },
    ],
    plugins: [
      ts({ compilerOptions: { lib: ["es5", "es6", "dom"], target: "es5" } }),
      json(),
      terser({ toplevel: true }),
    ],
  },
  // 打包ts文件生成.d.ts文件
  {
    input: "./src/core/index.ts",
    output: {
      file: path.resolve(__dirnameNew, "./dist/index.d.ts"),
    },
    plugins: [dts()],
  },
];
