"use strict";
var revengeBackupPlugin = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/plugins/revenge-backup/src/index.tsx
  var index_exports = {};
  __export(index_exports, {
    Settings: () => Settings2,
    compileAndPersistBackup: () => compileAndPersistBackup,
    ensureStorage: () => ensureStorage,
    onLoad: () => onLoad,
    onUnload: () => onUnload,
    restartAutoCompileTimer: () => restartAutoCompileTimer,
    settings: () => settings,
    vstorage: () => vstorage
  });
  var import_plugin = __require("@vendetta/plugin");
  var import_toasts3 = __require("@vendetta/ui/toasts");
  var import_assets3 = __require("@vendetta/ui/assets");

  // src/plugins/revenge-backup/src/components/Settings.tsx
  var import_common2 = __require("@vendetta/metro/common");
  var import_storage3 = __require("@vendetta/storage");
  var import_alerts2 = __require("@vendetta/ui/alerts");
  var import_assets2 = __require("@vendetta/ui/assets");
  var import_components2 = __require("@vendetta/ui/components");
  var import_toasts2 = __require("@vendetta/ui/toasts");

  // src/plugins/revenge-backup/src/lib/intervals.ts
  var AUTO_COMPILE_INTERVALS = [
    { label: "5 minutes", value: 5 * 60 * 1e3 },
    { label: "10 minutes", value: 10 * 60 * 1e3 },
    { label: "15 minutes", value: 15 * 60 * 1e3 },
    { label: "30 minutes", value: 30 * 60 * 1e3 },
    { label: "1 hour", value: 60 * 60 * 1e3 },
    { label: "2 hours", value: 2 * 60 * 60 * 1e3 },
    { label: "5 hours", value: 5 * 60 * 60 * 1e3 },
    { label: "10 hours", value: 10 * 60 * 60 * 1e3 },
    { label: "24 hours", value: 24 * 60 * 60 * 1e3 }
  ];
  var DEFAULT_AUTO_COMPILE_INTERVAL_MS = AUTO_COMPILE_INTERVALS[2].value;
  function getIntervalLabel(value) {
    return AUTO_COMPILE_INTERVALS.find((interval) => interval.value === value)?.label ?? "15 minutes";
  }

  // src/plugins/revenge-backup/src/components/BackupManagerPage.tsx
  var import_common = __require("@vendetta/metro/common");
  var import_storage2 = __require("@vendetta/storage");
  var import_alerts = __require("@vendetta/ui/alerts");
  var import_assets = __require("@vendetta/ui/assets");
  var import_components = __require("@vendetta/ui/components");
  var import_toasts = __require("@vendetta/ui/toasts");

  // src/plugins/revenge-backup/src/lib/backup.ts
  var import_plugins = __require("@vendetta/plugins");
  var import_storage = __require("@vendetta/storage");
  function stripVolatileSettings(value) {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(stripVolatileSettings);
    const output = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === "__no_sync" || key === "__no_cloud_sync") continue;
      output[key] = stripVolatileSettings(child);
    }
    return output;
  }
  function normalizeAuthors(manifest) {
    const authors = manifest?.authors;
    if (!Array.isArray(authors)) return [];
    return authors.map((author) => {
      if (typeof author === "string") return author;
      return author?.name ?? author?.username ?? author?.id;
    }).filter(Boolean);
  }
  function readPluginName(plugin, id) {
    return plugin?.manifest?.name ?? plugin?.name ?? id;
  }
  function readPluginDescription(plugin) {
    return plugin?.manifest?.description ?? plugin?.description ?? "No description provided.";
  }
  async function readPluginSettings(id) {
    try {
      return stripVolatileSettings(await (0, import_storage.createMMKVBackend)(id).get());
    } catch {
      return void 0;
    }
  }
  async function compileInstalledPlugins() {
    const now = Date.now();
    const backedUpPlugins = {};
    for (const plugin of Object.values(import_plugins.plugins)) {
      const id = plugin?.id;
      if (!id || typeof id !== "string") continue;
      const settings2 = await readPluginSettings(id);
      backedUpPlugins[id] = {
        id,
        name: readPluginName(plugin, id),
        description: readPluginDescription(plugin),
        authors: normalizeAuthors(plugin?.manifest),
        enabled: Boolean(plugin?.enabled),
        settings: settings2,
        settingsJson: JSON.stringify(settings2 ?? null),
        backedUpAt: now
      };
    }
    return {
      format: "revenge-plugin-backup",
      version: 1,
      createdAt: now,
      updatedAt: now,
      pluginCount: Object.keys(backedUpPlugins).length,
      plugins: backedUpPlugins
    };
  }
  async function writePluginSettings(entry) {
    if (!entry.settingsJson) return;
    try {
      await (0, import_storage.createMMKVBackend)(entry.id).set(JSON.parse(entry.settingsJson));
      return;
    } catch {
    }
    const rnCacheModule = globalThis.RNCacheModule ?? globalThis.nativeModuleProxy?.RNCacheModule;
    if (rnCacheModule?.setItem) rnCacheModule.setItem(entry.id, entry.settingsJson);
  }
  async function restoreBackupPlugin(entry) {
    await writePluginSettings(entry);
    if (import_plugins.plugins[entry.id]) {
      import_plugins.plugins[entry.id].enabled = entry.enabled;
      return;
    }
    await (0, import_plugins.installPlugin)(entry.id, entry.enabled);
  }
  async function restoreAllBackupPlugins(backup) {
    for (const entry of Object.values(backup.plugins)) {
      await restoreBackupPlugin(entry);
    }
  }
  function deleteBackupPlugin(backup, id) {
    const plugins2 = { ...backup.plugins };
    delete plugins2[id];
    return {
      ...backup,
      updatedAt: Date.now(),
      pluginCount: Object.keys(plugins2).length,
      plugins: plugins2
    };
  }
  function emptyBackup() {
    const now = Date.now();
    return {
      format: "revenge-plugin-backup",
      version: 1,
      createdAt: now,
      updatedAt: now,
      pluginCount: 0,
      plugins: {}
    };
  }

  // src/plugins/revenge-backup/src/components/BackupManagerPage.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  var { ScrollView, View, Pressable, Text } = import_common.ReactNative;
  var { FormRow, FormSection } = import_components.Forms;
  var EmptyText = import_components.General?.Text ?? Text;
  function authorsLabel(entry) {
    return entry.authors.length ? `By ${entry.authors.join(", ")}` : "Unknown author";
  }
  function PluginActionButton({ label, destructive, onPress }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      Pressable,
      {
        accessibilityRole: "button",
        onPress,
        style: {
          borderRadius: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
          backgroundColor: destructive ? "#DA373C" : "#5865F2",
          marginLeft: 8
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, { style: { color: "white", fontWeight: "600", fontSize: 12 }, children: label })
      }
    );
  }
  function PluginBackupRow({ entry }) {
    function restore() {
      restoreBackupPlugin(entry).then(() => (0, import_toasts.showToast)(`Restored ${entry.name}.`, (0, import_assets.getAssetIDByName)("CircleCheckIcon-primary"))).catch(() => (0, import_toasts.showToast)(`Could not restore ${entry.name}.`, (0, import_assets.getAssetIDByName)("CircleXIcon-primary")));
    }
    function remove() {
      if (!vstorage.backup) return;
      vstorage.backup = deleteBackupPlugin(vstorage.backup, entry.id);
      (0, import_toasts.showToast)(`Deleted ${entry.name} from backup.`, (0, import_assets.getAssetIDByName)("TrashIcon"));
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      FormRow,
      {
        label: entry.name,
        subLabel: `${authorsLabel(entry)} \u2022 ${entry.description}`,
        leading: (0, import_assets.getAssetIDByName)("ic_application_command_24px"),
        trailing: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(View, { style: { flexDirection: "row", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PluginActionButton, { label: "Restore", onPress: restore }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PluginActionButton, { label: "Delete", destructive: true, onPress: remove })
        ] })
      }
    );
  }
  function BackupManagerPage() {
    (0, import_storage2.useProxy)(vstorage);
    const navigation = import_common.NavigationNative.useNavigation();
    const backup = vstorage.backup;
    const entries = Object.values(backup?.plugins ?? {}).sort((a, b) => a.name.localeCompare(b.name));
    function restoreAll() {
      if (!backup || !entries.length) return;
      restoreAllBackupPlugins(backup).then(() => (0, import_toasts.showToast)(`Restored ${entries.length} plugins.`, (0, import_assets.getAssetIDByName)("CircleCheckIcon-primary"))).catch(() => (0, import_toasts.showToast)("Some plugins could not be restored.", (0, import_assets.getAssetIDByName)("CircleXIcon-primary")));
    }
    function deleteAll() {
      (0, import_alerts.showConfirmationAlert)({
        title: "Delete every backed-up plugin?",
        content: "This wipes the backup list stored by Revenge Backup. Your currently installed plugins will not be removed.",
        confirmText: "Delete all",
        cancelText: "Cancel",
        confirmColor: "red",
        onConfirm: () => {
          vstorage.backup = emptyBackup();
          (0, import_toasts.showToast)("Backup list wiped.", (0, import_assets.getAssetIDByName)("TrashIcon"));
        }
      });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormSection, { title: "Backup Manager", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormRow, { label: "Restore all plugins", leading: (0, import_assets.getAssetIDByName)("DownloadIcon"), onPress: restoreAll }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormRow, { label: "Delete all backed-up plugins", leading: (0, import_assets.getAssetIDByName)("TrashIcon"), destructive: true, onPress: deleteAll }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormRow, { label: "Back", leading: (0, import_assets.getAssetIDByName)("ArrowSmallLeftIcon"), onPress: () => navigation.goBack() })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormSection, { title: `Backed-up plugins (${entries.length})`, children: entries.length ? entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PluginBackupRow, { entry }, entry.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(View, { style: { padding: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyText, { children: "No plugins are currently saved in the backup file." }) }) })
    ] });
  }

  // src/plugins/revenge-backup/src/components/Settings.tsx
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  var { ScrollView: ScrollView2 } = import_common2.ReactNative;
  var { FormRow: FormRow2, FormSection: FormSection2, FormSwitchRow } = import_components2.Forms;
  function formatTimestamp(timestamp) {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  }
  function Settings() {
    ensureStorage();
    (0, import_storage3.useProxy)(vstorage);
    const navigation = import_common2.NavigationNative.useNavigation();
    const backup = vstorage.backup;
    const settings2 = vstorage.settings;
    function setAutoCompile(value) {
      settings2.autoCompile = value;
      restartAutoCompileTimer();
    }
    function setIntervalMs(value) {
      settings2.autoCompileIntervalMs = value;
      restartAutoCompileTimer();
    }
    function compileNow() {
      compileAndPersistBackup({ saveFile: true }).catch((error) => {
        console.error("[Revenge Backup] Manual compile failed", error);
        (0, import_toasts2.showToast)("Could not compile plugin backup.", (0, import_assets2.getAssetIDByName)("CircleXIcon-primary"));
      });
    }
    function openManager() {
      navigation.push("VendettaCustomPage", {
        title: "Manage Plugin Backup",
        render: BackupManagerPage
      });
    }
    function confirmCompile() {
      (0, import_alerts2.showConfirmationAlert)({
        title: "Compile plugin backup?",
        content: "This grabs every installed plugin link and its settings, updates the stored backup, and asks Revenge to save a JSON file.",
        confirmText: "Compile",
        cancelText: "Cancel",
        onConfirm: compileNow
      });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(ScrollView2, { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(FormSection2, { title: "Backup", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          FormRow2,
          {
            label: "Compile plugins and settings",
            subLabel: "Grab all installed plugin links and their settings, then save them as a JSON file.",
            leading: (0, import_assets2.getAssetIDByName)("FilePlusIcon"),
            onPress: confirmCompile
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          FormRow2,
          {
            label: "Manage backed-up plugins",
            subLabel: "Restore or delete individual plugins from the backup file.",
            leading: (0, import_assets2.getAssetIDByName)("ListBulletsIcon"),
            trailing: FormRow2.Arrow,
            onPress: openManager
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          FormRow2,
          {
            label: "Backup status",
            subLabel: `${backup?.pluginCount ?? 0} plugins \u2022 Last updated: ${formatTimestamp(backup?.updatedAt)}${vstorage.lastSavedFile ? ` \u2022 Last file: ${vstorage.lastSavedFile}` : ""}`,
            leading: (0, import_assets2.getAssetIDByName)("InfoIcon")
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(FormSection2, { title: "Automatic Compile", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          FormSwitchRow,
          {
            label: "Auto compile plugins and settings",
            subLabel: "Automatically refresh the backup and save a new JSON file on a schedule.",
            leading: (0, import_assets2.getAssetIDByName)("ClockIcon"),
            value: settings2.autoCompile,
            onValueChange: setAutoCompile
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          FormRow2,
          {
            label: "Current interval",
            subLabel: getIntervalLabel(settings2.autoCompileIntervalMs),
            leading: (0, import_assets2.getAssetIDByName)("TimerIcon")
          }
        ),
        AUTO_COMPILE_INTERVALS.map((interval) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          FormRow2,
          {
            label: interval.label,
            subLabel: settings2.autoCompileIntervalMs === interval.value ? "Selected" : "Tap to select",
            leading: (0, import_assets2.getAssetIDByName)(settings2.autoCompileIntervalMs === interval.value ? "CheckIcon" : "CircleIcon"),
            onPress: () => setIntervalMs(interval.value)
          },
          interval.value
        ))
      ] })
    ] });
  }

  // src/plugins/revenge-backup/src/lib/files.ts
  var import_common3 = __require("@vendetta/metro/common");
  var FILE_PREFIX = "revenge-plugin-backup";
  function filenameFor(backup) {
    return `${FILE_PREFIX}-${new Date(backup.updatedAt).toISOString().replace(/[:.]/g, "-")}.json`;
  }
  function getNativeModules() {
    return import_common3.ReactNative.NativeModules ?? {};
  }
  function serializeBackup(backup) {
    return JSON.stringify(backup, null, 2);
  }
  async function saveBackupFile(backup) {
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
          fileName
        });
      } finally {
        RNFileModule.removeFile?.("cache", tempName);
      }
      return fileName;
    }
    if (import_common3.ReactNative.Share?.share) {
      await import_common3.ReactNative.Share.share({ message: content, title: fileName });
      return fileName;
    }
    return void 0;
  }

  // src/plugins/revenge-backup/src/index.tsx
  var vstorage = import_plugin.storage;
  var autoCompileTimer;
  function ensureStorage() {
    vstorage.settings ??= {
      autoCompile: false,
      autoCompileIntervalMs: DEFAULT_AUTO_COMPILE_INTERVAL_MS
    };
    vstorage.settings.autoCompile ??= false;
    vstorage.settings.autoCompileIntervalMs ??= DEFAULT_AUTO_COMPILE_INTERVAL_MS;
  }
  async function compileAndPersistBackup(options = {}) {
    ensureStorage();
    const previousCreatedAt = vstorage.backup?.createdAt;
    const backup = await compileInstalledPlugins();
    backup.createdAt = previousCreatedAt ?? backup.createdAt;
    vstorage.backup = backup;
    if (options.saveFile) {
      const fileName = await saveBackupFile(backup);
      if (fileName) vstorage.lastSavedFile = fileName;
    }
    (0, import_toasts3.showToast)(
      `Backed up ${backup.pluginCount} plugin${backup.pluginCount === 1 ? "" : "s"}.`,
      (0, import_assets3.getAssetIDByName)("CircleCheckIcon-primary")
    );
    return backup;
  }
  function restartAutoCompileTimer() {
    ensureStorage();
    if (autoCompileTimer) clearInterval(autoCompileTimer);
    autoCompileTimer = void 0;
    if (!vstorage.settings?.autoCompile) return;
    autoCompileTimer = setInterval(() => {
      compileAndPersistBackup({ saveFile: true }).catch((error) => {
        console.error("[Revenge Backup] Auto compile failed", error);
        (0, import_toasts3.showToast)("Revenge Backup auto compile failed.", (0, import_assets3.getAssetIDByName)("CircleXIcon-primary"));
      });
    }, vstorage.settings.autoCompileIntervalMs);
  }
  function onLoad() {
    ensureStorage();
    restartAutoCompileTimer();
  }
  function onUnload() {
    if (autoCompileTimer) clearInterval(autoCompileTimer);
    autoCompileTimer = void 0;
  }
  var settings = Settings;
  var Settings2 = Settings;
  return __toCommonJS(index_exports);
})();
