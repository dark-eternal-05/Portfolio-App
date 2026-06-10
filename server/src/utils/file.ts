import fs from "fs/promises";

export async function readJson<T>(path: string): Promise<T> {
  try {
    const data = await fs.readFile(path, "utf-8");

    return JSON.parse(data) as T;
  } catch {
    return [] as T;
  }
}

export async function writeJson<T>(
  path: string,
  data: T,
): Promise<void> {
  await fs.writeFile(
    path,
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}