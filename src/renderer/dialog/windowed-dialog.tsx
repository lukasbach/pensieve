import { FC, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { Box, Button, Checkbox, Flex, Text, TextField } from "@radix-ui/themes";
import { windowsApi } from "../api";
import { PageContainer } from "../common/page-container";

export const WindowedDialog: FC = () => {
  const { dialogId } = useSearch({ from: "/dialog" as const });
  const { data: dialog } = useQuery({
    queryKey: [],
    queryFn: async () => windowsApi.getDialogData(dialogId ?? ""),
  });
  const [value, setValue] = useState<any>(null);

  useEffect(() => {
    setValue(dialog?.defaultValue ?? null);
  }, [dialog?.defaultValue]);

  if (!dialogId || !dialog) return null;

  return (
    <PageContainer title={dialog.title}>
      <form
        style={{ height: "100%" }}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          windowsApi.submitDialogData(dialogId, value ?? true);
        }}
      >
        <Flex height="100%" direction="column" px="4" py="4">
          {dialog?.content && <Box flexGrow="1">{dialog.content}</Box>}

          {dialog?.input?.type === "text" && (
            <Flex direction="column" gap="3" mb=".5rem">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  {dialog.input.label}
                </Text>
                <TextField.Root
                  value={value}
                  placeholder={dialog.placeholder}
                  onChange={(e) => setValue(e.currentTarget.value)}
                  autoFocus
                />
              </label>
            </Flex>
          )}

          {dialog?.input?.type === "boolean" && (
            <Text as="label" size="2">
              <Flex gap="2">
                <Checkbox
                  defaultChecked={dialog.defaultValue === true}
                  onCheckedChange={setValue}
                />
                {dialog.input.label}
              </Flex>
            </Text>
          )}

          {dialog?.actions === null
            ? null
            : dialog?.actions ?? (
                <Flex gap=".5rem" justify="start" direction="row-reverse">
                  <Button type="submit" autoFocus={!dialog?.input}>
                    {dialog?.okayLabel ?? "Okay"}
                  </Button>
                  <Button
                    type="reset"
                    color="gray"
                    variant="soft"
                    onClick={() => {
                      windowsApi.closeDialog(dialogId);
                    }}
                  >
                    {dialog?.cancelLabel ?? "Cancel"}
                  </Button>
                </Flex>
              )}
        </Flex>
      </form>
    </PageContainer>
  );
};
