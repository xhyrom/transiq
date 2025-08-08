import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sadpd",
  name: "SAD Prievidza",
  license: {
    attribution: "© TransData s.r.o.",
    notes: "Data sourced from portal.cp.sk, provided by TransData s.r.o.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://gtfs.transdata.sk/SADPD/gtfs.zip",
  }),
} satisfies Feed;
