# Occam's Razor Thinking Tool - MCP Server

**Version:** 0.1.0 (Initial Implementation)

This project implements the **Occam's Razor Thinking Tool** as a stateless MCP (Model Context Protocol) server, designed to be run easily via `npx`.

Based on the specifications in `PRD.md` and `README.md` (in the parent directory), this tool guides Large Language Models (LLMs) through a structured, sequential thinking process for coding tasks:

1.  **Context Analysis:** Understand the project environment.
2.  **Outcome Definition:** Define the minimal viable goal.
3.  **Solution Exploration:** Generate multiple potential approaches.
4.  **Simplicity Evaluation:** Apply Occam's Razor to choose the simplest effective solution.
5.  **Implementation:** Execute the chosen plan, focusing on simplicity.

The goal is to promote simpler, more maintainable, and better-aligned code generation from LLMs.

## Features

*   Implements the `occams_razor_thinking` MCP tool.
*   Stateless server design.
*   Handles sequential stage progression.
*   Supports user clarification requests.
*   Supports loopbacks to earlier stages (e.g., re-exploring solutions after evaluation).
*   Handles successful completion and blocked/infeasible task states.
*   Designed for execution via `npx`.

## Usage (via NPX)

Once published to NPM under a chosen package name (e.g., `@your-npm-username/occams-razor-mcp`), you can run the server directly using `npx`:

```bash
npx <your-package-name>
```

The server will start and listen for MCP requests on standard input (stdin) and send responses to standard output (stdout). Integrate this with your MCP client application (e.g., IDE plugin, chat interface).

*(Replace `<your-package-name>` with the actual name used for publishing).*

## Development Setup

1.  **Clone the repository (if applicable):**
    ```bash
    # git clone <repository-url>
    # cd occams-razor-mcp-server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Build the project (compile TypeScript):**
    ```bash
    npm run build
    ```
4.  **Run the server locally (using compiled code):**
    ```bash
    npm start
    ```
    Alternatively, run directly using `ts-node` or similar for development:
    ```bash
    # npm install -g ts-node (if not installed)
    # ts-node src/server.ts
    ```
5.  **Run tests:**
    ```bash
    npm test
    ```
6.  **Lint and Format:**
    ```bash
    npm run lint
    npm run format
    ```

## Project Structure

*   `src/`: TypeScript source code.
    *   `server.ts`: Main server entry point, handles MCP communication.
    *   `logic.ts`: Core state machine logic for the tool.
    *   `prompts.ts`: Guidance prompts for each thinking stage.
    *   `types.ts`: TypeScript interfaces and enums.
*   `dist/`: Compiled JavaScript output (after running `npm run build`).
*   `tests/`: Jest test files.
*   `package.json`: Project metadata, dependencies, and scripts.
*   `tsconfig.json`: TypeScript compiler configuration.
*   `jest.config.cjs`: Jest test runner configuration.
*   `.eslintrc.js`: ESLint configuration.
*   `.prettierrc.js`: Prettier configuration.

## License

MIT License (See `package.json` or original project `README.md`)