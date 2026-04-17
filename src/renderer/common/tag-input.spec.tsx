import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import type { TagDefinition } from "../../tagging";
import { TagInput } from "./tag-input";
import { TestProvider } from "../test-provider";

const existingTags: TagDefinition[] = [
  { name: "Roadmap", color: "blue" },
  { name: "Review", color: "teal" },
];

const manyTags: TagDefinition[] = [
  { name: "Alpha", color: "blue" },
  { name: "Beta", color: "teal" },
  { name: "Gamma", color: "violet" },
  { name: "Delta", color: "pink" },
  { name: "Epsilon", color: "amber" },
  { name: "Zeta", color: "red" },
];

const TagInputHarness = ({
  availableTags = existingTags,
  onCreateTag = async (name: string) => ({ name, color: "red" }),
}: {
  availableTags?: TagDefinition[];
  onCreateTag?: (name: string) => Promise<TagDefinition>;
}) => {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <TagInput
      ariaLabel="Tags"
      availableTags={availableTags}
      value={tags}
      onChange={setTags}
      onCreateTag={onCreateTag}
    />
  );
};

describe("TagInput", () => {
  it("suggests existing tags and adds them from the dropdown", async () => {
    render(
      <TestProvider>
        <TagInputHarness />
      </TestProvider>,
    );

    const input = screen.getByLabelText("Tags");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Road" } });
    fireEvent.click(
      await screen.findByRole("option", { name: "Add Roadmap tag" }),
    );

    expect(screen.getByText("Roadmap")).toBeInTheDocument();
    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe("");
    });
  });

  it("creates new tags on enter and removes them again", async () => {
    const onCreateTag = vi.fn(
      async (name: string): Promise<TagDefinition> => ({
        name,
        color: "violet",
      }),
    );

    render(
      <TestProvider>
        <TagInputHarness onCreateTag={onCreateTag} />
      </TestProvider>,
    );

    const input = screen.getByLabelText("Tags");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Follow up" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(onCreateTag).toHaveBeenCalledWith("Follow up");
    });
    await screen.findByText("Follow up");

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Follow up tag" }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Remove Follow up tag" }),
      ).not.toBeInTheDocument();
    });
  });

  it("shows suggestions on focus and limits the dropdown to five items", async () => {
    render(
      <TestProvider>
        <TagInputHarness availableTags={manyTags} />
      </TestProvider>,
    );

    const input = screen.getByLabelText("Tags");

    fireEvent.focus(input);

    const options = await screen.findAllByRole("option");

    expect(options).toHaveLength(5);
    expect(screen.getByRole("option", { name: "Add Alpha tag" })).toBeVisible();
    expect(
      screen.queryByRole("option", { name: "Add Zeta tag" }),
    ).not.toBeInTheDocument();
  });
});