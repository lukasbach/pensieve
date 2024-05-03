import { FC } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Box, Button, Heading } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { SiGithub, SiGithubsponsors } from "react-icons/si";
import { GoIssueOpened } from "react-icons/go";
import { SettingsField } from "./settings-field";
import { SettingsTab } from "./tabs";
import { mainApi } from "../api";

export const AboutSettings: FC = () => {
  const { data: version } = useQuery({
    queryKey: [],
    queryFn: () => mainApi.getAppVersion(),
  });
  return (
    <Tabs.Content value={SettingsTab.About}>
      <Heading>About Pensieve</Heading>

      <SettingsField label="Current Version">{version ?? "?"}</SettingsField>

      <SettingsField
        label="GitHub"
        description="If you enjoy using Pensieve, I'd appreciate a star on Github. The project is open source and available on GitHub."
      >
        <Box>
          <Button
            type="button"
            onClick={async () => {
              await mainApi.openWeb("https://github.com/lukasbach/pensieve");
            }}
          >
            <SiGithub /> lukasbach/pensieve
          </Button>
        </Box>
      </SettingsField>

      <SettingsField
        label="Sponsor Pensieve"
        description="You can support the development of Pensieve by sponsoring me on GitHub."
      >
        <Box>
          <Button
            type="button"
            onClick={async () => {
              await mainApi.openWeb("https://github.com/sponsors/lukasbach");
            }}
          >
            <SiGithubsponsors /> Sponsor
          </Button>
        </Box>
      </SettingsField>

      <SettingsField
        label="Bug Tracker"
        description="If you experience issues with Pensieve, you can report them on GitHub."
      >
        <Box>
          <Button
            type="button"
            onClick={async () => {
              await mainApi.openWeb(
                "https://github.com/lukasbach/pensieve/issues",
              );
            }}
          >
            <GoIssueOpened /> Report an Issue
          </Button>
        </Box>
      </SettingsField>
    </Tabs.Content>
  );
};
