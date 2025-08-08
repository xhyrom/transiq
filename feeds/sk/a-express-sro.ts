import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "a-express-sro",
  name: "A-EXPRESS s.r.o.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by A-EXPRESS s.r.o. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "a-express-sro",
  }),
} satisfies Feed;
