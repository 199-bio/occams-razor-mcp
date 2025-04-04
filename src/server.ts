#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolResult,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
// import { z } from 'zod'; // Removed unused import

import { determineNextStep } from './logic.js';
import { OccamsRazorThinkingParamsSchema, ErrorResponse } from './types.js'; // Import Zod schema and response types (Removed unused OccamsRazorThinkingResponse)

// --- Tool Definition ---

// Extract the shape for properties to avoid redundancy
// const occamsRazorInputSchemaShape = OccamsRazorThinkingParamsSchema.shape; // Removed unused variable

const OCCAMS_RAZOR_TOOL: Tool = {
  name: 'occams_razor_thinking',
  description: "Guides systematic problem-solving for coding tasks using Occam's Razor. Breaks down problems into sequential steps (Context, Outcome, Explore, Evaluate, Implement) prioritizing simplicity. Call this tool sequentially, providing your 'thought' (reasoning/output) for the current step.",
  inputSchema: {
    type: 'object',
    properties: {
        // Map Zod schema properties to JSON schema properties
        thought: { type: "string", description: "Detailed thinking/analysis for the current stage." },
        thought_number: { type: "integer", description: "Sequential number of the thought (starts at 1)." },
        thinking_stage: { type: "string", enum: ["context_analysis", "outcome_definition", "solution_exploration", "simplicity_evaluation", "implementation", "reporting_issue"], description: "The current stage." },
        next_thought_needed: { type: "boolean", description: "`true` to continue, `false` to terminate." },
        user_request: { type: "string", description: "The original user request (required on first call)." },
        needs_clarification: { type: "boolean", description: "Set to `true` if user input is needed." },
        clarification_questions: { type: "array", items: { type: "string" }, description: "Questions for the user if `needs_clarification` is true." },
        user_clarification: { type: "string", description: "User's response to previous clarification request." },
        requested_stage_override: { type: "string", enum: ["context_analysis", "outcome_definition", "solution_exploration", "simplicity_evaluation", "implementation"], description: "Target stage for loopback." },
        issue_description: { type: "string", description: "Summary if task is blocked/infeasible." }
    },
    // Extract required fields from Zod schema if possible, or list manually
    // Zod doesn't directly expose a simple list of required keys easily, list known required ones
    required: ["thought", "thought_number", "thinking_stage", "next_thought_needed"]
  },
};

// --- Server Setup ---

const server = new Server({
  name: 'occams-razor-mcp',
  version: process.env.npm_package_version || '0.1.7', // Read from package.json
  // Capabilities are defined implicitly via setRequestHandler
});

// --- Request Handlers ---

// Handler for listing tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [OCCAMS_RAZOR_TOOL], // Return the defined tool
}));

// Handler for calling the tool
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  if (request.params.name === OCCAMS_RAZOR_TOOL.name) {
    // Validate arguments using the Zod schema from types.ts
    const parseResult = OccamsRazorThinkingParamsSchema.safeParse(request.params.arguments);
    if (!parseResult.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid arguments for tool ${OCCAMS_RAZOR_TOOL.name}: ${parseResult.error.message}`
      );
    }

    // Call the existing logic function
    const logicResponse = await determineNextStep(parseResult.data);

    // Adapt the response from determineNextStep to CallToolResult format
    if (logicResponse.status === 'ERROR') {
        const errorResp = logicResponse as ErrorResponse;
        return {
            isError: true,
            content: [{ type: 'text', text: `Error: ${errorResp.message}${errorResp.details ? ` Details: ${JSON.stringify(errorResp.details)}` : ''}` }],
        };
    } else if (logicResponse.status === 'NEXT_THOUGHT' || logicResponse.status === 'LOOPBACK_ACCEPTED') {
        // These statuses have next_stage and prompt
        return {
            isError: false,
            content: [{ type: 'text', text: `Status: ${logicResponse.status}, Next Stage: ${logicResponse.next_stage}\nPrompt: ${logicResponse.prompt}` }],
        };
    } else if (logicResponse.status === 'CLARIFICATION_NEEDED') {
        // This status has clarification_questions
        return {
            isError: false, // Technically not an error, but requires user action
            content: [{ type: 'text', text: `Status: ${logicResponse.status}\nQuestions:\n- ${logicResponse.clarification_questions.join('\n- ')}` }],
        };
    } else if (logicResponse.status === 'COMPLETED' || logicResponse.status === 'BLOCKED') {
        // These statuses indicate the end of the process
        return {
            isError: false,
            content: [{ type: 'text', text: `Status: ${logicResponse.status}. Process finished.` }],
            // Optionally include final thought or issue description if available and desired
        };
    } else {
        // This block should be unreachable if logicResponse matches the union type.
        // Treat reaching here as an internal server error.
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
  console.error("[occams-razor-mcp] Server running on stdio");
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