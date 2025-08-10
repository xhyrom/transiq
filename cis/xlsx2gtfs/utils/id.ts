let $tripId = 0;
let $serviceId = 0;

export function agencyId(name: string): string {
  return `A-${id(serializeAgencyName(name)).slice(0, 8)}`;
}

export function stopId(name: string): string {
  return `S-${id(name).slice(0, 8)}`;
}

export function tripId(): string {
  $tripId++;
  return `T-${$tripId}`;
}

export function serviceId(): string {
  $serviceId++;
  return `SE-${$serviceId}`;
}

export function id(data: string) {
  const hasher = new Bun.CryptoHasher("md5");
  hasher.update(data);
  return hasher.digest("hex");
}

export function resetIds() {
  $tripId = 0;
  $serviceId = 0;
}

function serializeAgencyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
