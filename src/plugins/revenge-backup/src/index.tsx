import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { assetId } from "./components/ui";

import SettingsComponent from "./components/Settings";
import { compileInstalledPlugins } from "./lib/backup";
import { saveBackupFile } from "./lib/files";
import { DEFAULT_AUTO_COMPILE_INTERVAL_MS } from "./lib/intervals";
import type { PluginBackupStorage } from "./lib/types";

export const vstorage = storage as PluginBackupStorage;

let autoCompileTimer: ReturnType<typeof setInterval> | undefined;

export function ensureStorage() {
  vstorage.settings ??= {
    autoCompile: false,
    autoCompileIntervalMs: DEFAULT_AUTO_COMPILE_INTERVAL_MS,
  };
  vstorage.settings.autoCompile ??= false;
  vstorage.settings.autoCompileIntervalMs ??= DEFAULT_AUTO_COMPILE_INTERVAL_MS;
}

export async function compileAndPersistBackup(options: { saveFile?: boolean } = {}) {
  ensureStorage();

  const previousCreatedAt = vstorage.backup?.createdAt;
  const backup = await compileInstalledPlugins();
  backup.createdAt = previousCreatedAt ?? backup.createdAt;
  vstorage.backup = backup;

  if (options.saveFile) {
    try {
      const result = await saveBackupFile(backup);
      vstorage.lastSavedFile = result.fileName;

      showToast(
        result.exported
          ? `Backed up ${backup.pluginCount} plugin${backup.pluginCount === 1 ? "" : "s"} and opened the file saver.`
          : `Backed up ${backup.pluginCount} plugin${backup.pluginCount === 1 ? "" : "s"} internally; file export is unavailable on this build.`,
        assetId(result.exported ? "CircleCheckIcon-primary" : "WarningIcon"),
      );
    } catch (error) {
      console.error("[Revenge Backup] File export failed", error);
      showToast(
        `Backed up ${backup.pluginCount} plugin${backup.pluginCount === 1 ? "" : "s"} in plugin storage; file download is unavailable on this build.`,
        assetId("WarningIcon"),
      );
    }
  } else {
    showToast(
      `Backed up ${backup.pluginCount} plugin${backup.pluginCount === 1 ? "" : "s"}.`,
      assetId("CircleCheckIcon-primary"),
    );
  }

  return backup;
}

export function restartAutoCompileTimer() {
  ensureStorage();
  if (autoCompileTimer) clearInterval(autoCompileTimer);
  autoCompileTimer = undefined;

  if (!vstorage.settings?.autoCompile) return;

  autoCompileTimer = setInterval(() => {
    compileAndPersistBackup({ saveFile: true }).catch(error => {
      console.error("[Revenge Backup] Auto compile failed", error);
      showToast("Revenge Backup auto compile failed.", assetId("CircleXIcon-primary"));
    });
  }, vstorage.settings.autoCompileIntervalMs);
}

export function onLoad() {
  ensureStorage();
  restartAutoCompileTimer();
}

export function onUnload() {
  if (autoCompileTimer) clearInterval(autoCompileTimer);
  autoCompileTimer = undefined;
}

export const settings = SettingsComponent;
export const Settings = SettingsComponent;
