#!/usr/bin/env node

import { McpServer as Server } from '@modelcontextprotocol/sdk/server/mcp.js'; // Use McpServer, alias as Server for less code change
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolResult,
  ErrorCode,
  McpError,
  // ListToolsRequestSchema, // No longer needed directly
  // CallToolRequestSchema, // No longer needed directly
} from '@modelcontextprotocol/sdk/types.js';
// Removed unused 'z' import

import { determineNextStep } from './logic.js';
import {
  OccamsRazorThinkingParamsSchema, // Keep Zod schema for validation within the handler
  ErrorResponse,
  // OccamsRazorThinkingResponse, // Removed unused import
  OccamsRazorThinkingParams, // Keep the TS type for casting if needed
} from './types.js';

// --- Server Setup ---

const server = new Server({
  name: 'occams-razor-mcp',
  version: process.env.npm_package_version || '0.1.8', // Read from package.json
  // Capabilities are now defined implicitly via server.tool()
});

// --- Tool Definition and Handler using server.tool() ---

server.tool(
  'occams_razor_thinking', // 1. Tool name (string)
  "Guides systematic problem-solving for coding tasks using Occam's Razor.", // 2. Description (string)
  OccamsRazorThinkingParamsSchema.shape, // 3. ZodRawShape (the object inside z.object())
  async (params): Promise<CallToolResult> => { // 4. Handler (receives validated params matching the shape)
    // Cast params to the specific TypeScript type if needed for stricter checking within the handler
    const typedParams = params as OccamsRazorThinkingParams;
    try {
      // Call the existing logic function
      const logicResponse = await determineNextStep(typedParams); // Pass potentially casted params

      // Adapt the response from determineNextStep to CallToolResult format
      if (logicResponse.status === 'ERROR') {
          const errorResp = logicResponse as ErrorResponse;
          return {
              isError: true,
              content: [{ type: 'text', text: `Error: ${errorResp.message}${errorResp.details ? ` Details: ${JSON.stringify(errorResp.details)}` : ''}` }],
          };
      } else if (logicResponse.status === 'NEXT_THOUGHT' || logicResponse.status === 'LOOPBACK_ACCEPTED') {
          return {
              isError: false,
              content: [{ type: 'text', text: `Status: ${logicResponse.status}, Next Stage: ${logicResponse.next_stage}\nPrompt: ${logicResponse.prompt}` }],
          };
      } else if (logicResponse.status === 'CLARIFICATION_NEEDED') {
          return {
              isError: false, // Requires user action, but not a server error
              content: [{ type: 'text', text: `Status: ${logicResponse.status}\nQuestions:\n- ${logicResponse.clarification_questions.join('\n- ')}` }],
          };
      } else if (logicResponse.status === 'COMPLETED' || logicResponse.status === 'BLOCKED') {
          return {
              isError: false,
              content: [{ type: 'text', text: `Status: ${logicResponse.status}. Process finished.` }],
          };
      } else {
          // Fallback for any unexpected status from logic
          console.error(`[occams-razor-mcp] Unexpected response status from logic: ${JSON.stringify(logicResponse)}`);
          return {
              isError: true,
              content: [{ type: 'text', text: `Internal Server Error: Unexpected response state.` }],
          };
      }
    } catch (error: any) {
        // Catch errors from determineNextStep or response adaptation
        console.error(`[occams-razor-mcp] Error during tool execution: ${error.message}`, error.stack);
        throw new McpError(
            ErrorCode.InternalError,
            `Error executing tool occams_razor_thinking: ${error.message}`
        );
    }
  }
);

// --- Main Execution ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[occams-razor-mcp] Server running on stdio, using SDK.");
  // Keep alive indefinitely until SIGINT/SIGTERM
  await new Promise(() => {});
}

main().catch((error) => {
  console.error('[occams-razor-mcp] Fatal error:', error);
  process.exit(1);
});

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
  console.error('[occams-razor-mcp] SIGINT received, shutting down...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('[occams-razor-mcp] SIGTERM received, shutting down...');
  await server.close();
  process.exit(0);
});