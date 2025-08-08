import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "arriva-nitra-as",
  name: "ARRIVA Nitra, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by ARRIVA Nitra, a.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "arriva-nitra-as",
  }),
} satisfies Feed;
