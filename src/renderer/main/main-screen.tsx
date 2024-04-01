import { FC } from "react";
import { Tabs } from "@radix-ui/themes";
import { Recorder } from "../recorder/recorder";
import { History } from "../history/history";
import { PageHeader } from "../common/page-header";

export const MainScreen: FC<{}> = ({}) => {
  return (
    <Tabs.Root defaultValue="record">
      <PageHeader
        tabs={
          <Tabs.List>
            <Tabs.Trigger value="record">Record</Tabs.Trigger>
            <Tabs.Trigger value="history">History</Tabs.Trigger>
          </Tabs.List>
        }
      />

      <Tabs.Content value="record">
        <Recorder />
      </Tabs.Content>

      <Tabs.Content value="history">
        <History />
      </Tabs.Content>
    </Tabs.Root>
  );
};
