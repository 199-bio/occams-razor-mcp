#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'; // Use base Server class
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolResult,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
  CallToolRequest, // Import the type for the request parameter
} from '@modelcontextprotocol/sdk/types.js';

import { determineNextStep } from './logic.js';
import {
  OccamsRazorThinkingParamsSchema, // Zod schema for validation
  ErrorResponse,
  // OccamsRazorThinkingParams, // Removed unused TS Type import
  ThinkingStage, // Enum for JSON schema
  RequestedStageOverride, // Enum for JSON schema
} from './types.js';

// --- Tool Definition with Descriptions ---

// Manually construct the JSON Schema including descriptions
const occamsRazorJsonSchema = { // Remove non-existent JsonSchema type annotation
    type: "object",
    properties: {
        thought: { type: "string", description: "Detailed thinking/analysis for the current stage." },
        thought_number: { type: "number", description: "Sequential number of the thought (starts at 1)." }, // Use "number" instead of "integer"
        thinking_stage: { type: "string", enum: Object.values(ThinkingStage), description: "The current stage." },
        next_thought_needed: { type: "boolean", description: "`true` to continue, `false` to terminate." },
        user_request: { type: "string", description: "The original user request (required on first call)." },
        needs_clarification: { type: "boolean", description: "Set to `true` if user input is needed." },
        clarification_questions: { type: "array", items: { type: "string" }, description: "Questions for the user if `needs_clarification` is true." },
        user_clarification: { type: "string", description: "User's response to previous clarification request." },
        requested_stage_override: { type: "string", enum: Object.values(RequestedStageOverride), description: "Target stage for loopback." },
        issue_description: { type: "string", description: "Summary if task is blocked/infeasible." }
    },
    required: ["thought", "thought_number", "thinking_stage", "next_thought_needed"]
} as const; // Add 'as const' for literal type inference

const OCCAMS_RAZOR_TOOL: Tool = {
  name: 'occams_razor_thinking',
  description: "Guides systematic problem-solving for coding tasks using Occam's Razor. Breaks down problems into sequential steps (Context, Outcome, Explore, Evaluate, Implement) prioritizing simplicity. Call this tool sequentially, providing your 'thought' (reasoning/output) for the current step.",
  inputSchema: occamsRazorJsonSchema, // Use the manually constructed JSON schema
};

// --- Server Setup ---

const server = new Server({
  name: 'occams-razor-mcp',
  version: process.env.npm_package_version || '0.1.9', // Use current version
});

// --- Request Handlers ---

// Handler for listing tools - returns the full Tool definition
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [OCCAMS_RAZOR_TOOL],
}));

// Handler for calling the tool
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => { // Add type to request
  if (request.params.name === OCCAMS_RAZOR_TOOL.name) {
    // Validate arguments using the Zod schema
    const parseResult = OccamsRazorThinkingParamsSchema.safeParse(request.params.arguments);
    if (!parseResult.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid arguments for tool ${OCCAMS_RAZOR_TOOL.name}: ${parseResult.error.message}`
      );
    }

    // Call the existing logic function with validated data
    const logicResponse = await determineNextStep(parseResult.data);

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
  }
  // If tool name doesn't match
  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
});

// --- Main Execution ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[occams-razor-mcp] Server running on stdio via SDK.");
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