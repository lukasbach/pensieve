import { renderHook, waitFor } from "@testing-library/react";
import { useHistoryRecordings } from "./state";
import { TestProvider } from "../test-provider";

const { getRecordingsMock } = vi.hoisted(() => ({
  getRecordingsMock: vi.fn(),
}));

vi.mock("../api", () => ({
  historyApi: {
    getRecordings: getRecordingsMock,
  },
}));

describe("history state", () => {
  beforeEach(() => {
    getRecordingsMock.mockReset();
  });

  it("loads recordings with react-query", async () => {
    getRecordingsMock.mockResolvedValue({
      recordingA: { started: "2024-01-01T10:00:00.000Z", name: "A" },
    });

    const { result } = renderHook(() => useHistoryRecordings(), {
      wrapper: TestProvider,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({
        recordingA: { started: "2024-01-01T10:00:00.000Z", name: "A" },
      });
    });

    expect(getRecordingsMock).toHaveBeenCalledTimes(1);
  });
});
