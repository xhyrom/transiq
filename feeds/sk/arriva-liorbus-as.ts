import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "arriva-liorbus-as",
  name: "ARRIVA Liorbus, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by ARRIVA Liorbus, a.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "arriva-liorbus-as",
  }),
} satisfies Feed;
