import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-zilina-as",
  name: "SAD Žilina, a.s.",
  license: {
    attribution: "© TransData s.r.o.",
    notes: "Data sourced from gtfs.transdata.sk, provided by TransData s.r.o.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://gtfs.transdata.sk/SADZA/gtfs.zip",
  }),
} satisfies Feed;
