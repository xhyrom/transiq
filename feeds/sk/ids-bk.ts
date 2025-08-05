import type { Feed, FileSource } from "@types";

export default {
  id: "ids-bk_regional",
  name: "IDS BK Regional Buses",
  getLatestSource: async (): Promise<FileSource> => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='1n9r_hGe-msl3bGa0q9vqI_ENODHT6n7x'+in+parents&key=${process.env.GOOGLE_API_KEY}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as any;
      const sortedFiles = data.files
        .filter((file: any) => file.name.endsWith("-gtfs.zip"))
        .sort((a: any, b: any) => {
          const dateA = a.name.slice(0, 8);
          const dateB = b.name.slice(0, 8);
          return dateB.localeCompare(dateA);
        });

      return {
        type: "google_drive",
        fileId: sortedFiles[0].id,
      };
    } catch (error) {
      throw error;
    }
  },
} satisfies Feed;
