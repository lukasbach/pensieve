import { FC, PropsWithChildren, useState } from "react";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { HiOutlineCheck } from "react-icons/hi2";

export const RecordingActionButton: FC<
  PropsWithChildren<{
    tooltip: string;
    onClick?: () => Promise<void> | void;
    signalSuccess?: boolean;
    inOverlay?: boolean;
  }>
> = ({ tooltip, onClick, signalSuccess, children, inOverlay }) => {
  const [success, setSuccess] = useState(false);
  return (
    <Tooltip content={tooltip}>
      <IconButton
        onClick={() => {
          onClick?.();
          if (signalSuccess) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 1000);
          }
        }}
        size={inOverlay ? "2" : "4"}
        variant="soft"
        color={success ? "green" : "gray"}
      >
        {success ? <HiOutlineCheck /> : children}
      </IconButton>
    </Tooltip>
  );
};
