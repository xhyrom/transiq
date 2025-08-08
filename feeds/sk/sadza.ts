import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sadza",
  name: "SAD Žilina",
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://gtfs.transdata.sk/SADZA/gtfs.zip",
  }),
} satisfies Feed;
