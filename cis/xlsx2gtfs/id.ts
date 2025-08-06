let $agencyId = 0;

export function agencyId() {
  $agencyId++;
  return `JDFA-${$agencyId}`;
}
