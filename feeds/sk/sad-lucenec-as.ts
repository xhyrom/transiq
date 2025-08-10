import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-lucenec-as",
  name: "SAD Lúčenec, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by SAD Dunajská Streda a.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "sad-lucenec-as",
  }),
} satisfies Feed;
