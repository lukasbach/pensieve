import { forwardRef } from "react";
import { Box, TextArea } from "@radix-ui/themes";
import { RecordingMeta } from "../../types";

export const Notes = forwardRef<
  HTMLDivElement,
  {
    meta: RecordingMeta;
    updateMeta: (update: Partial<RecordingMeta>) => Promise<void>;
  }
>(({ meta, updateMeta }, ref) => {
  return (
    <Box ref={ref} height="100%" p=".5rem">
      <TextArea
        style={{ height: "100%", boxSizing: "border-box" }}
        defaultValue={meta.notes ?? ""}
        placeholder="Recording notes"
        onChange={(e) => {
          updateMeta({ notes: e.currentTarget.value });
        }}
      />
    </Box>
  );
});
