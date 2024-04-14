import { FC } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { EmptyState } from "../common/empty-state";
import { SettingsTab } from "./tabs";

export const HooksSettings: FC = () => {
  return (
    <Tabs.Content value={SettingsTab.Hooks}>
      <EmptyState>Coming soon!</EmptyState>
    </Tabs.Content>
  );
};
