/**
 * Defines the possible stages in the Occam's Razor thinking process.
 */
export enum ThinkingStage {
  CONTEXT_ANALYSIS = 'context_analysis',
  OUTCOME_DEFINITION = 'outcome_definition',
  SOLUTION_EXPLORATION = 'solution_exploration',
  SIMPLICITY_EVALUATION = 'simplicity_evaluation',
  IMPLEMENTATION = 'implementation',
  REPORTING_ISSUE = 'reporting_issue',
}

/**
 * Defines the possible stages that can be requested for a loopback.
 */
export enum RequestedStageOverride {
  CONTEXT_ANALYSIS = 'context_analysis',
  OUTCOME_DEFINITION = 'outcome_definition',
  SOLUTION_EXPLORATION = 'solution_exploration',
  SIMPLICITY_EVALUATION = 'simplicity_evaluation',
  IMPLEMENTATION = 'implementation',
}

/**
 * Represents the input parameters for the occams_razor_thinking MCP tool.
 * Based on PRD Section 5.1.
 */
export interface OccamsRazorThinkingParams {
  /** Required. Your detailed thinking, analysis, or summary output corresponding to the current 'thinking_stage'. */
  thought: string;
  /** Required. The sequential number of this thought in the current problem-solving process (starts at 1). */
  thought_number: number;
  /** Required. The specific stage of the Occam's Razor process that the current 'thought' pertains to. */
  thinking_stage: ThinkingStage;
  /** Required. Set to 'true' if guidance for the subsequent thinking step is needed. Set to 'false' if the process is complete. */
  next_thought_needed: boolean;
  /** Required on the first call (thought_number=1), optional thereafter. The original user request. */
  user_request?: string;
  /** Optional, defaults to false. Set to 'true' if user input is required to proceed. */
  needs_clarification?: boolean;
  /** Optional. If 'needs_clarification' is true, provide the specific question(s) for the user. */
  clarification_questions?: string[];
  /** Optional. Provide the user's response obtained from a previous 'CLARIFICATION_NEEDED' state. */
  user_clarification?: string;
  /** Optional. If looping back, suggest the target stage here. Justification MUST be in 'thought'. */
  requested_stage_override?: RequestedStageOverride;
  /** Optional. If task is blocked/infeasible ('next_thought_needed: false'), provide a concise summary here. */
  issue_description?: string;
}

// --- Zod Schema for Input Validation ---
import { z } from 'zod';

export const OccamsRazorThinkingParamsSchema = z.object({
  thought: z.string().min(1, 'Thought cannot be empty.'),
  thought_number: z.number().int().positive('Thought number must be a positive integer.'),
  thinking_stage: z.nativeEnum(ThinkingStage), // Use nativeEnum for TS enums
  next_thought_needed: z.boolean(),
  user_request: z.string().optional(), // Required only on first call, handled in logic
  needs_clarification: z.boolean().optional(),
  clarification_questions: z.array(z.string()).optional(),
  user_clarification: z.string().optional(),
  requested_stage_override: z.nativeEnum(RequestedStageOverride).optional(), // Use nativeEnum
  issue_description: z.string().optional(),
});

// Infer the TypeScript type from the Zod schema (optional but good practice)
export type OccamsRazorThinkingParamsZod = z.infer<typeof OccamsRazorThinkingParamsSchema>;

// --- Response Types ---

/** Base structure for successful responses */
interface BaseSuccessResponse {
  thought_number: number; // Echoes the input thought number
}

/** Response when the next thinking step is required */
export interface NextThoughtResponse extends BaseSuccessResponse {
  status: 'NEXT_THOUGHT';
  action: 'next_thought';
  next_stage: ThinkingStage;
  prompt: string;
  next_thought_number: number; // The number for the *next* thought
}

/** Response when user clarification is needed */
export interface ClarificationNeededResponse extends BaseSuccessResponse {
  status: 'CLARIFICATION_NEEDED';
  action: 'clarification_needed';
  clarification_questions: string[]; // Corrected property name
}

/** Response when the process is completed successfully */
export interface CompletedResponse extends BaseSuccessResponse {
  status: 'COMPLETED';
  action: 'completed';
  final_thought: string; // Echoes the final thought provided by the LLM
}

/** Response when the process is blocked */
export interface BlockedResponse extends BaseSuccessResponse {
  status: 'BLOCKED';
  action: 'blocked';
  issue_description: string; // Echoes the issue description
  final_thought: string; // Echoes the detailed thought explaining the block
}

/** Response when a loopback request is accepted */
export interface LoopbackAcceptedResponse extends BaseSuccessResponse {
  status: 'LOOPBACK_ACCEPTED';
  action: 'loopback_accepted';
  next_stage: ThinkingStage; // The stage being looped back to
  prompt: string; // Specific prompt for the loopback stage
  next_thought_number: number; // The number for the *next* thought
}

/** Union type for all possible successful responses from the tool */
export type OccamsRazorThinkingResponse =
  | NextThoughtResponse
  | ClarificationNeededResponse
  | CompletedResponse
  | BlockedResponse
  | LoopbackAcceptedResponse; // Added Loopback response

/** Structure for error responses */
export interface ErrorResponse {
  status: 'ERROR';
  message: string;
  details?: any;
}