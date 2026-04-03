import { fireEvent, render, screen } from "@testing-library/react";
import { ListItem } from "./list-item";
import { TestProvider } from "../test-provider";

describe("ListItem", () => {
  it("renders item metadata and forwards rename updates", () => {
    const onRename = vi.fn();

    const { container } = render(
      <TestProvider>
        <ListItem
          title="Weekly Review"
          subtitle="Action items ready"
          onRename={onRename}
          icon={<span>ICON</span>}
          tags={<span>PINNED</span>}
          isHighlighted
        >
          <button type="button">Action</button>
        </ListItem>
      </TestProvider>,
    );

    expect(screen.getByText("Weekly Review")).toBeInTheDocument();
    expect(screen.getByText("Action items ready")).toBeInTheDocument();
    expect(screen.getByText("ICON")).toBeInTheDocument();
    expect(screen.getByText("PINNED")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(container.querySelector(".hoverhide-container")).not.toBeNull();

    const actionButton = screen.getByRole("button", { name: "Action" });
    const editButton = screen
      .getAllByRole("button")
      .find((button) => button !== actionButton);

    expect(editButton).toBeDefined();

    fireEvent.click(editButton!);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Updated Review" },
    });
    fireEvent.click(container.querySelector('button[type="submit"]')!);

    expect(onRename).toHaveBeenCalledWith("Updated Review");
  });
});
