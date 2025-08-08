import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "slovak-lines-express-as",
  name: "Slovak Lines Express, a.s.",
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "slovak-lines-express-as",
  }),
} satisfies Feed;
