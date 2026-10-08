// Local runs read backend/.env; on Railway the variables come from the dashboard and this file does nothing.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = join(dirname(fileURLToPath(import.meta.url)), "../.env");
if (existsSync(file)) process.loadEnvFile(file);
