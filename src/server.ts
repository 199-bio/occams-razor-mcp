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

    // Check if it looks like our specific tool request *before* validation
    if (
      request &&
      typeof request === 'object' &&
      request.tool_name === 'occams_razor_thinking' &&
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
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    } else {
      // It's valid JSON, but not the request we're looking for (e.g., handshake, notification)
      // Log for debugging if needed, but don't send an error response back
      // console.error(`Ignoring non-tool request or unknown message format: ${line.substring(0, 100)}...`);
    }
  } catch (parseError: any) {
    // Handle JSON parsing errors specifically
    if (line.trim() !== '') { // Ignore empty lines
       // Don't send an error response for invalid JSON, as it might be partial data or noise
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