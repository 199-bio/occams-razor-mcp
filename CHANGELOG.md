# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-05-04

### Changed

-   **Refactored server implementation to use `@modelcontextprotocol/sdk`'s base `Server` class and `setRequestHandler`.** This replaces manual stdin/stdout handling with the official SDK, improving robustness and MCP compliance.

### Fixed

-   Resolved multiple connection issues experienced with IDE clients (VS Code, Cursor) by ensuring correct MCP handshake and request handling via SDK usage.
-   Corrected type errors and SDK usage patterns.
-   Ensured tool parameter descriptions are correctly included in the `tools/list` response.

## [0.1.10] - 2025-05-04 [YANKED]

### Changed
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.11] - 2025-05-04

### Fixed

-   Reverted SDK server class import to base `Server` and ensured correct usage of `setRequestHandler` to resolve `Server does not support tools` error.

## [0.1.10] - 2025-05-04
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.10] - 2025-05-04

### Changed

-   Refactored server implementation to use `@modelcontextprotocol/sdk`'s base `Server` class and `setRequestHandler` for MCP compliance.

### Fixed

-   Resolved multiple connection issues experienced with IDE clients (VS Code, Cursor) by ensuring correct MCP handshake and request handling via SDK usage.
-   Corrected type errors and SDK usage patterns.
-   Ensured tool parameter descriptions are correctly included in the `tools/list` response.

## [0.1.9] - 2025-05-04 [YANKED]

### Changed
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.9] - 2025-05-04

### Changed

-   Refactored server implementation to use `@modelcontextprotocol/sdk`.
-   Corrected `server.tool()` signature and fixed related type errors.

### Fixed

-   Resolved multiple connection issues experienced with IDE clients (VS Code, Cursor) by ensuring MCP compliance via SDK usage.

## [0.1.8] - 2025-05-04 [YANKED]

### Changed
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.8] - 2025-05-04

### Changed

-   **Refactored server implementation to use `@modelcontextprotocol/sdk`.** This replaces manual stdin/stdout handling with the official SDK, improving robustness and MCP compliance.

### Fixed

-   Resolved multiple connection issues experienced with IDE clients (VS Code, Cursor):
    -   Server now correctly handles the MCP `initialize` handshake.
    -   Server ignores non-tool-request messages instead of failing validation.
    -   Corrected `initialize` response structure (`protocolVersion`, `serverInfo`, `tools`, `resources`).
    -   Fixed internal type inconsistencies related to response handling.

## [0.1.7] - 2025-05-04 [YANKED]

### Fixed

-   Corrected the structure of the `initialize` response (intermediate fix).

## [0.1.6] - 2025-05-04 [YANKED]

### Fixed
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.6] - 2025-05-04

### Fixed

-   Added handling for the standard MCP `initialize` request. The server now correctly responds with its capabilities, resolving client connection timeouts.

## [0.1.5] - 2025-05-04

### Added
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2025-05-04

### Added

-   Added diagnostic logging to stderr when the server's stdin stream closes, to help debug client connection issues.

## [0.1.4] - 2025-05-04

### Fixed
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2025-05-04

### Fixed

-   Resolved Zod validation errors when connecting from IDE clients (e.g., VS Code, Cursor) by making the server's input handler selectively validate only `occams_razor_thinking` tool requests and ignore other valid JSON messages like client handshakes.

## [0.1.3] - YYYY-MM-DD

### Added
- Initial release (Placeholder - update date if known)