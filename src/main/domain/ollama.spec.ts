export {};

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

describe("ollama", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
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

    await ollama.pullModel("gemma3:4b", "http://localhost:11434");

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

    await ollama.pullModel("llama3.2", "http://localhost:11434");

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

    await expect(
      ollama.pullModel("llama3.2", "http://localhost:11434"),
    ).rejects.toThrow("Failed to fetch POST /api/pull: Bad Request");
  });
});
