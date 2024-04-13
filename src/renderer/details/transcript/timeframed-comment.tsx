import { FC } from "react";
import { Box, Callout } from "@radix-ui/themes";
import { HiMiniPencilSquare } from "react-icons/hi2";

export const TimeframedComment: FC<{ time: number; note: string }> = ({
  note,
}) => (
  <Box mb="1rem">
    <Callout.Root variant="surface">
      <Callout.Icon>
        <HiMiniPencilSquare />
      </Callout.Icon>
      <Callout.Text>{note}</Callout.Text>
    </Callout.Root>
  </Box>
);
