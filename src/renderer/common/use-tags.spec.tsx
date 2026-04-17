import { act, renderHook } from "@testing-library/react";
import { defaultSettings } from "../../types";
import type { TagColor } from "../../tagging";
import { useTags } from "./use-tags";

const { getRecordingsMock, saveSettingsMock } = vi.hoisted(() => ({
  getRecordingsMock: vi.fn(),
  saveSettingsMock: vi.fn(),
}));

vi.mock("../api", () => ({
  historyApi: {
    getRecordings: getRecordingsMock,
  },
  mainApi: {
    saveSettings: saveSettingsMock,
  },
}));

describe("useTags", () => {
  beforeEach(() => {
    getRecordingsMock.mockReset();
    saveSettingsMock.mockReset();
    saveSettingsMock.mockResolvedValue(undefined);
  });

  it("returns existing tags and persists newly created ones", async () => {
    const tags: Record<string, TagColor> = { Roadmap: "blue" };
    const settings = {
      ...defaultSettings,
      tags,
    };

    const { result } = renderHook(() =>
      useTags({ settings, saveSettings: saveSettingsMock }),
    );

    expect(result.current.availableTags).toEqual([
      { name: "Roadmap", color: "blue" },
    ]);

    await act(async () => {
      await expect(result.current.createTag("Roadmap")).resolves.toEqual({
        name: "Roadmap",
        color: "blue",
      });
    });

    expect(saveSettingsMock).not.toHaveBeenCalled();

    await act(async () => {
      await expect(result.current.createTag("Review")).resolves.toEqual(
        expect.objectContaining({
          name: "Review",
        }),
      );
    });

    expect(saveSettingsMock).toHaveBeenCalledWith({
      tags: expect.objectContaining({
        Roadmap: "blue",
        Review: expect.any(String),
      }),
    });
  });

  it("prunes unreferenced stored tags when tags are removed", async () => {
    const tags: Record<string, TagColor> = {
      Existing: "red",
      Team: "blue",
      Review: "teal",
    };
    const settings = {
      ...defaultSettings,
      tags,
    };
    const onChange = vi.fn(async (_tags: string[]) => undefined);

    getRecordingsMock.mockResolvedValue({
      "recording-1": { tags: ["Team"] },
      "recording-2": { tags: ["Review"] },
    });

    const { result } = renderHook(() =>
      useTags({
        currentTags: ["Existing", "Team"],
        onChange,
        saveSettings: saveSettingsMock,
        settings,
        syncStoredTags: true,
      }),
    );

    await act(async () => {
      await result.current.setTags(["Team", "Review"]);
    });

    expect(onChange).toHaveBeenCalledWith(["Team", "Review"]);
    expect(getRecordingsMock).toHaveBeenCalledTimes(1);
    expect(saveSettingsMock).toHaveBeenCalledWith({
      tags: {
        Team: "blue",
        Review: "teal",
      },
    });
  });
});