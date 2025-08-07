export function formatTimeToGtfs(timeStr: string | number): string {
  const timeString = String(timeStr);

  if (!timeString.includes(":")) {
    console.warn(`Unexpected time format: ${timeString}`);
    return "00:00:00";
  }

  const [hours, minutes] = timeString.split(":");

  const paddedHours = hours!.trim().padStart(2, "0");
  const paddedMinutes = minutes ? minutes.trim().padStart(2, "0") : "00";

  return `${paddedHours}:${paddedMinutes}:00`;
}
