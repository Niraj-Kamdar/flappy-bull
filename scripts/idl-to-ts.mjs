#!/usr/bin/env node
// Convert app/src/idl/*.json IDL files into Anchor-style .ts type helpers.
// Usage: node scripts/idl-to-ts.mjs [file.json ...]   (default: all json in app/src/idl)

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const IDL_DIR = "app/src/idl";

const pascal = (s) =>
  s.replace(/(^|[_-])(\w)/g, (_, __, c) => c.toUpperCase());

function convert(jsonPath) {
  const idl = JSON.parse(readFileSync(jsonPath, "utf8"));
  const name = pascal(idl.metadata?.name ?? basename(jsonPath, ".json"));
  const tsPath = join(dirname(jsonPath), basename(jsonPath, ".json") + ".ts");

  const out = `/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at \`target/idl/${basename(jsonPath)}\`.
 */
export type ${name} = ${JSON.stringify(idl, null, 2)};
`;

  writeFileSync(tsPath, out);
  console.log(`${jsonPath} -> ${tsPath}`);
}

const files = process.argv.slice(2);
const targets = files.length
  ? files
  : readdirSync(IDL_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(IDL_DIR, f));

targets.forEach(convert);
