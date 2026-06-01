import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";

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
    const fileName = await saveBackupFile(backup);
    if (fileName) vstorage.lastSavedFile = fileName;
  }

  showToast(
    `Backed up ${backup.pluginCount} plugin${backup.pluginCount === 1 ? "" : "s"}.`,
    getAssetIDByName("CircleCheckIcon-primary"),
  );

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
      showToast("Revenge Backup auto compile failed.", getAssetIDByName("CircleXIcon-primary"));
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
