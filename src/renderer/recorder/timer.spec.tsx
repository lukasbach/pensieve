import { act, render, screen } from "@testing-library/react";
import { Timer } from "./timer";

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when no start time is available", () => {
    const { container } = render(<Timer start={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("increments the displayed duration every second", () => {
    render(<Timer start={1} />);

    expect(screen.getByText("00:01")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("00:02")).toBeInTheDocument();
  });
});
