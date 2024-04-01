import { FC } from "react";
import { Tabs } from "@radix-ui/themes";
import { Recorder } from "../recorder/recorder";
import { History } from "../history/history";
import { PageContainer } from "../common/page-container";

export const MainScreen: FC = () => {
  return (
    <Tabs.Root defaultValue="record">
      <PageContainer
        tabs={
          <Tabs.List>
            <Tabs.Trigger value="record">Record</Tabs.Trigger>
            <Tabs.Trigger value="history">History</Tabs.Trigger>
          </Tabs.List>
        }
      >
        <Tabs.Content value="record">
          <Recorder />
        </Tabs.Content>

        <Tabs.Content value="history">
          <History />
        </Tabs.Content>
      </PageContainer>
    </Tabs.Root>
  );
};
