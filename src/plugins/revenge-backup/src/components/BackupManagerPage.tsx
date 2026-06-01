import { React, NavigationNative, ReactNative as RN } from "@vendetta/metro/common";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { Forms, General } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { vstorage } from "..";
import { deleteBackupPlugin, emptyBackup, isBackupPluginInstalled, restoreAllBackupPlugins, restoreBackupPlugin } from "../lib/backup";
import type { BackupFile, BackupPlugin } from "../lib/types";
import { assetId, rowIcon } from "./ui";

const { ScrollView, View, Pressable, Text } = RN as any;
const { FormRow, FormSection } = Forms;
const EmptyText = (General?.Text ?? Text) as any;

function authorsLabel(entry: BackupPlugin) {
  return entry.authors.length ? `By ${entry.authors.join(", ")}` : "Unknown author";
}

function PluginActionButton({
  label,
  destructive,
  disabled,
  onPress,
}: {
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: disabled ? "#3BA55D" : destructive ? "#DA373C" : "#5865F2",
        marginLeft: 8,
        opacity: disabled ? 0.85 : 1,
      }}
    >
      <Text style={{ color: "white", fontWeight: "600", fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

function PluginBackupRow({
  entry,
  onBackupChange,
  onInstalledPluginsChange,
}: {
  entry: BackupPlugin;
  onBackupChange: (backup: BackupFile) => void;
  onInstalledPluginsChange: () => void;
}) {
  const installed = isBackupPluginInstalled(entry);

  function restore() {
    restoreBackupPlugin(entry)
      .then(() => {
        onInstalledPluginsChange();
        showToast(`Restored ${entry.name}.`, assetId("CircleCheckIcon-primary"));
      })
      .catch(() => showToast(`Could not restore ${entry.name}.`, assetId("CircleXIcon-primary")));
  }

  function remove() {
    if (!vstorage.backup) return;
    const nextBackup = deleteBackupPlugin(vstorage.backup, entry.id);
    vstorage.backup = nextBackup;
    onBackupChange(nextBackup);
    showToast(`Deleted ${entry.name} from backup.`, assetId("TrashIcon"));
  }

  return (
    <FormRow
      label={entry.name}
      subLabel={`${installed ? "Installed" : "Not installed"} • ${authorsLabel(entry)} • ${entry.description}`}
      leading={rowIcon(installed ? "CircleCheckIcon-primary" : "ic_application_command_24px")}
      trailing={
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {installed ? (
            <PluginActionButton label="Installed" disabled />
          ) : (
            <PluginActionButton label="Restore" onPress={restore} />
          )}
          <PluginActionButton label="Delete" destructive onPress={remove} />
        </View>
      }
    />
  );
}

export default function BackupManagerPage() {
  const navigation = NavigationNative?.useNavigation?.();
  const [backup, setBackup] = React.useState<BackupFile | undefined>(vstorage.backup);
  const [installedRefreshKey, setInstalledRefreshKey] = React.useState(0);
  const entries = Object.values(backup?.plugins ?? {}).sort((a, b) => a.name.localeCompare(b.name));

  function refreshBackup(nextBackup: BackupFile) {
    setBackup(nextBackup);
  }

  function refreshInstalledPlugins() {
    setInstalledRefreshKey(value => value + 1);
  }

  function restoreAll() {
    if (!backup || !entries.length) return;

    restoreAllBackupPlugins(backup)
      .then(() => {
        refreshInstalledPlugins();
        showToast(`Restored ${entries.length} plugins.`, assetId("CircleCheckIcon-primary"));
      })
      .catch(() => showToast("Some plugins could not be restored.", assetId("CircleXIcon-primary")));
  }

  function deleteAll() {
    showConfirmationAlert({
      title: "Delete every backed-up plugin?",
      content: "This wipes the backup list stored by Revenge Backup. Your currently installed plugins will not be removed.",
      confirmText: "Delete all",
      cancelText: "Cancel",
      confirmColor: "red",
      onConfirm: () => {
        const nextBackup = emptyBackup();
        vstorage.backup = nextBackup;
        refreshBackup(nextBackup);
        showToast("Backup list wiped.", assetId("TrashIcon"));
      },
    });
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
      <FormSection title="Backup Manager">
        <FormRow label="Restore all plugins" leading={rowIcon("DownloadIcon")} onPress={restoreAll} />
        <FormRow label="Delete all backed-up plugins" leading={rowIcon("TrashIcon")} destructive onPress={deleteAll} />
        <FormRow label="Back" leading={rowIcon("ArrowSmallLeftIcon")} onPress={() => navigation?.goBack?.()} />
      </FormSection>

      <FormSection title={`Backed-up plugins (${entries.length})`}>
        {entries.length ? (
          entries.map(entry => (
            <PluginBackupRow
              key={`${entry.id}-${installedRefreshKey}`}
              entry={entry}
              onBackupChange={refreshBackup}
              onInstalledPluginsChange={refreshInstalledPlugins}
            />
          ))
        ) : (
          <View style={{ padding: 16 }}>
            <EmptyText>No plugins are currently saved in the backup file.</EmptyText>
          </View>
        )}
      </FormSection>
    </ScrollView>
  );
}
