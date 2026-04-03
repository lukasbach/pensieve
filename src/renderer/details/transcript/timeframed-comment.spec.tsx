import { render, screen } from "@testing-library/react";
import { TimeframedComment } from "./timeframed-comment";
import { TestProvider } from "../../test-provider";

describe("TimeframedComment", () => {
  it("renders the provided note", () => {
    render(
      <TestProvider>
        <TimeframedComment note="Follow up with the vendor." />
      </TestProvider>,
    );

    expect(screen.getByText("Follow up with the vendor.")).toBeInTheDocument();
  });
});
