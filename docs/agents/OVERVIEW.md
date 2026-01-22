# AI Agents Overview

## Purpose

AI agents provide specialized code review and architectural guidance. Each agent has a focused role and specific rules.

## Available Agents

| Agent         | Focus                                    |
| ------------- | ---------------------------------------- |
| **Architect** | Structure, layers, dependencies          |
| **Developer** | Code quality, TypeScript, patterns       |
| **Tester**    | Coverage, test quality, E2E              |
| **Design**    | UI consistency, tokens, accessibility    |

## How to Use

### In Code Review

Request specific agent review:

```
@architect Review the folder structure and layer dependencies
@developer Check TypeScript types and SOLID compliance
@tester Analyze test coverage and suggest edge cases
@design Review component consistency and accessibility
```

### In Pull Requests

Add agent mention in PR description or comments for focused review.

## Agent Definitions

- [Architect Agent](ARCHITECT.md)
- [Developer Agent](DEVELOPER.md)
- [Tester Agent](TESTER.md)
- [Design Agent](DESIGN.md)

## Integration with Copilot

Agents are defined as personas that Copilot can adopt. Reference the specific agent document when you need that type of review.

Example prompt:

```
Acting as the @architect agent defined in docs/agents/ARCHITECT.md,
review this PR for architectural compliance.
```
