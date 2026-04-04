import { mcpServer } from "../domain/mcp";

export const mcpApi = {
  getStatus: async () => mcpServer.getStatus(),
};
