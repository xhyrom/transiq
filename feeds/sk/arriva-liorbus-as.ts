import type { Feed, FileSource } from "@types";

export default {
  id: "arriva-liorbus-as",
  name: "ARRIVA Liorbus, a.s.",
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "arriva-liorbus-as",
  }),
} satisfies Feed;
