import { ReactNode, createContext, useCallback, useContext } from "react";

export type DialogData<T> = {
  title?: string;
  content?: ReactNode;
  onSubmit?: (value?: T) => void;
  defaultValue?: T;
  placeholder?: string;
  actions?: ReactNode | null;
  cancelLabel?: string;
  okayLabel?: string;
  input?:
    | {
        type: "boolean";
        label: ReactNode | string;
      }
    | {
        type: "text";
        label: ReactNode | string;
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

export const useConfirm = (title: string, description?: string) => {
  const { openDialog } = useDialog();
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

export const usePromptText = (
  title: string,
  label: string,
  placeholder?: string,
) => {
  const { openDialog } = useDialog();
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
