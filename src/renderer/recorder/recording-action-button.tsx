import { FC, PropsWithChildren } from "react";
import { IconButton, Tooltip } from "@radix-ui/themes";

export const RecordingActionButton: FC<
  PropsWithChildren<{ tooltip: string; onClick?: () => Promise<void> | void }>
> = ({ tooltip, onClick, children }) => {
  return (
    <Tooltip content={tooltip}>
      <IconButton onClick={onClick} size="4" variant="soft" color="gray">
        {children}
      </IconButton>
    </Tooltip>
  );
};
