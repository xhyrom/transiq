import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "regiojet-as",
  name: "RegioJet, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by STUDENT AGENCY k.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "student-agency-ks",
  }),
} satisfies Feed;
