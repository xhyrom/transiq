let $agencyId = 0;
let $stopId = 0;

export function agencyId(): string {
  $agencyId++;
  return `A-${$agencyId}`;
}

export function stopId(): string {
  $stopId++;
  return `S-${$stopId}`;
}

export function id(data: string) {
  const hasher = new Bun.CryptoHasher("md5");
  hasher.update(data);
  return hasher.digest("hex");
}
