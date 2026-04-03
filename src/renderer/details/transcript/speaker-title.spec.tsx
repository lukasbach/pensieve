import { render, screen } from "@testing-library/react";
import { SpeakerTitle } from "./speaker-title";
import { TestProvider } from "../../test-provider";

describe("SpeakerTitle", () => {
  it("renders me for speaker 1", () => {
    render(
      <TestProvider>
        <SpeakerTitle speaker="1" timeText="00:05" />
      </TestProvider>,
    );

    expect(screen.getByText("Me")).toBeInTheDocument();
    expect(screen.getByText("00:05")).toBeInTheDocument();
  });

  it("renders they for speaker 0", () => {
    render(
      <TestProvider>
        <SpeakerTitle speaker="0" timeText="00:10" />
      </TestProvider>,
    );

    expect(screen.getByText("They")).toBeInTheDocument();
  });

  it("renders an unknown speaker label for other ids", () => {
    render(
      <TestProvider>
        <SpeakerTitle speaker="2" timeText="00:15" />
      </TestProvider>,
    );

    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
