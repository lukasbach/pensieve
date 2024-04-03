import { FC } from "react";
import { Tabs } from "@radix-ui/themes";
import { Recorder } from "../recorder/recorder";
import { History } from "../history/history";
import { PageContainer } from "../common/page-container";
import { Postprocess } from "../postprocess/postprocess";

export const MainScreen: FC = () => {
  return (
    <Tabs.Root defaultValue="record" style={{ height: "100%" }}>
      <PageContainer
        tabs={
          <Tabs.List>
            <Tabs.Trigger value="record">Record</Tabs.Trigger>
            <Tabs.Trigger value="history">History</Tabs.Trigger>
            <Tabs.Trigger value="postprocess">Postprocessing</Tabs.Trigger>
          </Tabs.List>
        }
      >
        <Tabs.Content value="record" asChild>
          <Recorder />
        </Tabs.Content>

        <Tabs.Content value="history" asChild>
          <History />
        </Tabs.Content>

        <Tabs.Content value="postprocess" asChild>
          <Postprocess />
        </Tabs.Content>
      </PageContainer>
    </Tabs.Root>
  );
};
