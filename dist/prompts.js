import { ThinkingStage, RequestedStageOverride } from './types.js'; // Add .js extension
// Store prompts keyed by the *target* stage they are prompting *for*.
const prompts = {
    [ThinkingStage.OUTCOME_DEFINITION]: `"Now that you've analyzed the context, the next step is crucial for ensuring we build the right thing simply: Clearly define the desired outcome. Focus specifically on the *minimal viable* result required by the user's request *at this time*. Specify clear, measurable success criteria. If any part of the outcome remains ambiguous based on the request and context, explicitly list the questions needing user clarification. Ensure your definition is thorough before proceeding."`,
    [ThinkingStage.SOLUTION_EXPLORATION]: `"With a clear outcome defined, let's explore potential paths. Generate 2-3 distinct approaches to achieve this outcome. Start with the most direct and minimal approach possible. For others, consider different strategies but always evaluate if existing project patterns, abstractions, or components (identified during context analysis) can be effectively reused. Briefly outline the implementation strategy and key changes for each approach. Ensure your exploration covers a reasonable range of alternatives before proceeding."`,
    [ThinkingStage.SIMPLICITY_EVALUATION]: `"Now, critically evaluate the explored approaches using Occam's Razor principles. The goal is to find the *simplest* solution that is also *fully effective*. Compare the approaches based on: **Simplicity** (considering code directness, conceptual understandability, consistency with existing patterns, number/complexity of dependencies, estimated computational efficiency/directness, and the cost/benefit of reuse vs. new code) and **Effectiveness** (how robustly it meets the defined outcome, acknowledging any project constraints identified earlier). Justify your choice for the simplest *effective* approach by explaining why it strikes the best balance, and briefly explain why the other options were rejected (e.g., too complex, ineffective, poor fit). **Explicitly note any significant complexities you are consciously avoiding by selecting the recommended path.** If no approach offers a good balance, consider requesting a loop back to 'solution_exploration' with refined criteria. Ensure your evaluation is rigorous before proceeding."`,
    [ThinkingStage.IMPLEMENTATION]: `"The evaluation points to the simplest effective path. Now, proceed to implement this chosen solution. **Focus strictly on executing this plan.** Adhere only to the code, patterns, and logic necessary to achieve the defined outcome. Avoid introducing unrelated changes, premature abstractions, or unrequested features ('gold plating'). Prepare a concise summary of the implementation details upon completion. Ensure your implementation plan is clear before starting."`,
    // Special prompt for staying in the implementation stage (refinement)
    [`${ThinkingStage.IMPLEMENTATION}_refinement`]: `"Review the code you've just implemented. Does it faithfully represent the simplest effective approach chosen earlier? **If any minor clarifications or constraints emerged during implementation, ensure the code adapts appropriately without introducing significant new complexity.** Could any part be further simplified while still fully meeting the outcome? If the implementation is complete, minimal, and effective, summarize the key changes made and set 'next_thought_needed' to false. If further refinement or adaptation is needed, describe the specific next implementation step required."`,
    // Special prompt for looping back to solution exploration from evaluation
    [`${ThinkingStage.SOLUTION_EXPLORATION}_loopback_from_evaluation`]: `"Your evaluation indicated previous options were not sufficiently simple or effective. **Using the specific feedback from your evaluation (the reasons for rejection and complexities noted),** let's explore again. Generate 1-2 *new* or significantly revised approaches. Focus specifically on overcoming those previously identified limitations (e.g., finding ways to reduce complexity, improve effectiveness, enable better reuse, or work within constraints). Remember to leverage existing project abstractions where beneficial."`,
    // Prompt for reporting an issue (when next_thought_needed=false) - This might not be strictly needed as a prompt if termination is handled directly, but included for completeness.
    [ThinkingStage.REPORTING_ISSUE]: `"It seems the request cannot be completed as planned. Summarize the blocking issue clearly and concisely so it can be presented effectively to the user. Explain *why* the original request cannot be fulfilled as specified, referencing specific constraints or findings from your analysis if applicable. Set 'next_thought_needed' to false."`,
    // Add other loopback prompts if needed, e.g., loopback to outcome definition
    [`${ThinkingStage.OUTCOME_DEFINITION}_loopback_from_implementation`]: `"Implementation revealed a potential misunderstanding or issue with the defined outcome. **Based on the implementation challenges encountered (explain them in your thought),** let's revisit and refine the desired outcome. Clearly restate the outcome, incorporating necessary adjustments or clarifications. If user input is now needed, specify the questions."`
};
/**
 * Retrieves the appropriate guidance prompt string for the LLM based on the determined next thinking stage.
 *
 * This function selects the prompt based on:
 * - The target `nextStage`.
 * - Whether the process is looping back (`requestedLoopbackStage` is provided).
 * - Whether the process is continuing within the implementation stage (`isImplementationRefinement` is true).
 *
 * It also prepends any provided `userClarification` to the selected prompt.
 *
 * @param nextStage - The thinking stage the LLM is being prompted to enter next.
 * @param isImplementationRefinement - Flag indicating if the LLM is staying in the IMPLEMENTATION stage for refinement.
 * @param requestedLoopbackStage - The stage requested for loopback, used to select specific loopback prompts.
 * @param userClarification - Optional text provided by the user in response to a clarification request.
 * @returns The complete prompt string to be sent to the LLM. Returns an error message string if no prompt is found.
 */
