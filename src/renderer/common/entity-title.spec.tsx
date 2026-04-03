import { render, screen } from "@testing-library/react";
import { EntityTitle } from "./entity-title";
import { TestProvider } from "../test-provider";

describe("EntityTitle", () => {
  it("renders its title, subtitle, icon, and tags", () => {
    render(
      <TestProvider>
        <EntityTitle
          subtitle="Summary preview"
          icon={<span>ICON</span>}
          tags={<span>TAG</span>}
        >
          Daily Sync
        </EntityTitle>
      </TestProvider>,
    );

    expect(screen.getByText("ICON")).toBeInTheDocument();
    expect(screen.getByText("Daily Sync")).toBeInTheDocument();
    expect(screen.getByText("Summary preview")).toBeInTheDocument();
    expect(screen.getByText("TAG")).toBeInTheDocument();
  });
});
