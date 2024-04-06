import { forwardRef } from "react";
import { Box, Switch } from "@radix-ui/themes";
import type { SwitchProps } from "@radix-ui/themes/src/components/switch";
import { UseFormReturn } from "react-hook-form";
import { FieldPath } from "react-hook-form/dist/types/path";
import { SettingsField } from "./settings-field";
import { Settings } from "../../types";

export const SettingsSwitchField = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    description?: string;
    form: UseFormReturn<Settings, any, undefined>;
    field: FieldPath<Settings>;
  } & Omit<SwitchProps, "form">
>(({ label, description, form, field, ...props }, ref) => (
  <SettingsField label={label} description={description}>
    <Box position="relative">
      <Switch
        ref={ref}
        {...props}
        checked={form.watch(field) as boolean}
        onCheckedChange={(checked) => {
          form.setValue(field, checked);
          props.onCheckedChange?.(checked);
        }}
      />
    </Box>
  </SettingsField>
));
