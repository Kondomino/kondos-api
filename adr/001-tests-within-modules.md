# ADR 001: Tests Should Be Stored Within Their Modules

## Status

Accepted

## Context

In a modular NestJS application like kondos-api, we need to establish a clear testing strategy that promotes maintainability, modularity, and developer productivity. The question arises: where should test files be located in relation to the code they test?

There are several common approaches:
1. **Separate test directory**: All tests in a dedicated `test/` directory mirroring the source structure
2. **Tests within modules**: Test files co-located within the same directory as the code they test
3. **Mixed approach**: Some tests in modules, others in separate directories

Our codebase currently follows a modular structure with distinct feature modules (auth, kondo, user, media, etc.), each containing their own controllers, services, entities, and DTOs.

## Decision

**All tests should be stored within their respective modules, co-located with the source code they test.**

This means:
- Unit tests (`.spec.ts` files) should be placed in the same directory as the source files they test
- Integration tests should be placed within the module they primarily test
- End-to-end tests can remain in the dedicated `test/` directory as they test cross-module functionality

## Rationale

1. **Improved Developer Experience**: When working on a feature, developers can easily find and modify related tests without navigating to separate directory structures.

2. **Enhanced Modularity**: Each module becomes self-contained with its own tests, making it easier to understand, maintain, and potentially extract or refactor modules.

3. **Clearer Ownership**: Test ownership is immediately apparent - tests belong to the module they're testing.

4. **Simplified Refactoring**: When moving or renaming modules, tests move with them naturally.

5. **Better IDE Support**: Most IDEs can more easily associate tests with source files when they're co-located.

6. **Follows NestJS Conventions**: The NestJS CLI generates test files alongside source files by default.

## Implementation

Our current structure already follows this pattern:
```
src/
├── auth/
│   ├── auth.service.ts
│   ├── auth.service.spec.ts
│   └── ...
├── kondo/
│   ├── kondo.controller.ts
│   ├── kondo.controller.spec.ts
│   ├── kondo.service.ts
│   ├── kondo.service.spec.ts
│   └── ...
└── user/
    ├── user.controller.ts
    ├── user.controller.spec.ts
    ├── user.service.ts
    ├── user.service.spec.ts
    └── ...
```

Jest configuration supports this with:
- `rootDir: "src"` - Tests are discovered within the source directory
- `testRegex: ".*\\.spec\\.ts$"` - Matches `.spec.ts` files anywhere in the source tree

## Consequences

### Positive
- **Improved maintainability**: Tests and source code evolve together
- **Better module cohesion**: Each module is self-contained
- **Reduced cognitive load**: Developers don't need to navigate between separate directory structures
- **Simplified CI/CD**: Test discovery is automatic and follows source structure

### Negative
- **Slightly larger module directories**: Each directory contains both source and test files
- **Potential for test files to be accidentally included in production builds**: Mitigated by proper build configuration and `.dockerignore` rules

### Neutral
- **Different from some traditional approaches**: Some teams prefer separate test directories, but this is largely a matter of preference

## Compliance

This ADR formalizes our current practice. All existing tests already follow this pattern, and future tests should continue to do so.

New modules should include their test files within the module directory structure, following the naming convention `*.spec.ts` for unit tests and `*.integration.spec.ts` for integration tests.

## Related Decisions

- End-to-end tests will remain in the dedicated `test/` directory as they test system-wide functionality
- Build processes should exclude test files from production builds (already configured in `.dockerignore`)
