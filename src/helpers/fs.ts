/*
  This file includes code taken from the Hardhat project:
  https://github.com/NomicFoundation/hardhat/blob/7e228d09ad28dd7206be6571fb16a29927f2d693/v-next/hardhat-utils/src/fs.ts

  The original code is licensed under the MIT License:
  https://github.com/NomicFoundation/hardhat/blob/7e228d09ad28dd7206be6571fb16a29927f2d693/v-next/hardhat-utils/LICENSE
*/
import path from "node:path";
import fs from "node:fs/promises";

export async function findUp(
  fileName: string,
  from: string,
): Promise<string | undefined> {
  let currentDir = from;
  while (true) {
    const absolutePath = path.join(currentDir, fileName);
    if (await exists(absolutePath)) {
      return absolutePath;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

export async function exists(absolutePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(absolutePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(absolutePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
