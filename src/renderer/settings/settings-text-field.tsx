import { forwardRef } from "react";
import type { RootProps } from "@radix-ui/themes/src/components/text-field";
import { TextField } from "@radix-ui/themes";
import { SettingsField } from "./settings-field";

export const SettingsTextField = forwardRef<
  HTMLInputElement,
  { label: string; description?: string } & RootProps
>(({ label, description, ...props }, ref) => (
  <SettingsField label={label} description={description} textTop="3px">
    <TextField.Root ref={ref} {...props} />
  </SettingsField>
));