export function getPrompt(nextStage, isImplementationRefinement, requestedLoopbackStage, userClarification) {
    let promptKey = nextStage;
    // --- Handle Specific Loopback Scenarios ---
    // Example: If looping back TO solution_exploration FROM evaluation
    if (nextStage === ThinkingStage.SOLUTION_EXPLORATION && requestedLoopbackStage === RequestedStageOverride.SOLUTION_EXPLORATION) {
        // We need to know the *source* stage to pick the right loopback prompt.
        // This requires passing the *current* stage from logic.ts into getPrompt,
        // or making the loopback prompt key more generic if only one loopback target exists per stage.
        // For now, let's assume the logic.ts knows the source or we use a specific key.
        // Let's refine this: logic.ts should determine the specific loopback scenario.
        // We'll adjust logic.ts to pass a specific loopback indicator if needed.
        // *Correction*: The PRD implies the loopback prompt is determined by the *target* stage when a loop occurs.
        // Let's assume a naming convention for loopback prompts based on target stage.
        // If a loopback *to* SOLUTION_EXPLORATION is requested and accepted, use the specific prompt.
        if (requestedLoopbackStage === RequestedStageOverride.SOLUTION_EXPLORATION) {
            promptKey = `${ThinkingStage.SOLUTION_EXPLORATION}_loopback_from_evaluation`; // Assuming this is the primary loopback TO exploration
        }
        // Add similar logic for other specific loopback prompts based on the target stage
        else if (requestedLoopbackStage === RequestedStageOverride.OUTCOME_DEFINITION) {
            promptKey = `${ThinkingStage.OUTCOME_DEFINITION}_loopback_from_implementation`;
        }
        // ... other loopback targets
    }
    // Handle refinement within implementation stage
    else if (nextStage === ThinkingStage.IMPLEMENTATION && !requestedLoopbackStage) {
        // Use refinement prompt if specifically indicated by logic.ts
        promptKey = isImplementationRefinement
            ? `${ThinkingStage.IMPLEMENTATION}_refinement`
            : ThinkingStage.IMPLEMENTATION;
    }
    let prompt = prompts[promptKey] || `"Error: No prompt defined for stage key: ${promptKey}"`;
    // --- Incorporate User Clarification (Optional Enhancement) ---
    if (userClarification) {
        // Prepend a note about the clarification to the standard prompt
        // Ensure the clarification text is properly escaped within the JSON string context if needed,
        // but here we assume it's just text to be included in the prompt string.
        const clarificationNote = `Received user clarification: '${userClarification.replace(/'/g, "\\'")}'. Please incorporate this into your thinking for the following step.\\n\\n`;
        // Remove surrounding quotes from the original prompt if they exist before prepending
        const basePrompt = prompt.startsWith('"') && prompt.endsWith('"') ? prompt.slice(1, -1) : prompt;
        prompt = `"${clarificationNote}${basePrompt}"`;
    }
    return prompt;
}
// TODO: Refine prompt selection logic, potentially requiring the 'currentStage' as input
// to better handle loopback prompt selection and implementation refinement prompts.
