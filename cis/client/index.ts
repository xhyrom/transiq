import { join } from "node:path";
import { exists, readdir, readFile } from "node:fs/promises";
import JSZip from "jszip";

export async function getGftsZip(id: string): Promise<ArrayBuffer> {
  const gtfsDir = join(".tmp", "cp-sk", id, "gtfs");

  if (!(await exists(gtfsDir))) {
    throw new Error(
      `GTFS directory not found: ${gtfsDir}. Make sure to run the cis:run script first.`,
    );
  }

  const zipPath = join(gtfsDir, "gtfs.zip");
  if (await exists(zipPath)) {
    return await Bun.file(zipPath).arrayBuffer();
  }

  const zip = new JSZip();

  const files = await readdir(gtfsDir);

  for (const file of files) {
    if (file.endsWith(".txt")) {
      const filePath = join(gtfsDir, file);
      const content = await readFile(filePath);
      zip.file(file, content);
    }
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9,
    },
  });

  return zipBuffer.buffer as ArrayBuffer;
}
