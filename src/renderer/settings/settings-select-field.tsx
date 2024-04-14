import { forwardRef } from "react";
import { Box, Select } from "@radix-ui/themes";
import { UseFormReturn } from "react-hook-form";
import { FieldPath } from "react-hook-form/dist/types/path";
import { SettingsField } from "./settings-field";
import { Settings } from "../../types";

export const SettingsSelectField = forwardRef<
  HTMLInputElement,
  {
    label: string;
    description?: string;
    form: UseFormReturn<Settings, any, undefined>;
    field: FieldPath<Settings>;
    values: string[] | Record<string, string>;
  }
>(({ label, description, form, field, values }) => (
  <SettingsField label={label} description={description} textTop="3px">
    <Box position="relative">
      <Select.Root
        value={form.watch(field) as string}
        onValueChange={(value) => {
          form.setValue(field, value);
        }}
      >
        <Select.Trigger
          style={{
            maxWidth: "-webkit-fill-available",
            minWidth: "-webkit-fill-available",
          }}
        />
        <Select.Content position="popper">
          {Array.isArray(values)
            ? values.map((value) => (
                <Select.Item key={value} value={value}>
                  {value}
                </Select.Item>
              ))
            : Object.entries(values).map(([value, label]) => (
                <Select.Item key={value} value={value}>
                  {label}
                </Select.Item>
              ))}
        </Select.Content>
      </Select.Root>
    </Box>
  </SettingsField>
));
