export type LogLevel = "INFO" | "ERROR";

export function log(level: LogLevel, message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level}: ${message}`);
}
