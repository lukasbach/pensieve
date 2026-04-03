import { fireEvent, render, screen } from "@testing-library/react";
import { Notes } from "./notes";
import { TestProvider } from "../test-provider";

describe("Notes", () => {
  it("renders existing notes and forwards edits", () => {
    const updateMeta = vi.fn().mockResolvedValue(undefined);

    render(
      <TestProvider>
        <Notes
          meta={{ started: "2024-01-01T10:00:00.000Z", notes: "Initial note" }}
          updateMeta={updateMeta}
        />
      </TestProvider>,
    );

    const input = screen.getByPlaceholderText("Recording notes");
    expect(input).toHaveValue("Initial note");

    fireEvent.change(input, { target: { value: "Updated note" } });

    expect(updateMeta).toHaveBeenCalledWith({ notes: "Updated note" });
  });
});
