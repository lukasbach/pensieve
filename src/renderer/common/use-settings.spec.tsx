import { act, renderHook, waitFor } from "@testing-library/react";
import { TestProvider } from "../test-provider";
import { useSettings } from "./use-settings";

const { getSettingsMock, saveSettingsMock } = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  saveSettingsMock: vi.fn(),
}));

vi.mock("../api", () => ({
  mainApi: {
    getSettings: getSettingsMock,
    saveSettings: saveSettingsMock,
  },
}));

describe("useSettings", () => {
  beforeEach(() => {
    getSettingsMock.mockReset();
    saveSettingsMock.mockReset();
    saveSettingsMock.mockResolvedValue(undefined);
  });

  it("loads settings and saves partial updates", async () => {
    const settings = {
      ui: {
        dark: false,
      },
    };
    getSettingsMock.mockResolvedValue(settings);

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestProvider,
    });

    await waitFor(() => {
      expect(result.current.settings).toEqual(settings);
    });

    await act(async () => {
      await result.current.saveSettings({ ui: { dark: true } });
    });

    expect(saveSettingsMock).toHaveBeenCalledWith({ ui: { dark: true } });
  });
});
