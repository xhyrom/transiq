import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-dunajska-streda-as",
  name: "SAD Dunajská Streda, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by SAD Dunajská Streda a.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "sad-dunajska-streda-as",
  }),
} satisfies Feed;
