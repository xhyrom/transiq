import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "a-express-sro",
  name: "A-EXPRESS s.r.o.",
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "a-express-sro",
  }),
} satisfies Feed;
