import http from "http";
import log from "electron-log/main";
// eslint-disable-next-line import/no-unresolved
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
// eslint-disable-next-line import/no-unresolved
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { z } from "zod";
import packageJson from "../../../package.json";
import { QueryKeys } from "../../query-keys";
import * as settings from "./settings";
import { mcpTools } from "./mcp-tools";
import { invalidateUiKeys } from "../ipc/invalidate-ui";

const defaultMcpPort = 3921;
const localHost = "127.0.0.1";
const mcpPath = "/mcp";

type McpStatus = {
  enabled: boolean;
  endpoint: string;
  error: string | null;
  port: number;
  running: boolean;
};

const runtime = {
  server: null as http.Server | null,
  status: {
    enabled: false,
    endpoint: `http://${localHost}:${defaultMcpPort}${mcpPath}`,
    error: null,
    port: defaultMcpPort,
    running: false,
  } satisfies McpStatus,
  syncTask: Promise.resolve(),
};

const getEndpoint = (port: number) => `http://${localHost}:${port}${mcpPath}`;

const updateStatus = (partial: Partial<McpStatus>) => {
  Object.assign(runtime.status, partial);
  invalidateUiKeys(QueryKeys.Mcp);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
      return `Port ${runtime.status.port} is already in use`;
    }

    return error.message;
  }

  return "Unknown MCP server error";
};

const createToolResult = <T>(text: string, structuredContent: T) => ({
  content: [{ text, type: "text" as const }],
  structuredContent,
});

const createToolError = (text: string) => ({
  content: [{ text, type: "text" as const }],
  isError: true,
});

const createPensieveMcpServer = () => {
  const server = new McpServer({
    name: "pensieve",
    version: packageJson.version,
  });

  server.registerTool(
    "query-recordings",
    {
      description:
        "Query local Pensieve meeting recordings by id, date range, and search text. Search automatically uses semantic search when embeddings are enabled.",
      inputSchema: z.object({
        endDate: z.string().optional(),
        offset: z.number().int().min(0).optional(),
        recordingId: z.string().optional(),
        search: z.string().optional(),
        startDate: z.string().optional(),
      }),
    },
    async (args) => {
      try {
        const result = await mcpTools.queryRecordings(args);
        const returnedCount = result.items.length;

        return createToolResult(
          returnedCount
            ? `Returned ${returnedCount} of ${result.totalResults} matching recordings.`
            : "No recordings matched the query.",
          result,
        );
      } catch (error) {
        return createToolError(getErrorMessage(error));
      }
    },
  );

  server.registerTool(
    "read-transcript",
    {
      description:
        "Read transcript lines from a local Pensieve meeting recording. Line numbers are 1-based.",
      inputSchema: z.object({
        length: z.number().int().min(1).optional(),
        recordingId: z.string(),
        startLine: z.number().int().min(1).optional(),
      }),
    },
    async (args) => {
      try {
        const result = await mcpTools.readTranscript(args);

        return createToolResult(
          result.returnedLines
            ? `Returned ${result.returnedLines} transcript lines from recording ${result.recordingId}.`
            : `Recording ${result.recordingId} has no transcript lines in the requested range.`,
          result,
        );
      } catch (error) {
        return createToolError(getErrorMessage(error));
      }
    },
  );

  server.registerTool(
    "recording-details",
    {
      description:
        "Get the metadata, notes, and summary information for a Pensieve meeting recording.",
      inputSchema: z.object({
        recordingId: z.string(),
      }),
    },
    async (args) => {
      try {
        const result = await mcpTools.getRecordingDetails(args);

        return createToolResult(
          `Loaded details for recording ${result.recordingId}.`,
          result,
        );
      } catch (error) {
        return createToolError(getErrorMessage(error));
      }
    },
  );

  server.registerTool(
    "open-recording",
    {
      description:
        "Open a Pensieve meeting recording in the app. highlightedLine is a 1-based transcript line number.",
      inputSchema: z.object({
        highlightedLine: z.number().int().min(1).optional(),
        recordingId: z.string(),
      }),
    },
    async (args) => {
      try {
        const result = await mcpTools.openRecording(args);

        return createToolResult(
          `Opened recording ${result.recordingId} in Pensieve.`,
          result,
        );
      } catch (error) {
        return createToolError(getErrorMessage(error));
      }
    },
  );

  return server;
};

