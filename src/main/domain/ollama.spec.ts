export {};

const { fetchMock, getSettingsMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  getSettingsMock: vi.fn(),
}));

vi.mock("./settings", () => ({
  getSettings: getSettingsMock,
}));

describe("ollama", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    getSettingsMock.mockReset();
    getSettingsMock.mockResolvedValue({
      llm: {
        providerConfig: {
          ollama: {
            chatModel: { baseUrl: "http://localhost:11434" },
          },
        },
      },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not pull a model that already exists", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: "gemma3:4b", size: 1 }] }),
    });

    const ollama = await import("./ollama");

    await ollama.pullModel("gemma3:4b");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:11434/api/tags", {
      body: undefined,
      method: "GET",
    });
  });

  it("pulls a model when it is missing", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success" }),
      });

    const ollama = await import("./ollama");

    await ollama.pullModel("llama3.2");

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:11434/api/pull",
      {
        body: JSON.stringify({
          name: "llama3.2",
          format: "json",
          stream: false,
        }),
        method: "POST",
      },
    );
  });

  it("fails when the pull request is rejected", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
      });

    const ollama = await import("./ollama");

    await expect(ollama.pullModel("llama3.2")).rejects.toThrow(
      "Failed to fetch POST /api/pull: Bad Request",
    );
  });
});
