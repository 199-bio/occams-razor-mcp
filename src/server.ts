#!/usr/bin/env node

import * as readline from 'readline';
import {
  OccamsRazorThinkingParams,
  OccamsRazorThinkingResponse,
  ErrorResponse,
} from './types.js'; // Add .js extension

import { determineNextStep } from './logic.js'; // Import the actual logic

// Replace placeholder with call to actual logic
async function handleOccamsRazorThinking(
  params: OccamsRazorThinkingParams
): Promise<OccamsRazorThinkingResponse | ErrorResponse> {
  // Basic validation could remain here, or be solely within determineNextStep
  // Let's rely on determineNextStep for core validation now
  return determineNextStep(params);

  /* Placeholder logic removed:
  console.error('handleOccamsRazorThinking logic not yet implemented.');

  // Basic validation example (more robust validation needed)
  if (params.thought_number === 1 && !params.user_request) {
    return {
      status: 'ERROR',
      message: "Missing required parameter 'user_request' for the first thought.",
    };
  }

  // Placeholder response - replace with actual logic
  return {
    status: 'ERROR',
    message: 'Tool logic not implemented.',
    details: params, // Echo params for debugging during development
  };
  */
  // TODO: Implement the core logic based on PRD sections 5.2 - 5.6
  console.error('handleOccamsRazorThinking logic not yet implemented.');

  // Basic validation example (more robust validation needed)
  if (params.thought_number === 1 && !params.user_request) {
    return {
      status: 'ERROR',
      message: "Missing required parameter 'user_request' for the first thought.",
    };
  }

  // Placeholder response - replace with actual logic
  return {
    status: 'ERROR',
    message: 'Tool logic not implemented.',
    details: params, // Echo params for debugging during development
  };
}

// --- Basic MCP Server Structure (stdin/stdout) ---

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false, // Important for reading line-by-line from stdin
});

rl.on('line', async (line) => {
  let request: any;
  try {
    // Attempt to parse the line as JSON
    request = JSON.parse(line);

    // --- Handle Standard MCP Initialize Request ---
    if (request && typeof request === 'object' && request.method === 'initialize' && request.id !== undefined) {
        const initializeResponse = {
            jsonrpc: "2.0",
            id: request.id, // Echo the request ID
            result: {
                capabilities: {
                    tools: [
                        {
                            name: "occams_razor_thinking",
                            description: "Guides systematic problem-solving for coding tasks using Occam's Razor. Breaks down problems into sequential steps (Context, Outcome, Explore, Evaluate, Implement) prioritizing simplicity. Call this tool sequentially, providing your 'thought' (reasoning/output) for the current step.",
                            // TODO: Ideally, generate this schema dynamically from Zod
                            inputSchema: {
                                type: "object",
                                properties: {
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
                                required: ["thought", "thought_number", "thinking_stage", "next_thought_needed"]
                            }
                        }
                    ],
                    resources: [] // No resources defined
                }
            }
        };
        process.stdout.write(JSON.stringify(initializeResponse) + '\n');

    // --- Handle Occams Razor Tool Request ---
    } else if (
        request &&
        typeof request === 'object' &&
        request.tool_name === 'occams_razor_thinking' && // Check for tool_name for tool calls
        request.arguments &&
        typeof request.arguments === 'object'
    ) {
        // Only process if it matches the expected tool request structure
        let response: OccamsRazorThinkingResponse | ErrorResponse;
        try {
            // Now call the handler which contains the Zod validation via determineNextStep
            response = await handleOccamsRazorThinking(request.arguments as OccamsRazorThinkingParams);
            process.stdout.write(JSON.stringify(response) + '\n');
        } catch (handlerError: any) {
            // Handle errors specifically from the handler/validation
            const errorResponse: ErrorResponse = {
                status: 'ERROR',
                message: `Error processing tool request: ${handlerError.message || 'Unknown handler error.'}`,
                details: handlerError.stack,
            };
            // Note: For tool call errors, MCP expects a specific JSON-RPC error format.
            // This basic error response might need refinement for full compliance.
            process.stdout.write(JSON.stringify(errorResponse) + '\n');
        }
    } else {
        // It's valid JSON, but not initialize or the tool request we handle.
        // Ignore other methods (like shutdown, exit) or notifications.
        // console.error(`Ignoring message: ${line.substring(0, 100)}...`);
    }
  } catch (parseError: any) {
    // Handle JSON parsing errors specifically
    if (line.trim() !== '') { // Ignore empty lines
       // Don't send an error response for invalid JSON.
       // console.error(`Failed to parse incoming line as JSON: ${parseError.message}. Line: ${line.substring(0, 100)}...`);
    }
  }
});

rl.on('close', () => {
  // This event fires when the input stream (stdin) ends.
  console.error('Readline interface closed (stdin likely ended). Server may exit if no other async operations are pending.');
  // We don't explicitly exit here, allowing Node to exit naturally if appropriate.
});

// Handle process exit signals gracefully if needed
process.on('SIGINT', () => {
  console.error('Received SIGINT. Exiting.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM. Exiting.');
  process.exit(0);
});

console.error('Occam\'s Razor MCP Server ready. Listening on stdin...'); // Log to stderr