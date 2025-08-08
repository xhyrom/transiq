import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "arriva-michalovce-as",
  name: "ARRIVA Michalovce, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by ARRIVA Michalovce, a.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "arriva-michalovce-as",
  }),
} satisfies Feed;
