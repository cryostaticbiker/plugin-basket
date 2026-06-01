import { ReactNative as RN } from "@vendetta/metro/common";

import type { BackupFile } from "./types";

const FILE_PREFIX = "revenge-plugin-backup";

function filenameFor(backup: BackupFile) {
  return `${FILE_PREFIX}-${new Date(backup.updatedAt).toISOString().replace(/[:.]/g, "-")}.json`;
}

function getNativeModules() {
  return {
    ...((globalThis as any).nativeModuleProxy ?? {}),
    ...((RN as any).NativeModules ?? {}),
  };
}

function normalizeFileUri(path: string) {
  if (path.startsWith("file://")) return path;
  return `file://${path.startsWith("/") ? "" : "/"}${path}`;
}

async function writeTempBackupFile(fileName: string, content: string) {
  const { RNFileModule } = getNativeModules();
  if (!RNFileModule?.writeFile) return undefined;

  const tempName = `tmp-${fileName}`;
  const path = await RNFileModule.writeFile("cache", tempName, content, "utf8");

  return {
    tempName,
    path: String(path),
    uri: normalizeFileUri(String(path)),
    remove: () => RNFileModule.removeFile?.("cache", tempName),
  };
}

async function saveWithDocuments(uri: string, fileName: string) {
  const { DocumentsNew } = getNativeModules();
  if (!DocumentsNew?.saveDocuments) return false;

  const attempts = [
    () => DocumentsNew.saveDocuments({
      sourceUris: [uri],
      mimeType: "application/json",
      fileName,
    }),
    () => DocumentsNew.saveDocuments([uri], "application/json", fileName),
    () => DocumentsNew.saveDocuments(uri, "application/json", fileName),
  ];

  for (const attempt of attempts) {
    try {
      await attempt();
      return true;
    } catch {
      // Revenge/Discord native module signatures vary between versions.
    }
  }

  return false;
}

async function shareFile(uri: string, fileName: string) {
  const share = (RN as any).Share?.share;
  if (typeof share !== "function") return false;

  await share({
    title: fileName,
    url: uri,
    type: "application/json",
  });
  return true;
}

export function serializeBackup(backup: BackupFile) {
  return JSON.stringify(backup, null, 2);
}

export async function saveBackupFile(backup: BackupFile): Promise<string | undefined> {
  const fileName = filenameFor(backup);
  const content = serializeBackup(backup);
  const tempFile = await writeTempBackupFile(fileName, content);

  if (tempFile) {
    if (await saveWithDocuments(tempFile.uri, fileName)) {
      tempFile.remove();
      return fileName;
    }

    // Keep the temporary file available for the Android share target to read.
    // The OS/cache cleaner can remove it later.
    if (await shareFile(tempFile.uri, fileName)) return fileName;

    tempFile.remove();
  }

  throw new Error("No supported file save/share API is available in this Revenge build.");
}
