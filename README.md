# Occam's Razor Thinking Tool - MCP Server

An MCP (Model Context Protocol) server providing a structured thinking tool for LLMs.

## Overview

This server exposes a single tool, `occams_razor_thinking`, designed to guide Large Language Models (LLMs) through a systematic, step-by-step process for tackling constructive coding tasks (e.g., adding features, implementing algorithms) within MCP clients (e.g., Cline, Claude Desktop, Cursor).

## Problem Solved

Large Language Models (LLMs), despite their advanced capabilities, can generate overly complex or suboptimal solutions for coding tasks, often neglecting simpler, more maintainable alternatives. They might also rush into implementation without fully analyzing the project context or defining the precise goal. This can lead to code that is difficult to maintain, doesn't fit the existing architecture, or doesn't solve the actual user need.

## Solution: The `occams_razor_thinking` Tool

This server provides the `occams_razor_thinking` tool, which enforces a structured cognitive workflow inspired by effective problem-solving methodologies and the principle of Occam's Razor (prioritizing simplicity). It guides the LLM through distinct stages before implementation:

1.  **Context Analysis:** Analyze the existing project context (code structure, patterns, constraints).
2.  **Outcome Definition:** Clearly define the minimal viable outcome required.
3.  **Solution Exploration:** Generate multiple potential solutions, prioritizing simplicity and reuse.
4.  **Simplicity Evaluation:** Critically evaluate solutions based on simplicity and effectiveness.
5.  **Implementation:** Implement only the chosen simplest effective solution.

This structured approach aims to improve the quality, simplicity, maintainability, and contextual relevance of LLM-generated code. The tool also includes mechanisms for handling user clarification and looping back if initial solutions are inadequate.

## Tool: `occams_razor_thinking`

**Description:** Guides systematic problem-solving for coding tasks using Occam's Razor. Breaks down problems into sequential steps (Context, Outcome, Explore, Evaluate, Implement) prioritizing simplicity. Call this tool sequentially, providing your 'thought' (reasoning/output) for the current step.

**Input Parameters:** (Refer to `src/types.ts` or PRD for full details)

*   `thought` (string, required): Detailed thinking/analysis for the current stage.
*   `thought_number` (integer, required): Sequential number of the thought (starts at 1).
*   `thinking_stage` (enum, required): The current stage (`context_analysis`, `outcome_definition`, etc.).
*   `next_thought_needed` (boolean, required): `true` to continue, `false` to terminate.
*   `user_request` (string, required on first call): The original user request.
*   `needs_clarification` (boolean, optional): Set to `true` if user input is needed.
*   `clarification_questions` (array, optional): Questions for the user if `needs_clarification` is true.
*   `user_clarification` (string, optional): User's response to previous clarification request.
*   `requested_stage_override` (enum, optional): Target stage for loopback (e.g., `solution_exploration`).
*   `issue_description` (string, optional): Summary if task is blocked/infeasible.

## Use Cases

*   **Feature Implementation:** Guiding an LLM to add a new feature, ensuring it considers context and chooses a simple approach.
    *   *Example Prompt:* "Using the Occam's Razor tool, add a dark mode toggle button to the application header."
*   **Algorithm Implementation:** Implementing a specific function or algorithm while prioritizing clarity and efficiency.
    *   *Example Prompt:* "Follow the Occam's Razor process to implement a function that finds the median value in a list of numbers."
*   **Structured Code Generation:** Ensuring generated code snippets or components fit well within an existing project structure.
    *   *Example Prompt:* "Analyze the context, define the outcome, explore, evaluate, and then implement a simple React component for displaying user profiles, using the Occam's Razor tool."

## Installation & Setup

This server requires Node.js (version 16 or higher recommended). It is published on NPM and designed to be run via `npx`.

**Step 1: Configure Your MCP Client**

Add the following JSON block within the `"mcpServers": {}` object in your client's configuration file. Choose the file corresponding to your client and operating system:

**Configuration Block:**

```json
    "occams-razor": {
      "command": "npx",
      "args": ["--package", "@199bio/occams-razor-mcp", "occams-razor-mcp"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
```

*(Note: The `args` array uses the more explicit `npx --package <package_name> <command_name>` format which might be more reliable in some environments).*

**Client Configuration File Locations:**

*   **Claude Desktop:**
    *   macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
    *   Windows: `%APPDATA%\Claude\claude_desktop_config.json`
    *   Linux: `~/.config/Claude/claude_desktop_config.json` (Path may vary)
*   **VS Code Extension (Cline / "Claude Code"):**
    *   macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
    *   Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
    *   Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
*   **Cursor:**
    *   Global: `~/.cursor/mcp.json`
    *   Project: `.cursor/mcp.json` within your project folder.
*   **Windsurf:**
    *   `~/.codeium/windsurf/mcp_config.json`
*   **Other Clients:**
    *   Consult the specific client's documentation. The JSON structure above should generally work.

**Step 2: Restart Client**

After adding the configuration block and saving the file, fully restart your MCP client application. The first time the client starts the server, `npx` will automatically download the `@199bio/occams-razor-mcp` package if needed.

## Usage Example

Once installed and enabled, you can instruct your MCP client:

"Use the Occam's Razor tool to add a basic health check endpoint at `/health` that returns a 200 OK status."

The client's AI model should recognize the intent and initiate the multi-step process by calling the `occams_razor_thinking` tool, starting with the `context_analysis` stage.

## Developed By

This tool was developed as part of the initiatives at 199 Longevity, a group focused on extending the frontiers of human health and longevity.

Learn more about our work in biotechnology at [199.bio](https://199.bio).

Project contributor: Boris Djordjevic

## License

This project is licensed under the MIT License - see the `package.json` file for details.