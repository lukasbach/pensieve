import { FC, PropsWithChildren, ReactNode } from "react";
import { Tabs, Tooltip } from "@radix-ui/themes";
import { useWindowSize } from "@react-hookz/web";

export const ResponsiveTabTrigger: FC<
  PropsWithChildren<{ value: string; icon: ReactNode }>
> = ({ icon, value, children }) => {
  const { width } = useWindowSize(undefined, true);
  return width < 450 ? (
    <Tooltip content={children}>
      <Tabs.Trigger value={value}>{icon}</Tabs.Trigger>
    </Tooltip>
  ) : (
    <Tabs.Trigger value={value}>{children}</Tabs.Trigger>
  );
};
