import { exists } from "node:fs/promises";
import { join } from "node:path";

const dir = join(".transiq", "kaeru.tsv");
if (!(await exists(dir))) {
  throw new Error(
    `File ${dir} does not exist. Please run dump-stations first.`,
  );
}
