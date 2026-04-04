import { FC, useMemo, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { useQuery } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { QueryKeys } from "../../query-keys";
import { Settings } from "../../types";
import { mcpApi } from "../api";
import { SettingsSwitchField } from "./settings-switch-field";
import { SettingsTab } from "./tabs";
import { SettingsTextField } from "./settings-text-field";
import * as styles from "./mcp-settings.module.css";

type SnippetCardProps = {
  description: string;
  note?: string;
  snippet: string;
  title: string;
};

const getEndpoint = (port: string | number) => `http://127.0.0.1:${port}/mcp`;

const getCopilotSnippet = (endpoint: string) => `{
  "servers": {
    "pensieve": {
      "type": "http",
      "url": "${endpoint}"
    }
  }
}`;

const getBridgeSnippet = (endpoint: string) => `{
  "mcpServers": {
    "pensieve": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "${endpoint}",
        "--allow-http",
        "--transport",
        "http-only"
      ]
    }
  }
}`;

const getCliSnippet = (endpoint: string) =>
  `npx -p mcp-remote@latest mcp-remote-client ${endpoint} --allow-http --transport http-only`;

const SnippetCard: FC<SnippetCardProps> = ({
  description,
  note,
  snippet,
  title,
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <Box className={styles.snippetCard} mt="1.5rem" p="4">
      <Flex align="start" gap="3" justify="between">
        <Box>
          <Heading as="h3" size="3">
            {title}
          </Heading>
          <Text as="p" color="gray" mt="1">
            {description}
          </Text>
          {note && (
            <Text as="p" color="gray" mt="1">
              {note}
            </Text>
          )}
        </Box>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(snippet);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </Flex>
      <Box asChild mt="3">
        <pre className={styles.snippetBlock}>{snippet}</pre>
      </Box>
    </Box>
  );
};

export const McpSettings: FC = () => {
  const form = useFormContext<Settings>();
  const { data: status } = useQuery({
    queryKey: [QueryKeys.Mcp],
    queryFn: mcpApi.getStatus,
  });
  const enabled = form.watch("mcp.enabled");
  const port = form.watch("mcp.port");
  const endpoint = useMemo(() => getEndpoint(port), [port]);

  return (
    <Tabs.Content value={SettingsTab.Mcp}>
      <Heading>MCP Server</Heading>
      <Text as="p" mb="1rem">
        Pensieve can expose a local MCP server so external tools can search
        recordings, read transcripts, and open recordings in the app.
      </Text>

      <SettingsSwitchField
        field="mcp.enabled"
        form={form}
        label="Enable MCP server"
        description="Start a local MCP server when Pensieve is running."
      />

      <SettingsTextField
        {...form.register("mcp.port")}
        label="Port"
        description="The local port used for the MCP server endpoint."
        max="65535"
        min="1"
        step="1"
        type="number"
      />

      {enabled && (
        <>
          <Heading as="h2" mt="4rem" size="4">
            Endpoint
          </Heading>
          <Text as="p" mt="1rem">
            Local MCP URL: {endpoint}
          </Text>
          <Text
            as="p"
            color={status?.error ? "red" : status?.running ? "green" : "gray"}
            mt="1"
          >
            {status?.error
              ? `Server error: ${status.error}`
              : status?.running
                ? `Server running on ${status.endpoint}`
                : "The server will start after the settings are saved."}
          </Text>

          <Heading as="h2" mt="4rem" size="4">
            Client snippets
          </Heading>
          <Text as="p" mt="1rem">
            Copy one of the snippets below to connect common MCP clients to the
            local Pensieve server.
          </Text>

          <SnippetCard
            title="GitHub Copilot / VS Code"
            description="Paste this into your user or workspace mcp.json file."
            snippet={getCopilotSnippet(endpoint)}
          />

          <SnippetCard
            title="Claude Desktop"
            description="Paste this into Claude Desktop's config file on Windows."
            note="Claude Desktop still prefers stdio-style configs, so this snippet uses mcp-remote to bridge to the local HTTP MCP server."
            snippet={getBridgeSnippet(endpoint)}
          />

          <SnippetCard
            title="Raycast"
            description="Paste this JSON into Raycast's MCP Install Server flow."
            note="Raycast currently supports stdio MCP servers, so this snippet uses mcp-remote as a local bridge."
            snippet={getBridgeSnippet(endpoint)}
          />

          <SnippetCard
            title="Command line"
            description="Use this to test the server from a terminal with the mcp-remote client mode."
            snippet={getCliSnippet(endpoint)}
          />
        </>
      )}
    </Tabs.Content>
  );
};
