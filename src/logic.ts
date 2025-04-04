import {
  OccamsRazorThinkingParams,
  OccamsRazorThinkingResponse,
  ThinkingStage,
  RequestedStageOverride,
  NextThoughtResponse,
  ClarificationNeededResponse,
  CompletedResponse,
  BlockedResponse,
  ErrorResponse,
} from './types.js'; // Add .js extension
import { getPrompt } from './prompts.js'; // Add .js extension

/**
 * Determines the next step in the Occam's Razor thinking process based on the current request parameters.
 * This function acts as the core state machine for the tool. It handles:
 * - Initial call validation (presence of user_request).
 * - Termination signals (next_thought_needed = false) for completion or blocking.
 * - Clarification requests (needs_clarification = true).
 * - Loopback requests (requested_stage_override).
 * - Sequential stage progression.
 * - Generation of the appropriate response object (NextThoughtResponse, ClarificationNeededResponse, etc.).
 *
 * @param params - The input parameters received from the LLM for the current thinking step.
 * @returns The response object to be sent back to the LLM, guiding its next action or indicating completion/blocking/error.
 */
export function determineNextStep(
  params: OccamsRazorThinkingParams
): OccamsRazorThinkingResponse | ErrorResponse {
  const {
    thought,
    thought_number,
    thinking_stage,
    next_thought_needed,
    needs_clarification,
    clarification_questions,
    user_clarification, // Important for adapting after clarification
    requested_stage_override,
    issue_description,
    user_request, // Added for validation
  } = params;

  // --- 0. Initial Call Validation ---
  if (thought_number === 1 && !user_request) {
    return {
      status: 'ERROR',
      message: "Missing required parameter 'user_request' for the first thought (thought_number: 1).",
    };
  }

  // --- 1. Handle Termination Signals ---
  if (!next_thought_needed) {
    if (thinking_stage === ThinkingStage.REPORTING_ISSUE && issue_description) {
      const response: BlockedResponse = {
        status: 'BLOCKED',
        action: 'blocked',
        issue_description: issue_description,
        final_thought: thought, // The detailed explanation
        thought_number: thought_number,
      };
      return response;
    } else if (thinking_stage === ThinkingStage.IMPLEMENTATION) {
      // Assume successful completion if not reporting an issue
      const response: CompletedResponse = {
        status: 'COMPLETED',
        action: 'completed',
        final_thought: thought, // The summary of implementation
        thought_number: thought_number,
      };
      return response;
    } else {
      // Invalid termination state
      return {
        status: 'ERROR',
        message: `Invalid termination state. 'next_thought_needed' is false, but stage is '${thinking_stage}' and no issue description provided for reporting_issue stage.`,
        // thought_number removed from ErrorResponse
      };
    }
  }

  // --- 2. Handle Clarification Needs ---
  if (needs_clarification) {
    if (!clarification_questions || clarification_questions.length === 0) {
      return {
        status: 'ERROR',
        message:
          "'needs_clarification' is true, but 'clarification_questions' is missing or empty.",
        // thought_number removed from ErrorResponse
      };
    }
    const response: ClarificationNeededResponse = {
      status: 'CLARIFICATION_NEEDED',
      action: 'clarification_needed',
      questions_for_user: clarification_questions,
      thought_number: thought_number,
    };
    return response;
  }

  // --- 3. Handle Loopback Requests ---
  let nextStage: ThinkingStage | null = null;
  if (requested_stage_override) {
    // Basic validation: Check if the loop makes sense (e.g., eval -> explore)
    // More sophisticated validation could be added based on PRD 5.5
    const isValidLoop = validateLoopback(thinking_stage, requested_stage_override, thought);
    if (isValidLoop) {
        console.error(`Loopback requested and accepted: from ${thinking_stage} to ${requested_stage_override}`); // Log to stderr
        // Assign the valid string value directly, ensuring ThinkingStage includes these values
        nextStage = requested_stage_override as unknown as ThinkingStage;
    } else {
        console.error(`Loopback requested but denied: from ${thinking_stage} to ${requested_stage_override}. Justification: "${thought}"`); // Log to stderr
        // If denied, proceed sequentially (handled below)
    }
  }

  // --- 4. Determine Next Stage Sequentially (if no loopback accepted) ---
  if (!nextStage) {
      switch (thinking_stage) {
        case ThinkingStage.CONTEXT_ANALYSIS:
          nextStage = ThinkingStage.OUTCOME_DEFINITION;
          break;
        case ThinkingStage.OUTCOME_DEFINITION:
          nextStage = ThinkingStage.SOLUTION_EXPLORATION;
          break;
        case ThinkingStage.SOLUTION_EXPLORATION:
          nextStage = ThinkingStage.SIMPLICITY_EVALUATION;
          break;
        case ThinkingStage.SIMPLICITY_EVALUATION:
          nextStage = ThinkingStage.IMPLEMENTATION;
          break;
        case ThinkingStage.IMPLEMENTATION:
          // Stays in implementation until next_thought_needed is false
          nextStage = ThinkingStage.IMPLEMENTATION;
          break;
        case ThinkingStage.REPORTING_ISSUE:
           // This stage should only be entered when next_thought_needed is false, handled above.
           return { status: 'ERROR', message: 'Invalid state: Reached REPORTING_ISSUE stage while next_thought_needed is true.' };
        default:
          // Should not happen with enum validation
          return { status: 'ERROR', message: `Unknown thinking stage: ${thinking_stage}` };
      }
  }


  // --- 5. Generate Prompt for the Next Stage ---
  // Determine if we are staying in the implementation stage for refinement
  const isImplementationRefinement = thinking_stage === ThinkingStage.IMPLEMENTATION && nextStage === ThinkingStage.IMPLEMENTATION;
  // Consider user_clarification when generating the prompt if applicable
  const prompt = getPrompt(nextStage, isImplementationRefinement, requested_stage_override, user_clarification);

  // --- 6. Construct the Response ---
  const response: NextThoughtResponse = {
    status: 'NEXT_THOUGHT',
    action: 'next_thought',
    next_stage: nextStage,
    prompt: prompt,
    thought_number: thought_number, // Echo current thought number
    next_thought_number: thought_number + 1, // Increment for the next expected thought
  };

  return response;
}


