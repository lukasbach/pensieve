import { FC, useEffect, useState } from "react";
import { IconButton, Tabs } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import {
  HiMiniListBullet,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineVideoCamera,
} from "react-icons/hi2";
import { History } from "../history/history";
import { PageContainer } from "../common/page-container";
import { Postprocess } from "../postprocess/postprocess";
import { historyApi, windowsApi } from "../api";
import { Recorder } from "../recorder/recorder";
import { ResponsiveTabTrigger } from "../common/responsive-tab-trigger";
import { Fancybg } from "../common/fancybg";
import { Chat } from "../chat/chat";
import { QueryKeys } from "../../query-keys";

type MainScreenTab = "record" | "history" | "chat" | "postprocess";

export const MainScreen: FC = () => {
  const [activeTab, setActiveTab] = useState<MainScreenTab>("record");
  const { data: postprocessing } = useQuery({
    queryKey: [QueryKeys.PostProcessing],
    queryFn: historyApi.getPostProcessingProgress,
  });
  const showPostprocessTab = (postprocessing?.processingQueue.length ?? 0) > 0;
  const visibleTab =
    activeTab === "postprocess" && !showPostprocessTab ? "record" : activeTab;

  useEffect(() => {
    if (!showPostprocessTab && activeTab === "postprocess") {
      setActiveTab("record");
    }
  }, [activeTab, showPostprocessTab]);

  return (
    <Tabs.Root
      value={visibleTab}
      onValueChange={(value) => setActiveTab(value as MainScreenTab)}
      style={{ height: "100%" }}
    >
      <PageContainer
        tabs={
          <Tabs.List style={{ flexGrow: "1" }}>
            <ResponsiveTabTrigger
              value="record"
              icon={<HiOutlineVideoCamera />}
            >
              Record
            </ResponsiveTabTrigger>
            <ResponsiveTabTrigger value="history" icon={<HiMiniListBullet />}>
              History
            </ResponsiveTabTrigger>
            <ResponsiveTabTrigger
              value="chat"
              icon={<HiOutlineChatBubbleLeftRight />}
            >
              Chat
            </ResponsiveTabTrigger>
            {showPostprocessTab && (
              <ResponsiveTabTrigger
                value="postprocess"
                icon={<HiOutlineDocumentText />}
              >
                Postprocessing
              </ResponsiveTabTrigger>
            )}
          </Tabs.List>
        }
        statusButtons={
          <IconButton
            variant="outline"
            color="gray"
            onClick={() => windowsApi.openSettingsWindow()}
          >
            <HiOutlineCog6Tooth />
          </IconButton>
        }
      >
        <Fancybg />
        {/* TODO cant remember why i put asChild on the tabContent elements, but radix logs error if they exist, due to children not forwarding refs */}
        <Tabs.Content value="record" asChild>
          <Recorder />
        </Tabs.Content>

        <Tabs.Content value="history">
          <History />
        </Tabs.Content>

        <Tabs.Content value="chat" style={{ height: "100%" }}>
          <Chat />
        </Tabs.Content>

        {showPostprocessTab && (
          <Tabs.Content value="postprocess">
            <Postprocess />
          </Tabs.Content>
        )}
      </PageContainer>
    </Tabs.Root>
  );
};
