import { ReactNative as RN } from "@vendetta/metro/common";

import type { BackupFile } from "./types";

const FILE_PREFIX = "revenge-plugin-backup";
const JSON_MIME_TYPE = "application/json";

type TempBackupFile = {
  fileName: string;
  path: string;
  uri: string;
  encodedUri: string;
  remove: () => unknown;
};

export type SaveBackupFileResult = {
  fileName: string;
  exported: boolean;
  method: "documents" | "share" | "internal";
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

function normalizeFileUri(path: string) {
  if (path.startsWith("file://") || path.startsWith("content://")) return path;
  return `file://${path.startsWith("/") ? "" : "/"}${path}`;
}

function encodeFileUri(uri: string) {
  return uri.startsWith("file://") ? encodeURI(uri) : uri;
}

function resolveWrittenPath(fileManager: any, storageDir: "cache" | "documents", fileName: string, writtenPath: unknown) {
  const path = String(writtenPath ?? "");
  if (path.startsWith("/") || path.startsWith("file://") || path.startsWith("content://")) return path;

  const constants = typeof fileManager?.getConstants === "function" ? fileManager.getConstants() : undefined;
  const root = storageDir === "cache" ? constants?.CacheDirPath : constants?.DocumentsDirPath;
  return root ? `${root}/${path || fileName}` : path || fileName;
}

async function writeBackupFile(storageDir: "cache" | "documents", fileName: string, content: string): Promise<TempBackupFile | undefined> {
  const fileManager = getFileManager();
  if (typeof fileManager?.writeFile !== "function") return undefined;

  // Keep the path flat: several Discord/Revenge file modules do not create
  // nested folders, and a nested path made the backup compile fail before the
  // document saver could open.
  const pathInStorage = fileName;

  try {
    const writtenPath = await fileManager.writeFile(storageDir, pathInStorage, content, "utf8");
    const path = resolveWrittenPath(fileManager, storageDir, fileName, writtenPath);
    const uri = normalizeFileUri(path);

    return {
      fileName,
      path,
      uri,
      encodedUri: encodeFileUri(uri),
      remove: () => fileManager.removeFile?.(storageDir, pathInStorage),
    };
  } catch (error) {
    console.warn(`[Revenge Backup] Could not write backup file to ${storageDir}`, error);
    return undefined;
  }
}

async function saveWithDocuments(file: TempBackupFile) {
  const { DocumentsNew } = getNativeModules();
  if (typeof DocumentsNew?.saveDocuments !== "function") return false;

  const attempts = [
    () => DocumentsNew.saveDocuments({
      sourceUris: [file.encodedUri],
      mimeType: JSON_MIME_TYPE,
      fileName: file.fileName,
      copy: true,
    }),
    () => DocumentsNew.saveDocuments({
      sourceUris: [file.uri],
      mimeType: JSON_MIME_TYPE,
      fileName: file.fileName,
      copy: true,
    }),
    () => DocumentsNew.saveDocuments({
      uris: [file.encodedUri],
      type: JSON_MIME_TYPE,
      name: file.fileName,
      copy: true,
    }),
    () => DocumentsNew.saveDocuments([file.encodedUri], JSON_MIME_TYPE, file.fileName),
    () => DocumentsNew.saveDocuments(file.encodedUri, JSON_MIME_TYPE, file.fileName),
  ];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (!result?.error) return true;
    } catch (error) {
      console.warn("[Revenge Backup] Document save attempt failed", error);
    }
  }

  return false;
}

async function shareFile(file: TempBackupFile) {
  const share = (RN as any).Share?.share;
  if (typeof share !== "function") return false;

  await share({
    title: file.fileName,
    url: file.uri,
    message: file.uri,
    type: JSON_MIME_TYPE,
  });
  return true;
}

export function serializeBackup(backup: BackupFile) {
  return JSON.stringify(backup, null, 2);
}

export async function saveBackupFile(backup: BackupFile): Promise<SaveBackupFileResult> {
  const fileName = filenameFor(backup);
  const content = serializeBackup(backup);
  const tempFile = await writeBackupFile("cache", fileName, content) ?? await writeBackupFile("documents", fileName, content);

  if (tempFile) {
    if (await saveWithDocuments(tempFile)) {
      tempFile.remove();
      return { fileName, exported: true, method: "documents" };
    }

    // Keep the temporary file available for the Android share target to read.
    // The OS/cache cleaner can remove it later.
    if (await shareFile(tempFile)) return { fileName, exported: true, method: "share", uri: tempFile.uri };

    tempFile.remove();
  }

  return { fileName, exported: false, method: "internal" };
}
