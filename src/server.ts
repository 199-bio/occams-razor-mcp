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
  try {
    const request = JSON.parse(line);

    // Basic request validation
    if (!request.tool_name || !request.arguments) {
      throw new Error('Invalid MCP request format.');
    }

    let response: OccamsRazorThinkingResponse | ErrorResponse;

    // Route to the correct tool handler
    if (request.tool_name === 'occams_razor_thinking') {
      // Further validation specific to the tool's params could go here
      if (typeof request.arguments !== 'object' || request.arguments === null) {
         throw new Error('Invalid arguments format for occams_razor_thinking.');
      }
      response = await handleOccamsRazorThinking(request.arguments as OccamsRazorThinkingParams);
    } else {
      response = {
        status: 'ERROR',
        message: `Unknown tool name: ${request.tool_name}`,
      };
    }

    // Send response back to stdout
    process.stdout.write(JSON.stringify(response) + '\n');

  } catch (error: any) {
    // Handle parsing errors or other unexpected errors
    const errorResponse: ErrorResponse = {
      status: 'ERROR',
      message: error.message || 'An unexpected error occurred.',
      details: error.stack, // Include stack trace for debugging
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
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