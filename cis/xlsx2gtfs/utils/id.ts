let $agencyId = 0;
let $stopId = 0;
let $tripId = 0;
let $serviceId = 0;

export function agencyId(): string {
  $agencyId++;
  return `A-${$agencyId}`;
}

export function stopId(): string {
  $stopId++;
  return `S-${$stopId}`;
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
