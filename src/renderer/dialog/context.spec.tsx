import { act, renderHook } from "@testing-library/react";
import { FC, PropsWithChildren, useMemo, useState } from "react";
import {
  DialogContext,
  useConfirm,
  useDialog,
  usePromptText,
  useWindowedConfirm,
  useWindowedPromptText,
} from "./context";

const { closeDialogMock, openDialogMock } = vi.hoisted(() => ({
  closeDialogMock: vi.fn(),
  openDialogMock: vi.fn(),
}));

vi.mock("../api", () => ({
  windowsApi: {
    closeDialog: closeDialogMock,
    openDialog: openDialogMock,
  },
}));

const DialogProvider: FC<PropsWithChildren> = ({ children }) => {
  const [dialog, setDialog] = useState<any>(null);

  return (
    <DialogContext.Provider
      value={useMemo(() => ({ dialog, setDialog }), [dialog])}
    >
      {children}
    </DialogContext.Provider>
  );
};

describe("dialog context", () => {
  beforeEach(() => {
    closeDialogMock.mockReset();
    openDialogMock.mockReset();
  });

  it("opens and closes dialogs through context", () => {
    const { result } = renderHook(() => useDialog(), {
      wrapper: DialogProvider,
    });

    act(() => {
      result.current.openDialog({ title: "Rename recording" });
    });

    expect(result.current.dialog).toEqual({ title: "Rename recording" });

    act(() => {
      result.current.closeDialog();
    });

    expect(result.current.dialog).toBeNull();
  });

  it("builds confirm dialogs that resolve from submitted values", async () => {
    const { result } = renderHook(
      () => ({
        confirm: useConfirm("Delete recording", "Are you sure?"),
        dialog: useDialog().dialog,
      }),
      { wrapper: DialogProvider },
    );

    let promise: Promise<boolean> | undefined;
    act(() => {
      promise = result.current.confirm();
    });

    expect(result.current.dialog).toEqual(
      expect.objectContaining({
        title: "Delete recording",
        content: "Are you sure?",
        onSubmit: expect.any(Function),
      }),
    );

    act(() => {
      result.current.dialog?.onSubmit?.(true);
    });

    await expect(promise).resolves.toBe(true);
  });

  it("builds prompt dialogs with labels and default values", async () => {
    const { result } = renderHook(
      () => ({
        prompt: usePromptText("Rename recording", "Title", "Untitled"),
        dialog: useDialog().dialog,
      }),
      { wrapper: DialogProvider },
    );

    let promise: Promise<string | undefined> | undefined;
    act(() => {
      promise = result.current.prompt("Weekly sync");
    });

    expect(result.current.dialog).toEqual(
      expect.objectContaining({
        title: "Rename recording",
        placeholder: "Untitled",
        input: { type: "text", label: "Title" },
        defaultValue: "Weekly sync",
      }),
    );

    act(() => {
      result.current.dialog?.onSubmit?.("Updated title");
    });

    await expect(promise).resolves.toBe("Updated title");
  });

  it("uses the windowed confirm flow through windowsApi", async () => {
    openDialogMock.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useWindowedConfirm("Delete recording", "Are you sure?"),
    );

    let confirmPromise: Promise<boolean> | undefined;
    await act(async () => {
      confirmPromise = result.current();
      await confirmPromise;
    });

    await expect(confirmPromise).resolves.toBe(true);
    expect(openDialogMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        title: "Delete recording",
        content: "Are you sure?",
        onSubmit: undefined,
      }),
    );
  });

  it("uses the windowed prompt flow through windowsApi", async () => {
    openDialogMock.mockResolvedValue("Renamed recording");

    const { result } = renderHook(() =>
      useWindowedPromptText("Rename recording", "Title", "Untitled"),
    );

    let promptPromise: Promise<string | undefined> | undefined;
    await act(async () => {
      promptPromise = result.current("Initial title");
      await promptPromise;
    });

    await expect(promptPromise).resolves.toBe("Renamed recording");
    expect(openDialogMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        title: "Rename recording",
        placeholder: "Untitled",
        input: { type: "text", label: "Title" },
        defaultValue: "Initial title",
        onSubmit: undefined,
      }),
    );
  });
});
