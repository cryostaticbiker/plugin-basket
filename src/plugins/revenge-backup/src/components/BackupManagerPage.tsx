import { NavigationNative, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms, General } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { vstorage } from "..";
import { deleteBackupPlugin, emptyBackup, restoreAllBackupPlugins, restoreBackupPlugin } from "../lib/backup";
import type { BackupPlugin } from "../lib/types";

const { ScrollView, View, Pressable, Text } = RN as any;
const { FormRow, FormSection } = Forms;
const EmptyText = (General?.Text ?? Text) as any;

function authorsLabel(entry: BackupPlugin) {
  return entry.authors.length ? `By ${entry.authors.join(", ")}` : "Unknown author";
}

function PluginActionButton({ label, destructive, onPress }: { label: string; destructive?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: destructive ? "#DA373C" : "#5865F2",
        marginLeft: 8,
      }}
    >
      <Text style={{ color: "white", fontWeight: "600", fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

function PluginBackupRow({ entry }: { entry: BackupPlugin }) {
  function restore() {
    restoreBackupPlugin(entry)
      .then(() => showToast(`Restored ${entry.name}.`, getAssetIDByName("CircleCheckIcon-primary")))
      .catch(() => showToast(`Could not restore ${entry.name}.`, getAssetIDByName("CircleXIcon-primary")));
  }

  function remove() {
    if (!vstorage.backup) return;
    vstorage.backup = deleteBackupPlugin(vstorage.backup, entry.id);
    showToast(`Deleted ${entry.name} from backup.`, getAssetIDByName("TrashIcon"));
  }

  return (
    <FormRow
      label={entry.name}
      subLabel={`${authorsLabel(entry)} • ${entry.description}`}
      leading={getAssetIDByName("ic_application_command_24px")}
      trailing={
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <PluginActionButton label="Restore" onPress={restore} />
          <PluginActionButton label="Delete" destructive onPress={remove} />
        </View>
      }
    />
  );
}

export default function BackupManagerPage() {
  useProxy(vstorage);
  const navigation = NavigationNative.useNavigation();
  const backup = vstorage.backup;
  const entries = Object.values(backup?.plugins ?? {}).sort((a, b) => a.name.localeCompare(b.name));

  function restoreAll() {
    if (!backup || !entries.length) return;

    restoreAllBackupPlugins(backup)
      .then(() => showToast(`Restored ${entries.length} plugins.`, getAssetIDByName("CircleCheckIcon-primary")))
      .catch(() => showToast("Some plugins could not be restored.", getAssetIDByName("CircleXIcon-primary")));
  }

  function deleteAll() {
    showConfirmationAlert({
      title: "Delete every backed-up plugin?",
      content: "This wipes the backup list stored by Revenge Backup. Your currently installed plugins will not be removed.",
      confirmText: "Delete all",
      cancelText: "Cancel",
      confirmColor: "red",
      onConfirm: () => {
        vstorage.backup = emptyBackup();
        showToast("Backup list wiped.", getAssetIDByName("TrashIcon"));
      },
    });
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
      <FormSection title="Backup Manager">
        <FormRow label="Restore all plugins" leading={getAssetIDByName("DownloadIcon")} onPress={restoreAll} />
        <FormRow label="Delete all backed-up plugins" leading={getAssetIDByName("TrashIcon")} destructive onPress={deleteAll} />
        <FormRow label="Back" leading={getAssetIDByName("ArrowSmallLeftIcon")} onPress={() => navigation.goBack()} />
      </FormSection>

      <FormSection title={`Backed-up plugins (${entries.length})`}>
        {entries.length ? (
          entries.map(entry => <PluginBackupRow key={entry.id} entry={entry} />)
        ) : (
          <View style={{ padding: 16 }}>
            <EmptyText>No plugins are currently saved in the backup file.</EmptyText>
          </View>
        )}
      </FormSection>
    </ScrollView>
  );
}
