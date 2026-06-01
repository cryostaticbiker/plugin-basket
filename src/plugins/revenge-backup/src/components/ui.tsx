import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms, General } from "@vendetta/ui/components";

const { FormRow } = Forms;

export function assetId(name: string) {
  return typeof getAssetIDByName === "function" ? getAssetIDByName(name) : undefined;
}

export function rowIcon(name: string) {
  const asset = assetId(name);
  const Icon = FormRow?.Icon;

  if (!asset) return undefined;
  return typeof Icon === "function" ? <Icon source={asset} /> : asset;
}

export function arrow() {
  const Arrow = FormRow?.Arrow;
  return typeof Arrow === "function" ? <Arrow /> : Arrow;
}

export const SwitchRow = Forms.FormSwitchRow ?? function SwitchRowFallback(props: any) {
  const { label, subLabel, leading, value, onValueChange } = props;
  const Switch = General?.Switch;

  return (
    <FormRow
      label={label}
      subLabel={subLabel}
      leading={leading}
      trailing={typeof Switch === "function" ? <Switch value={value} onValueChange={onValueChange} /> : undefined}
      onPress={() => onValueChange?.(!value)}
    />
  );
};
