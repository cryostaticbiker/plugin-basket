import { plugins, installPlugin } from "@vendetta/plugins";
import { createMMKVBackend } from "@vendetta/storage";

import type { BackupFile, BackupPlugin } from "./types";

function stripVolatileSettings(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stripVolatileSettings);

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "__no_sync" || key === "__no_cloud_sync") continue;
    output[key] = stripVolatileSettings(child);
  }
  return output;
}

function normalizeAuthors(manifest: Record<string, any> | undefined): string[] {
  const authors = manifest?.authors;
  if (!Array.isArray(authors)) return [];

  return authors
    .map(author => {
      if (typeof author === "string") return author;
      return author?.name ?? author?.username ?? author?.id;
    })
    .filter(Boolean);
}

function readPluginName(plugin: any, id: string) {
  return plugin?.manifest?.name ?? plugin?.name ?? id;
}

function readPluginDescription(plugin: any) {
  return plugin?.manifest?.description ?? plugin?.description ?? "No description provided.";
}

async function readPluginSettings(id: string) {
  try {
    // Add timeout to prevent indefinite hangs from MMKV backend
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("MMKV backend timeout")), 5000)
    );
    return stripVolatileSettings(await Promise.race([createMMKVBackend(id).get(), timeoutPromise]));
  } catch {
    return undefined;
  }
}

export async function compileInstalledPlugins(): Promise<BackupFile> {
  const now = Date.now();
  const backedUpPlugins: Record<string, BackupPlugin> = {};

  for (const plugin of Object.values(plugins)) {
    const id = plugin?.id;
    if (!id || typeof id !== "string") continue;

    const settings = await readPluginSettings(id);
    backedUpPlugins[id] = {
      id,
      name: readPluginName(plugin, id),
      description: readPluginDescription(plugin),
      authors: normalizeAuthors(plugin?.manifest),
      enabled: Boolean(plugin?.enabled),
      settings,
      settingsJson: JSON.stringify(settings ?? null),
      backedUpAt: now,
    };
  }

  return {
    format: "revenge-plugin-backup",
    version: 1,
    createdAt: now,
    updatedAt: now,
    pluginCount: Object.keys(backedUpPlugins).length,
    plugins: backedUpPlugins,
  };
}

async function writePluginSettings(entry: BackupPlugin) {
  if (!entry.settingsJson) return;

  try {
    await createMMKVBackend(entry.id).set(JSON.parse(entry.settingsJson));
    return;
  } catch {
    // Older Vendetta/Revenge builds expose only the raw native cache writer.
  }

  const rnCacheModule = (globalThis as any).RNCacheModule ?? (globalThis as any).nativeModuleProxy?.RNCacheModule;
  if (rnCacheModule?.setItem) rnCacheModule.setItem(entry.id, entry.settingsJson);
}

export function isBackupPluginInstalled(entryOrId: BackupPlugin | string) {
  const id = typeof entryOrId === "string" ? entryOrId : entryOrId.id;
  return Boolean(plugins[id]);
}

export async function restoreBackupPlugin(entry: BackupPlugin) {
  await writePluginSettings(entry);

  if (plugins[entry.id]) {
    plugins[entry.id].enabled = entry.enabled;
    return;
  }

  await installPlugin(entry.id, entry.enabled);
}

export async function restoreAllBackupPlugins(backup: BackupFile) {
  for (const entry of Object.values(backup.plugins)) {
    await restoreBackupPlugin(entry);
  }
}

export function deleteBackupPlugin(backup: BackupFile, id: string): BackupFile {
  const plugins = { ...backup.plugins };
  delete plugins[id];

  return {
    ...backup,
    updatedAt: Date.now(),
    pluginCount: Object.keys(plugins).length,
    plugins,
  };
}

export function emptyBackup(): BackupFile {
  const now = Date.now();
  return {
    format: "revenge-plugin-backup",
    version: 1,
    createdAt: now,
    updatedAt: now,
    pluginCount: 0,
    plugins: {},
  };
}
