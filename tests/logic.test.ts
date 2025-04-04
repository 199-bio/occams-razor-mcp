import { determineNextStep } from '../src/logic.js'; // Add .js extension
import { getPrompt } from '../src/prompts.js'; // Add .js extension
import {
  OccamsRazorThinkingParams,
  ThinkingStage,
  NextThoughtResponse,
  ErrorResponse,
} from '../src/types.js'; // Add .js extension

describe('determineNextStep Logic', () => {
  it('should transition from CONTEXT_ANALYSIS to OUTCOME_DEFINITION on the first call', () => {
    const params: OccamsRazorThinkingParams = {
      thought: 'Analyzed the project context. It uses React and Tailwind.',
      thought_number: 1,
      thinking_stage: ThinkingStage.CONTEXT_ANALYSIS,
      next_thought_needed: true,
      user_request: 'Add a login button to the header.', // Crucial for the first call
    };

    const result = determineNextStep(params);

    // Check it's not an error
    expect(result.status).not.toBe('ERROR');

    // Check it's the correct response type
    expect(result.status).toBe('NEXT_THOUGHT');

    // Type assertion for further checks
    const nextThoughtResult = result as NextThoughtResponse;

    // Check the next stage
    expect(nextThoughtResult.next_stage).toBe(ThinkingStage.OUTCOME_DEFINITION);

    // Check the next thought number
    expect(nextThoughtResult.next_thought_number).toBe(2);

    // Check that the correct prompt for the next stage is returned
    const expectedPrompt = getPrompt(ThinkingStage.OUTCOME_DEFINITION, false); // isImplementationRefinement is false
    expect(nextThoughtResult.prompt).toBe(expectedPrompt);

    // Check that the current thought number is echoed
    expect(nextThoughtResult.thought_number).toBe(1);
  });

  it('should return an error if user_request is missing on the first call', () => {
     const params: OccamsRazorThinkingParams = {
      thought: 'Analyzed context.',
      thought_number: 1,
      thinking_stage: ThinkingStage.CONTEXT_ANALYSIS,
      next_thought_needed: true,
      // user_request is missing
    };

    const result = determineNextStep(params);

    // Check it's an error
    expect(result.status).toBe('ERROR');

    // Type assertion for further checks
    const errorResult = result as ErrorResponse;

    // Check the error message
    expect(errorResult.message).toContain("Missing required parameter 'user_request'");

    // Let's add the check to determineNextStep and then test it.
    // *Skipping test implementation for now until logic is updated*
    // TODO: Add test case after updating determineNextStep to validate user_request on thought_number 1
  });

  // TODO: Add more tests for other transitions, clarifications, loopbacks, termination etc.
});