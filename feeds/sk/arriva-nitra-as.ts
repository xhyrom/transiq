import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "arriva-nitra-as",
  name: "ARRIVA Nitra, a.s.",
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "arriva-nitra-as",
  }),
} satisfies Feed;
