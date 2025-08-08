import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sadza",
  name: "SAD Žilina",
  license: {
    attribution: "© TransData s.r.o.",
    notes: "Data sourced from portal.cp.sk, provided by TransData s.r.o.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://gtfs.transdata.sk/SADZA/gtfs.zip",
  }),
} satisfies Feed;