/**
 * Validates if a requested loopback transition is considered logical and justified.
 * This is a basic implementation based on common sense transitions and requiring justification.
 * It can be expanded with more sophisticated rules based on the PRD or specific needs.
 * Logs reasons for denial to stderr for debugging.
 *
 * @param currentStage - The stage the LLM is currently in.
 * @param requestedStage - The earlier stage the LLM wants to loop back to.
 * @param justification - The reason provided by the LLM (in the 'thought' parameter) for requesting the loopback.
 * @returns `true` if the loopback is considered valid and should be accepted, `false` otherwise.
 */
function validateLoopback(currentStage: ThinkingStage, requestedStage: RequestedStageOverride, justification: string): boolean {
    // Require some justification
    if (!justification || justification.trim().length < 10) {
        console.error("Loopback denied: Justification missing or too short.");
        return false;
    }

    // Example valid loops (adjust based on PRD/needs) - Compare string values
    if (currentStage === ThinkingStage.SIMPLICITY_EVALUATION && requestedStage === RequestedStageOverride.SOLUTION_EXPLORATION) return true;
    if (currentStage === ThinkingStage.IMPLEMENTATION && requestedStage === RequestedStageOverride.OUTCOME_DEFINITION) return true;
    if (currentStage === ThinkingStage.IMPLEMENTATION && requestedStage === RequestedStageOverride.SIMPLICITY_EVALUATION) return true;
    // Add other valid transitions if needed

    console.error(`Loopback denied: Transition from ${currentStage} to ${requestedStage} not standard.`);
    return false;
}