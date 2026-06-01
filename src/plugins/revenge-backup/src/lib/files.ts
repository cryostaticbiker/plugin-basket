import { ReactNative as RN } from "@vendetta/metro/common";

import type { BackupFile } from "./types";

const FILE_PREFIX = "revenge-plugin-backup";

function filenameFor(backup: BackupFile) {
  return `${FILE_PREFIX}-${new Date(backup.updatedAt).toISOString().replace(/[:.]/g, "-")}.json`;
}

function getNativeModules() {
  return (RN as any).NativeModules ?? {};
}

export function serializeBackup(backup: BackupFile) {
  return JSON.stringify(backup, null, 2);
}

export async function saveBackupFile(backup: BackupFile): Promise<string | undefined> {
  const fileName = filenameFor(backup);
  const content = serializeBackup(backup);
  const { RNFileModule, DocumentsNew } = getNativeModules();

  if (RNFileModule?.writeFile && DocumentsNew?.saveDocuments) {
    const tempName = `tmp-${fileName}`;
    const path = await RNFileModule.writeFile("cache", tempName, content, "utf8");

    try {
      await DocumentsNew.saveDocuments({
        sourceUris: [`file:///${path}`],
        mimeType: "application/json",
        fileName,
      });
    } finally {
      RNFileModule.removeFile?.("cache", tempName);
    }

    return fileName;
  }

  if ((RN as any).Share?.share) {
    await (RN as any).Share.share({ message: content, title: fileName });
    return fileName;
  }

  return undefined;
}
