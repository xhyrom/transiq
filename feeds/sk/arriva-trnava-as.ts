import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "arriva-trnava-as",
  name: "ARRIVA Trnava, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by ARRIVA Trnava, a.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "arriva-trnava-as",
  }),
} satisfies Feed;
