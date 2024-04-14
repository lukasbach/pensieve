import { FC, PropsWithChildren, ReactNode } from "react";
import { Box, Tabs, Tooltip } from "@radix-ui/themes";
import { useWindowSize } from "@react-hookz/web";

export const ResponsiveTabTrigger: FC<
  PropsWithChildren<{ value: string; icon: ReactNode }>
> = ({ icon, value, children }) => {
  const { width } = useWindowSize(undefined, true);
  return width < 450 ? (
    <Tabs.Trigger value={value}>
      <Tooltip content={children}>
        <Box mt="5px">{icon}</Box>
      </Tooltip>
    </Tabs.Trigger>
  ) : (
    <Tabs.Trigger value={value}>{children}</Tabs.Trigger>
  );
};
