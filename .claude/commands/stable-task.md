---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(npm:*), Editor
description: Create and validate proper todo list before any implementation
---

## Your Task

Complete this development task:

#$ARGUMENTS

## MANDATORY TODO VALIDATION PROCESS

You MUST complete this validation process before writing ANY code.

### Phase 1: Create Initial Todo List

Create a todo list where each item represents exactly one small commit.

**Todo Requirements:**
- Each todo = one file change or one small logical feature
- Each todo should take 5-20 lines of code maximum
- Each todo must be independently committable
- Follow this pattern: "Add/Update/Remove [specific thing] in [specific file]"

### Phase 2: Todo Validation Agent

After creating your todo list, validate it using this agent:

**Todo Validation Agent:**

You are a senior engineering manager reviewing a development plan.
Your job is to ensure each todo item will result in a small, reviewable commit.

Review each todo item and check:
1. Is it small enough? (5-20 lines of code max)
2. Is it specific enough? (mentions exact files/components)
3. Is it independently committable?
4. Does it follow atomic change principles?

**Examples of BAD todos:**
- "Update ContactFormInner to use Turnstile instead of AntiBotService" (too big)
- "Add Turnstile integration" (too vague)
- "Update validation and form handling" (multiple concerns)

**Examples of GOOD todos:**
- "Add TurnstileService.ts with verifyToken method"
- "Add Turnstile React component in components/Turnstile.tsx" 
- "Update ContactFormValidator to accept turnstileToken field"
- "Remove antiBotData validation from ContactFormValidator"
- "Update ContactFormInner to import and render Turnstile component"
- "Remove AntiBotService import from ContactFormInner"

For each todo, respond:
- "✅ Good todo - appropriately sized and specific"
- "❌ Bad todo - [specific reason why it's too big/vague/complex]"

Then provide overall assessment:
- "✅ Todo list approved - proceed with implementation"  
- "❌ Todo list needs revision - fix the marked items and re-validate"

### Phase 3: Todo Revision (if needed)

If the validation agent rejects your todo list:
1. Fix the specific issues identified
2. Re-run the validation agent
3. Repeat until approved

### Phase 4: Implementation (only after approval)

Once your todo list is approved:
1. Execute todos one by one
2. Run quality checks after each todo:
   ```bash
   npm run format
   npm run lint
   npm run build
   npm run test:all
   ```
3. Create proper commit for each todo completion

### Commit Message Process

Before committing each todo, gather context:
- Run: `git status`
- Run: `git diff HEAD` 
- Run: `git branch --show-current`
- Run: `git log --oneline -10`

Create conventional commit with this format:
```
<type>: <brief description>

<detailed body with:>
- Problems solved
- Implementation decisions and reasoning  
- Effects on codebase
- What changed and why
```

**Commit Types:**
- `feat` - New features or functionality
- `fix` - Bug fixes
- `refactor` - Code restructuring without behavior change
- `test` - Adding or updating tests
- `chore` - Maintenance tasks, dependency updates
- `docs` - Documentation updates
- `style` - Code formatting, whitespace changes

**Example Good Commit:**
```
feat: add TurnstileService with token verification

- Added TurnstileService.ts following existing service patterns
- Implements verifyToken method with Cloudflare API integration
- Returns Result<boolean> type matching codebase error handling
- Includes proper TypeScript interfaces for API response
- Added fail-open behavior for empty tokens as specified
```

## START WITH PHASE 1

Create your initial todo list now.