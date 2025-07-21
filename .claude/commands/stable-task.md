---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(npm:*), Editor
description: Complete task in small commits following codebase patterns
---

## Your Task

Complete this development task:

#$ARGUMENTS

## Follow Codebase Patterns

Before writing code, examine existing similar code for:
- Assertion patterns in tests
- Service/component structure  
- Error handling approaches
- File organization

Apply standards from ~/.claude/ files:
- @~/.claude/CODE_QUALITY.md
- @~/.claude/ARCHITECTURE.md  
- @~/.claude/SECURITY.md

## Work in Small Increments

Make one small, logical change at a time. Examples of good increments:
- Add a new service method
- Update a component to use new service
- Fix failing tests
- Add new test coverage
- Remove old code

## Quality Process for Each Increment

1. Make your small change
2. Run quality checks (fix any failures):
   ```bash
   npm run format
   npm run lint
   npm run build
   npm run test:all
   ```
3. Commit with conventional format and detailed body
4. Move to next increment

## Critical Rules

- ❌ No giant commits with multiple unrelated changes
- ❌ No elaborate planning or todo lists
- ✅ Work incrementally - one logical change per commit
- ✅ Run tests after each change, fix what breaks
- ✅ Follow existing code patterns exactly
- ✅ Commit frequently with good messages

## Start Implementation

Begin with the first logical increment of your task.