---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(npm:*), Editor
description: Complete development task using TDD approach with proper testing and commit workflow
---

## Your Task

Complete this development task:

#$ARGUMENTS

## Required Process - Follow Every Step

**IMPORTANT**: Execute each step completely before moving to the next. Do not skip steps or combine them.

### Step 1: Planning and Assessment
1. Analyze the current codebase structure and existing tests
2. Identify what needs to be changed to complete the task
3. Plan the sequence of small, incremental changes
4. Identify existing tests that will need updates
5. Plan new tests that will be needed

### Step 2: TDD Implementation Cycle
For each planned change, follow this exact cycle:

**2.1 Test First**
- Write or update tests for the expected behavior BEFORE implementing
- Ensure tests fail initially (red phase)
- Use existing test patterns and setup from the codebase
- Prefer contract tests with supertest over server startup
- Use Playwright e2e tests only when contract tests aren't sufficient

**2.2 Implement**
- Make the minimal code changes to make tests pass (green phase)
- Keep changes small and focused

**2.3 Quality Checks**
Run these commands in exact order. If ANY command fails, fix the issue and restart from the beginning:

```bash
npm run format
npm run lint  
npm run build
npm run test:all
```

**Critical Rule**: You MUST NOT:
- Remove tests
- Skip tests  
- Comment out tests
- Bypass test failures

If tests fail, find the root cause and fix it properly.

**2.4 Commit Changes**
Before committing, gather context:
- Run: `git status`
- Run: `git diff HEAD` 
- Run: `git branch --show-current`
- Run: `git log --oneline -10`

Create a conventional commit with format:
```
<type>: <brief description>

<detailed body explaining:>
- Problems solved
- Implementation decisions and reasoning  
- Effects on codebase
- What changed and why
```

Use appropriate type: feat, fix, chore, refactor, test, docs, style

### Step 3: Verification and Completion
- Verify all requirements are met
- Confirm all tests pass
- Ensure codebase is in stable state
- Push final changes

## Execution Guidelines

- Work incrementally with frequent small commits
- Do not start servers to test - use automated tests only  
- Fix any linting, formatting, or build issues immediately
- Ask for clarification only when requirements are genuinely unclear
- Do not provide status updates unless blocked and need user intervention