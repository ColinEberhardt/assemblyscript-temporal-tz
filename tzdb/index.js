//@ts-check
import fs from "fs";
import { parseDatabase } from "./parser.js";
import { emit } from "./emitter.js";
import prettier from "prettier";

const databases = ["northamerica", "europe"];

const db = databases
  .map((d) => fs.readFileSync(`tzdb/iana/${d}`, "UTF8"))
  .map(parseDatabase)
  .reduce(
    (prev, curr) => ({
      zones: prev.zones.concat(curr.zones),
      rules: prev.rules.concat(curr.rules),
    }),
    { zones: [], rules: [] }
  );
const as = emit(db);

fs.writeFileSync(
  "assembly/tz/iana.ts",
  prettier.format(as, { parser: "typescript" })
  // as
);
