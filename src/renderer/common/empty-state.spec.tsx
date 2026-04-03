import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";
import { TestProvider } from "../test-provider";

describe("EmptyState", () => {
  it("renders the configured content", () => {
    render(
      <TestProvider>
        <EmptyState
          title="No recordings"
          description="Start a recording to see it here."
          icon={<span>ICON</span>}
        >
          <button type="button">Start</button>
        </EmptyState>
      </TestProvider>,
    );

    expect(screen.getByText("ICON")).toBeInTheDocument();
    expect(screen.getByText("No recordings")).toBeInTheDocument();
    expect(
      screen.getByText("Start a recording to see it here."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });
});
