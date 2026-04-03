import { act, fireEvent, render, screen } from "@testing-library/react";
import { SearchBar } from "./search-bar";
import { TestProvider } from "../test-provider";

const transcript = {
  result: { language: "en" },
  transcription: [
    {
      timestamps: { from: "00:00:00.000", to: "00:00:10.000" },
      offsets: { from: 0, to: 10 },
      text: "Roadmap planning for the next quarter.",
      speaker: "Alice",
    },
    {
      timestamps: { from: "00:00:10.000", to: "00:00:20.000" },
      offsets: { from: 10, to: 20 },
      text: "Hiring and roadmap updates for support.",
      speaker: "Bob",
    },
  ],
};

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("searches transcript lines and jumps between matches", () => {
    const onJumpTo = vi.fn();

    render(
      <TestProvider>
        <SearchBar transcript={transcript} onJumpTo={onJumpTo} />
      </TestProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText("Search transcript..."), {
      target: { value: "roadmap" },
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onJumpTo).toHaveBeenCalledWith(10);
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    const [previousButton, nextButton] = screen.getAllByRole("button");
    fireEvent.click(nextButton);

    expect(onJumpTo).toHaveBeenLastCalledWith(20);
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    fireEvent.click(previousButton);

    expect(onJumpTo).toHaveBeenLastCalledWith(10);
  });

  it("shows an empty-state label when nothing matches", () => {
    render(
      <TestProvider>
        <SearchBar transcript={transcript} onJumpTo={vi.fn()} />
      </TestProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText("Search transcript..."), {
      target: { value: "nonexistent" },
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText("No results")).toBeInTheDocument();
  });
});
