export type BackupPlugin = {
  id: string;
  name: string;
  description: string;
  authors: string[];
  enabled: boolean;
  settings: unknown;
  settingsJson: string;
  backedUpAt: number;
};

export type BackupFile = {
  format: "revenge-plugin-backup";
  version: 1;
  createdAt: number;
  updatedAt: number;
  pluginCount: number;
  plugins: Record<string, BackupPlugin>;
};

export type PluginBackupStorage = {
  settings?: {
    autoCompile: boolean;
    autoCompileIntervalMs: number;
  };
  backup?: BackupFile;
  lastSavedFile?: string;
};
