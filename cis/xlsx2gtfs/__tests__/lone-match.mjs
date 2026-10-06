/**
 * The rule that decides whether a lone name match belongs to the route.
 *
 * `queryAllStopsByCisName` matches on the name alone, and the disambiguation in
 * `resolver.ts` only ran when a name had several matches. A name with exactly one
 * match was taken unconditionally — and that is the case that goes wrong, because
 * the one match can be a namesake somewhere else entirely.
 *
 * The three failing cases below are real, taken from the published feeds. The five
 * passing ones are the shapes a stricter rule would have broken: a route crossing
 * into the neighbouring district, an express coach with a two-hundred-kilometre
 * leg, the first stop of a route, and a route with only one stop placed so far.
 *
 *   node cis/xlsx2gtfs/__tests__/lone-match.mjs
 *
 * Kept as a standalone script because the repository has no test runner; it exits
 * non-zero on a disagreement, which is all a CI step needs.
 */
const LONE_MATCH_MAX_KM = 50, LONE_MATCH_MIN_CONTEXT = 2;
const R = 6371, rad = d => d * Math.PI / 180;
const km = (a, b, c, d) => {
  const dLat = rad(c - a), dLon = rad(d - b);
  const x = Math.sin(dLat/2)**2 + Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};
function belongs(match, placed, districts) {
  if (placed.length < LONE_MATCH_MIN_CONTEXT) return true;
  if (!match.lat || !match.lon || match.lat === -1) return true;
  if (match.district && districts.includes(match.district)) return true;
  const nearest = Math.min(...placed.map(s => km(match.lat, match.lon, s.lat, s.lon)));
  return nearest <= LONE_MATCH_MAX_KM;
}

// `belongsToRoute` in ../resolver.ts, kept in step by hand: the rule is eight
// lines and a copy here is cheaper than wiring a bundler into a test.
const CASES = [
  {
    name: "Bystřice, žel.st. on route 306402 — the Czech namesake, 285 km away",
    match: { lat: 49.740601, lon: 14.66633, district: "Benešov" },
    placed: [{ lat: 49.0924, lon: 18.4164 }, { lat: 49.1144, lon: 18.4453 }],
    districts: ["Považská Bystrica"], want: false,
  },
  {
    name: "Biskupice,nám. on route 60474 — the Bánovce namesake, 129 km away",
    match: { lat: 48.708939, lon: 18.24102, district: "Bánovce nad Bebravou" },
    placed: [{ lat: 48.2707, lon: 19.8231 }, { lat: 48.2890, lon: 19.8650 }],
    districts: ["Lučenec"], want: false,
  },
  {
    name: "Prešov, Levočská — resolved into okres Poprad, 67 km away",
    match: { lat: 49.0587, lon: 20.2986, district: "Poprad" },
    placed: [{ lat: 48.9975, lon: 21.2393 }, { lat: 49.0005, lon: 21.2242 }],
    districts: ["Prešov"], want: false,
  },
  {
    name: "a stop in the route\u2019s own district is taken",
    match: { lat: 49.1200, lon: 18.4500, district: "Považská Bystrica" },
    placed: [{ lat: 49.0924, lon: 18.4164 }, { lat: 49.1144, lon: 18.4453 }],
    districts: ["Považská Bystrica"], want: true,
  },
  {
    name: "the neighbouring district 20 km away — routes cross borders",
    match: { lat: 49.2231, lon: 18.7394, district: "Žilina" },
    placed: [{ lat: 49.1144, lon: 18.4453 }, { lat: 49.0924, lon: 18.4164 }],
    districts: ["Považská Bystrica"], want: true,
  },
  {
    name: "an express with a 200 km leg, but into a district the route knows",
    match: { lat: 48.7164, lon: 21.2611, district: "Košice" },
    placed: [{ lat: 48.1486, lon: 17.1077 }, { lat: 48.7164, lon: 21.2611 }],
    districts: ["Bratislava", "Košice"], want: true,
  },
  {
    name: "the first stop of a route — no context yet, so it is taken",
    match: { lat: 49.740601, lon: 14.66633, district: "Benešov" },
    placed: [], districts: [], want: true,
  },
  {
    name: "one placed stop is not a route context",
    match: { lat: 49.740601, lon: 14.66633, district: "Benešov" },
    placed: [{ lat: 49.0924, lon: 18.4164 }], districts: ["Považská Bystrica"], want: true,
  },
];
let bad = 0;
for (const c of CASES) {
  const got = belongs(c.match, c.placed, c.districts);
  const ok = got === c.want;
  if (!ok) bad++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${c.name}: took=${got}, expected=${c.want}`);
}
console.log(`--- ${CASES.length} cases, ${bad} disagreements`);
process.exit(bad ? 1 : 0);
