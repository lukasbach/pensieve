import { fireEvent, render, screen } from "@testing-library/react";
import { Editable } from "./editable";
import { TestProvider } from "../test-provider";

describe("Editable", () => {
  it("switches to edit mode and submits the updated value", () => {
    const onChange = vi.fn();

    render(
      <TestProvider>
        <Editable value="Initial title" onChange={onChange} />
      </TestProvider>,
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Updated title" },
    });
    fireEvent.click(screen.getByRole("button"));

    expect(onChange).toHaveBeenCalledWith("Updated title");
  });

  it("uses the smaller control size in compact mode", () => {
    const onChange = vi.fn();
    const { container } = render(
      <TestProvider>
        <Editable value="Initial title" onChange={onChange} compact />
      </TestProvider>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(container.querySelector(".rt-TextFieldRoot")?.className).toContain(
      "rt-r-size-1",
    );
    expect(
      container.querySelector('button[type="submit"]')?.className,
    ).toContain("rt-r-size-1");
  });
});
