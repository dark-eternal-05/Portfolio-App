import fs from "fs/promises";
import path from "path";

const FILE_PATH = path.join(
  process.cwd(),
  "data",
  "applications.json",
);

export async function getBackupApplications() {
  const raw = await fs.readFile(
    FILE_PATH,
    "utf-8",
  );

  return JSON.parse(raw);
}

export async function saveBackupApplications(
  data: any[],
) {
  await fs.writeFile(
    FILE_PATH,
    JSON.stringify(data, null, 2),
  );
}