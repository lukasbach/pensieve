import { createContext, useCallback, useContext, useState } from "react";
import { windowsApi } from "../api";

export type DialogData<T> = {
  title?: string;
  content?: string;
  onSubmit?: (value?: T) => void;
  defaultValue?: T;
  placeholder?: string;
  actions?: string | null;
  cancelLabel?: string;
  okayLabel?: string;
  input?:
    | {
        type: "boolean";
        label: string;
      }
    | {
        type: "text";
        label: string;
      };
};

export const DialogContext = createContext<{
  dialog: DialogData<any> | null;
  setDialog: (dialog: DialogData<any> | null) => void;
}>({ dialog: null, setDialog: () => {} });

export const useDialog = () => {
  const { dialog, setDialog } = useContext(DialogContext);
  return {
    dialog,
    openDialog: useCallback(
      (dialog: DialogData<any>) => setDialog(dialog),
      [setDialog],
    ),
    closeDialog: useCallback(() => setDialog(null), [setDialog]),
  };
};

const useWindowedDialog: typeof useDialog = () => {
  const [id, setId] = useState<string>();
  const [dialog, setDialog] = useState<DialogData<any> | null>(null);
  return {
    openDialog: async (dialog) => {
      const newId = Math.random().toString(36).slice(2);
      setDialog(dialog);
      setId(newId);
      const value = await windowsApi.openDialog(newId, {
        ...dialog,
        onSubmit: undefined,
      });
      console.log("!!", value);
      setDialog(null);
      setId(undefined);
      if (value) {
        dialog.onSubmit?.(value);
      }
    },
    closeDialog: () => {
      if (!id) return;
      windowsApi.closeDialog(id);
      setDialog(null);
      setId(undefined);
    },
    dialog,
  };
};

export const createUseConfirm =
  (create: () => ReturnType<typeof useDialog>) =>
  (title: string, description?: string) => {
    const { openDialog } = create();
    return useCallback(
      () =>
        new Promise<boolean>((onSubmit) => {
          openDialog({
            title,
            content: description,
            onSubmit,
          });
        }),
      [openDialog, title, description],
    );
  };

export const createUsePromptText =
  (create: () => ReturnType<typeof useDialog>) =>
  (title: string, label: string, placeholder?: string) => {
    const { openDialog } = create();
    return useCallback(
      (defaultValue?: string) =>
        new Promise<string | undefined>((onSubmit) => {
          openDialog({
            title,
            placeholder,
            input: { type: "text", label },
            onSubmit,
            defaultValue,
          });
        }),
      [openDialog, title, placeholder, label],
    );
  };

export const useConfirm = createUseConfirm(useDialog);
export const usePromptText = createUsePromptText(useDialog);

export const useWindowedConfirm = createUseConfirm(useWindowedDialog);
export const useWindowedPromptText = createUsePromptText(useWindowedDialog);
