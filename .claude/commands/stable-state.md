---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(npm:*), Editor
description: Run comprehensive quality checks and fix any issues using root cause analysis
---

## Your Task

Run quality checks and fix any issues found:

```bash
npm run format
npm run lint
npm run build
npm run test:all
```

Fix any issues based upon the root cause analysis.

## CRITICAL CONSTRAINTS

- **NO deleting tests** - Tests exist for a reason and must remain
- **NO skipping tests** - All tests must pass, no commenting out or skipping
- **NO circumventing test intent** - Fix the underlying issue, don't change test expectations unless truly incorrect

## ROOT CAUSE ANALYSIS APPROACH

Think about the changes made on this branch systematically:

### 1. Start with Recent Changes

- Consider the **most recent changes first** - what was modified last?
- Check git history: `git log --oneline -10` and `git diff HEAD~1`
- Recent changes are the most likely culprits

### 2. Apply "Horses Before Zebras" Principle

Think of the **simplest possible cause** first before considering complex scenarios:

**Simple causes to check first:**

- Syntax errors, typos, missing imports
- File path changes that broke imports
- Missing dependencies or version mismatches
- Simple type mismatches
- Formatting issues (spaces, line endings)
- Environment/configuration changes

**Complex causes to consider later:**

- Deep architectural conflicts
- Complex race conditions
- Obscure browser compatibility issues
- Complex async timing problems

### 3. Systematic Debugging Process

For each failing check, follow this order:

1. **Read the error message carefully** - what exactly is failing?
2. **Identify the specific file/line** where the issue occurs
3. **Check recent changes to that file** - was it modified recently?
4. **Look for simple fixes first:**
   - Missing imports/exports
   - Typos in variable/function names
   - Incorrect file paths
   - Type annotation issues
5. **If simple fixes don't work, go deeper:**
   - Check dependencies and versions
   - Look for breaking changes in updated packages
   - Consider interaction between recent changes

### 4. Quality Check Order

Run checks in this order and fix issues before proceeding:

1. **Format first:** `npm run format`
   - Fixes code style issues automatically
   - May resolve some linting issues

2. **Lint second:** `npm run lint`
   - Catches code quality and style issues
   - Fix these before build issues

3. **Build third:** `npm run build`
   - Catches type errors and compilation issues
   - Must pass before running tests

4. **Test last:** `npm run test:all`
   - Runs all test suites
   - Tests should only be run on working code

### 5. Common Issue Patterns

**When format fails:**

- Check for syntax errors that prevent parsing
- Look for malformed code from recent edits

**When lint fails:**

- Usually simple rule violations
- Check for unused variables, missing types
- Verify import/export consistency

**When build fails:**

- Type errors are most common
- Missing imports/exports
- Path resolution issues after file moves

**When tests fail:**

- Changed function signatures
- Modified return types or behavior
- Missing test dependencies
- Environment setup issues

### 6. Fix Strategy

For each issue found:

1. **Understand the root cause** - don't just fix symptoms
2. **Make minimal changes** - change as little as possible to fix the issue
3. **Verify the fix** - re-run the specific check that was failing
4. **Consider side effects** - will this fix break something else?

## Implementation Process

1. **Start with git status** to understand current state
2. **Run each quality check individually** and fix issues before proceeding
3. **For each failure:**
   - Read error message completely
   - Identify the specific problem
   - Check recent changes that might have caused it
   - Apply simplest fix first
   - Verify fix works
4. **Re-run all checks** to ensure no regressions
5. **Commit the fixes** with clear explanation of what was fixed and why

## Example Debugging Flow

```bash
# Check current state
git status
git log --oneline -5

# Run checks one by one
npm run format
# If fails: fix syntax errors, malformed code

npm run lint
# If fails: fix unused variables, missing types, import issues

npm run build
# If fails: fix type errors, missing imports, path issues

npm run test:all
# If fails: fix changed signatures, missing mocks, test setup
```

## Commit Message for Fixes

When committing fixes, use this format:

```
fix: resolve quality check failures in [area]

Root cause analysis:
- Recent changes to [specific files] caused [specific issue]
- Fixed by [minimal change description]
- Simple cause: [what the actual problem was]

Quality checks now passing:
- ✅ Format
- ✅ Lint
- ✅ Build
- ✅ Tests
```

## START NOW

Begin by running `git status` and `git log --oneline -10` to understand recent changes, then run the quality checks one by one.
