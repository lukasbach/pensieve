/* eslint-disable jsx-a11y/label-has-associated-control */
import { FC, PropsWithChildren, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  Flex,
  Text,
  TextField,
} from "@radix-ui/themes";
import { DialogContext, DialogData } from "./context";

export const DialogProvider: FC<PropsWithChildren> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogData<any> | null>(null);
  const [value, setValue] = useState<any>(null);
  return (
    <DialogContext.Provider
      value={useMemo(
        () => ({
          dialog,
          setDialog: (data: DialogData<any> | null) => {
            setDialog(data);
            setValue(data?.defaultValue ?? null);
          },
        }),
        [dialog],
      )}
    >
      {children}
      <Dialog.Root
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
      >
        <Dialog.Content>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dialog?.onSubmit?.(value);
              setDialog(null);
            }}
          >
            {dialog?.title && <Dialog.Title>{dialog.title}</Dialog.Title>}
            {dialog?.content && (
              <Dialog.Description>{dialog.content}</Dialog.Description>
            )}

            {dialog?.input?.type === "text" && (
              <Flex direction="column" gap="3">
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    {dialog.input.label}
                  </Text>
                  <TextField.Root
                    defaultValue={dialog.defaultValue}
                    placeholder={dialog.placeholder}
                    onChange={(e) => setValue(e.currentTarget.value)}
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
                  Agree to Terms and Conditions
                </Flex>
              </Text>
            )}

            {dialog?.actions === null
              ? null
              : dialog?.actions ?? (
                  <Flex gap=".5rem" justify="start" direction="row-reverse">
                    <Button type="submit">{dialog?.okayLabel ?? "Okay"}</Button>
                    <Dialog.Close>
                      <Button type="reset" color="gray" variant="soft">
                        {dialog?.cancelLabel ?? "Cancel"}
                      </Button>
                    </Dialog.Close>
                  </Flex>
                )}
          </form>
        </Dialog.Content>
      </Dialog.Root>
    </DialogContext.Provider>
  );
};
