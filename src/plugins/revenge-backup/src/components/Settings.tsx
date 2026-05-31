import { NavigationNative, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { compileAndPersistBackup, ensureStorage, restartAutoCompileTimer, vstorage } from "..";
import { AUTO_COMPILE_INTERVALS, getIntervalLabel } from "../lib/intervals";
import BackupManagerPage from "./BackupManagerPage";

const { ScrollView } = RN;
const { FormRow, FormSection, FormSwitchRow } = Forms;

function formatTimestamp(timestamp?: number) {
  if (!timestamp) return "Never";
  return new Date(timestamp).toLocaleString();
}

export default function Settings() {
  ensureStorage();
  useProxy(vstorage);

  const navigation = NavigationNative.useNavigation();
  const backup = vstorage.backup;
  const settings = vstorage.settings!;

  function setAutoCompile(value: boolean) {
    settings.autoCompile = value;
    restartAutoCompileTimer();
  }

  function setIntervalMs(value: number) {
    settings.autoCompileIntervalMs = value;
    restartAutoCompileTimer();
  }

  function compileNow() {
    compileAndPersistBackup({ saveFile: true }).catch(error => {
      console.error("[Revenge Backup] Manual compile failed", error);
      showToast("Could not compile plugin backup.", getAssetIDByName("CircleXIcon-primary"));
    });
  }

  function openManager() {
    navigation.push("VendettaCustomPage", {
      title: "Manage Plugin Backup",
      render: BackupManagerPage,
    });
  }

  function confirmCompile() {
    showConfirmationAlert({
      title: "Compile plugin backup?",
      content: "This grabs every installed plugin link and its settings, updates the stored backup, and asks Revenge to save a JSON file.",
      confirmText: "Compile",
      cancelText: "Cancel",
      onConfirm: compileNow,
    });
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
      <FormSection title="Backup">
        <FormRow
          label="Compile plugins and settings"
          subLabel="Grab all installed plugin links and their settings, then save them as a JSON file."
          leading={getAssetIDByName("FilePlusIcon")}
          onPress={confirmCompile}
        />
        <FormRow
          label="Manage backed-up plugins"
          subLabel="Restore or delete individual plugins from the backup file."
          leading={getAssetIDByName("ListBulletsIcon")}
          trailing={FormRow.Arrow}
          onPress={openManager}
        />
        <FormRow
          label="Backup status"
          subLabel={`${backup?.pluginCount ?? 0} plugins • Last updated: ${formatTimestamp(backup?.updatedAt)}${vstorage.lastSavedFile ? ` • Last file: ${vstorage.lastSavedFile}` : ""}`}
          leading={getAssetIDByName("InfoIcon")}
        />
      </FormSection>

      <FormSection title="Automatic Compile">
        <FormSwitchRow
          label="Auto compile plugins and settings"
          subLabel="Automatically refresh the backup and save a new JSON file on a schedule."
          leading={getAssetIDByName("ClockIcon")}
          value={settings.autoCompile}
          onValueChange={setAutoCompile}
        />
        <FormRow
          label="Current interval"
          subLabel={getIntervalLabel(settings.autoCompileIntervalMs)}
          leading={getAssetIDByName("TimerIcon")}
        />
        {AUTO_COMPILE_INTERVALS.map(interval => (
          <FormRow
            key={interval.value}
            label={interval.label}
            subLabel={settings.autoCompileIntervalMs === interval.value ? "Selected" : "Tap to select"}
            leading={getAssetIDByName(settings.autoCompileIntervalMs === interval.value ? "CheckIcon" : "CircleIcon")}
            onPress={() => setIntervalMs(interval.value)}
          />
        ))}
      </FormSection>
    </ScrollView>
  );
}
