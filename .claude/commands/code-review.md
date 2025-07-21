---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Editor
description: Complete task following codebase patterns and quality standards
---

## Your Task
#$ARGUMENTS

## CRITICAL: Follow Codebase Patterns

Before writing ANY code, you MUST:
1. Examine existing test patterns in the codebase 
2. Use the same assertion patterns (assert, expect structure)
3. Follow existing service/component patterns
4. Match existing error handling patterns

Use these standards from my ~/.claude/ directory:
- @~/.claude/CODE_QUALITY.md
- @~/.claude/ARCHITECTURE.md  
- @~/.claude/SECURITY.md

## Quality Process
- Write tests first using existing patterns
- Run quality checks after each change: npm run format, lint, build, test:all
- Make small, frequent commits
- Follow conventional commit format