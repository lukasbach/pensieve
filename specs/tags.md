Implement a new tagging system for history items.

Which tags exist and which colors are assigned to them is stored in a setting.

Implement the following utility components:
- `TagInput`: Renders a text input. Typing suggests existing tags in a dropdown. Pressing enter creates a new tag if it doesn't exist yet, with a random color from a hardcoded list of available colors. If a tag is added, it is rendered within the input to the left of the text. Each tag has a small "x" button to remove it again.
- `Tag`: Renders a tag with the name and color. Optionally has a small "x" button to remove it again.

# Changes to the Recording view

Below the title input of the recording, there is a tag input to configure which tags should be assigned to the recording.

# Changes to the History view

- In the dropdown menu, the "Filter" submenu is renamed to "Filter by type"
- In the dropdown menu, a new submenu "Filter by tag" is added, which lists all existing tags. Clicking on a tag filters the history to only show items with that tag. Clicking an option toggles the filter for that tag, and doesn't close the menu
- While a tag filter is enabled, all selected tags are shown below the row with the input and buttons. Each tag has a small "x" button to remove the filter for that tag.
- Each history item shows assigned tags next to the title. Those tags do not have an "x" and are abbreviated to at most 8 characters. The old language tags that used to be shown here are removed
- In the dropdown menu for each history item, a new menu entry "Edit tags" opens a new window with a tag input.

# Follow up tasks
- Add a small gap between tags in the history item view
- At most three tags should be shown in history items, and they should not wrap
- If a tag is removed and no longer referenced in any other recordings, it should be removed from the list of existing tags as well
- When a tag input is focused, suggested tags should also be shown. Always limit the dropdown to at most 5 items.
- The tag input dropdown should not have a see-through background
- The tag input should not have the top "Tags" label.
- The height/inner vertical margin of tags within the tag input should be reduced
- Outside of the tag input, tags should be rendered with Radix's `Badge` component. In the filtered history view, just use clickeable Badges without the x. Remove the Tag component.