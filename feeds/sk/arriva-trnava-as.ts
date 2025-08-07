import type { Feed, FileSource } from "@types";

export default {
  id: "arriva-trnava-as",
  name: "ARRIVA Trnava, a.s.",
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "arriva-trnava-as",
  }),
} satisfies Feed;
