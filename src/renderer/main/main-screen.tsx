import { FC } from "react";
import { IconButton, Tabs } from "@radix-ui/themes";
import {
  HiMiniListBullet,
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineVideoCamera,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { History } from "../history/history";
import { PageContainer } from "../common/page-container";
import { Postprocess } from "../postprocess/postprocess";
import { ChatScreen } from "../chat/chat-screen";
import { windowsApi } from "../api";
import { Recorder } from "../recorder/recorder";
import { ResponsiveTabTrigger } from "../common/responsive-tab-trigger";
import { Fancybg } from "../common/fancybg";

export const MainScreen: FC = () => {
  return (
    <Tabs.Root defaultValue="record" style={{ height: "100%" }}>
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
              value="postprocess"
              icon={<HiOutlineDocumentText />}
            >
              Postprocessing
            </ResponsiveTabTrigger>
            <ResponsiveTabTrigger
              value="chat"
              icon={<HiOutlineChatBubbleLeftRight />}
            >
              Chat
            </ResponsiveTabTrigger>
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

        <Tabs.Content value="postprocess">
          <Postprocess />
        </Tabs.Content>

        <Tabs.Content value="chat">
          <ChatScreen />
        </Tabs.Content>
      </PageContainer>
    </Tabs.Root>
  );
};