const readJsonBody = async (request: http.IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return undefined;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  return rawBody.length ? JSON.parse(rawBody) : undefined;
};

const setCorsHeaders = (response: http.ServerResponse) => {
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, MCP-Session-Id",
  );
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, POST");
  response.setHeader("Access-Control-Allow-Origin", "*");
};

const handleMcpRequest = async (
  request: http.IncomingMessage,
  response: http.ServerResponse,
) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const requestUrl = new URL(request.url ?? "/", `http://${localHost}`);

  if (requestUrl.pathname === "/" && request.method === "GET") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        endpoint: runtime.status.endpoint,
        name: "Pensieve MCP server",
        running: runtime.status.running,
      }),
    );
    return;
  }

  if (requestUrl.pathname !== mcpPath) {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (request.method !== "POST") {
    response.writeHead(405, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Use POST for MCP requests" }));
    return;
  }

  let body: unknown;

  try {
    body = await readJsonBody(request);
  } catch {
    response.writeHead(400, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Invalid JSON request body" }));
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = createPensieveMcpServer();

  try {
    await server.connect(transport);
    await transport.handleRequest(request, response, body);
  } finally {
    await Promise.allSettled([server.close(), transport.close()]);
  }
};

const createHttpServer = () => {
  return http.createServer((request, response) => {
    handleMcpRequest(request, response).catch((error) => {
      log.error("Unhandled MCP request error", error);

      if (!response.headersSent) {
        setCorsHeaders(response);
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Internal MCP server error" }));
        return;
      }

      response.end();
    });
  });
};

const listen = async (server: http.Server, port: number) => {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, localHost, () => resolve());
  });
};

const closeServer = async (server: http.Server) => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

const stopInternal = async () => {
  if (!runtime.server) {
    return;
  }

  const { server } = runtime;
  runtime.server = null;
  await closeServer(server);
  log.info("MCP server stopped.");
};

const syncFromSettingsInternal = async () => {
  const { mcp } = await settings.getSettings();
  const baseStatus = {
    enabled: mcp.enabled,
    endpoint: getEndpoint(mcp.port),
    port: mcp.port,
  };

  if (!mcp.enabled) {
    await stopInternal();
    updateStatus({ ...baseStatus, error: null, running: false });
    return;
  }

  if (
    runtime.server &&
    runtime.status.running &&
    runtime.status.port === mcp.port
  ) {
    updateStatus({ ...baseStatus, error: null, running: true });
    return;
  }

  await stopInternal();

  const server = createHttpServer();

  try {
    await listen(server, mcp.port);
    runtime.server = server;
    updateStatus({ ...baseStatus, error: null, running: true });
    log.info(`MCP server listening on ${baseStatus.endpoint}.`);
  } catch (error) {
    await Promise.allSettled([closeServer(server)]);
    updateStatus({
      ...baseStatus,
      error: getErrorMessage(error),
      running: false,
    });
    log.error("Failed to start MCP server", error);
  }
};

const enqueue = async (operation: () => Promise<void>) => {
  runtime.syncTask = runtime.syncTask.then(operation, operation);
  await runtime.syncTask;
};

const getStatus = () => ({ ...runtime.status });

const stop = async () => {
  await enqueue(async () => {
    await stopInternal();
    updateStatus({ error: null, running: false });
  });
};

const syncFromSettings = async () => {
  await enqueue(syncFromSettingsInternal);
};

export const mcpServer = {
  getStatus,
  stop,
  syncFromSettings,
};
