import { appendFileSync } from "node:fs";
import { join } from "node:path";

export type LogLevel = "INFO" | "ERROR";

const logFile = join(".transiq", "kaeru.log");

export function log(level: LogLevel, message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level}: ${message}\n`;

  appendFileSync(logFile, logMessage);

  console.log(`${level}: ${message}`);
}
