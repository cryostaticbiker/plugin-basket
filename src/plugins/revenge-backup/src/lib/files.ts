import { ReactNative as RN } from "@vendetta/metro/common";

import type { BackupFile } from "./types";

const FILE_PREFIX = "revenge-plugin-backup";

type DownloadAttempt = {
  label: string;
  run: () => Promise<unknown> | unknown;
};

export type SaveBackupFileResult = {
  fileName: string;
  downloaded: boolean;
  method: "downloads" | "internal";
  uri?: string;
};

function filenameFor(backup: BackupFile) {
  return `${FILE_PREFIX}-${new Date(backup.updatedAt).toISOString().replace(/[:.]/g, "-")}.json`;
}

function getNativeModules() {
  return {
    ...((globalThis as any).nativeModuleProxy ?? {}),
    ...((globalThis as any).window?.nativeModuleProxy ?? {}),
    ...((RN as any).NativeModules ?? {}),
  };
}

function getFileManager() {
  const modules = getNativeModules();
  return modules.DCDFileManager ?? modules.RTNFileManager ?? modules.RNFileModule;
}

function getFileManagerConstants(fileManager: any) {
  return typeof fileManager?.getConstants === "function" ? fileManager.getConstants() : {};
}

function normalizeFileUri(path: string) {
  if (path.startsWith("file://") || path.startsWith("content://")) return path;
  return `file://${path.startsWith("/") ? "" : "/"}${path}`;
}

function normalizeResultUri(result: unknown, fallbackPath: string) {
  const path = typeof result === "string" && result ? result : fallbackPath;
  return normalizeFileUri(path);
}

async function runAttempts(attempts: DownloadAttempt[]) {
  for (const attempt of attempts) {
    try {
      // Add timeout to prevent indefinite hangs on file operations
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("File operation timeout")), 5000)
      );
      const result = await Promise.race([attempt.run(), timeoutPromise]);
      return { attempt: attempt.label, result };
    } catch (error) {
      console.warn(`[Revenge Backup] Download attempt failed: ${attempt.label}`, error);
    }
  }

  return undefined;
}

async function writeToDownloads(fileName: string, content: string) {
  const fileManager = getFileManager();
  if (typeof fileManager?.writeFile !== "function") return undefined;

  const constants = getFileManagerConstants(fileManager);
  const downloadRoots = [
    constants.DownloadDirPath,
    constants.DownloadsDirPath,
    constants.ExternalDownloadDirPath,
    constants.ExternalDownloadsDirPath,
    constants.ExternalStorageDirectoryPath ? `${constants.ExternalStorageDirectoryPath}/Download` : undefined,
    constants.ExternalStorageDirPath ? `${constants.ExternalStorageDirPath}/Download` : undefined,
  ].filter(Boolean);

  const attempts: DownloadAttempt[] = [
    {
      label: "writeFile(downloads)",
      run: () => fileManager.writeFile("downloads", fileName, content, "utf8"),
    },
    {
      label: "writeFile(download)",
      run: () => fileManager.writeFile("download", fileName, content, "utf8"),
    },
    {
      label: "writeFile(external/Download)",
      run: () => fileManager.writeFile("external", `Download/${fileName}`, content, "utf8"),
    },
    ...downloadRoots.flatMap((root): DownloadAttempt[] => {
      const fullPath = `${root}/${fileName}`;
      return [
        {
          label: `writeFile(absolute, ${fullPath})`,
          run: () => fileManager.writeFile("absolute", fullPath, content, "utf8"),
        },
      ];
    }),
  ];

  const successfulAttempt = await runAttempts(attempts);
  if (!successfulAttempt) return undefined;

  const fallbackPath = downloadRoots.length ? `${downloadRoots[0]}/${fileName}` : fileName;
  return normalizeResultUri(successfulAttempt.result, fallbackPath);
}

async function writeInternalCopy(fileName: string, content: string) {
  const fileManager = getFileManager();
  if (typeof fileManager?.writeFile !== "function") return undefined;

  const result = await runAttempts([
    {
      label: "writeFile(documents)",
      run: () => fileManager.writeFile("documents", fileName, content, "utf8"),
    },
    {
      label: "writeFile(cache)",
      run: () => fileManager.writeFile("cache", fileName, content, "utf8"),
    },
  ]);

  if (!result) return undefined;

  const constants = getFileManagerConstants(fileManager);
  const root = constants.DocumentsDirPath ?? constants.CacheDirPath;
  return normalizeResultUri(result.result, root ? `${root}/${fileName}` : fileName);
}

export function serializeBackup(backup: BackupFile) {
  return JSON.stringify(backup, null, 2);
}

export async function saveBackupFile(backup: BackupFile): Promise<SaveBackupFileResult> {
  const fileName = filenameFor(backup);
  const content = serializeBackup(backup);

  const downloadUri = await writeToDownloads(fileName, content);
  if (downloadUri) return { fileName, downloaded: true, method: "downloads", uri: downloadUri };

  const internalUri = await writeInternalCopy(fileName, content);
  if (internalUri) return { fileName, downloaded: false, method: "internal", uri: internalUri };

  return { fileName, downloaded: false, method: "internal" };
}
