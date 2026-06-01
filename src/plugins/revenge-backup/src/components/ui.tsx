import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms, General } from "@vendetta/ui/components";

const { FormRow } = Forms;

export function rowIcon(name: string) {
  return <FormRow.Icon source={getAssetIDByName(name)} />;
}

export function arrow() {
  return typeof FormRow.Arrow === "function" ? <FormRow.Arrow /> : FormRow.Arrow;
}

export const SwitchRow = Forms.FormSwitchRow ?? function SwitchRowFallback(props: any) {
  const { label, subLabel, leading, value, onValueChange } = props;
  const Switch = General?.Switch;

  return (
    <FormRow
      label={label}
      subLabel={subLabel}
      leading={leading}
      trailing={Switch ? <Switch value={value} onValueChange={onValueChange} /> : undefined}
      onPress={() => onValueChange?.(!value)}
    />
  );
};
