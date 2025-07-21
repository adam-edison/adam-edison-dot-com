---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash:git log:*), Bash(git diff:*), Bash(npm:*), Editor
description: Implement code review fixes from markdown file systematically
---

## Your Task

Implement the fixes specified in this code review file:

#$ARGUMENTS

## MANDATORY PROCESS

You MUST follow this exact process for implementing code review fixes.

### Phase 1: Parse Code Review File

1. **Read and analyze the provided markdown file**
2. **Extract numbered fix items that need implementation:**
   - ✅ **Skip items with ✅** (already completed)
   - ✅ **Skip items with ⏭️** (intentionally skipped)
   - ✅ **Only implement items without these markers**
3. **Identify the scope of each remaining fix** (which files/systems need changes)
4. **Plan the order of implementation** (dependencies, logical sequence)

### Item Filtering Rules

**Items to SKIP:**

- Any line containing both a number/title AND ✅ (completed)
- Any line containing both a number/title AND ⏭️ (skipped)

**Items to IMPLEMENT:**

- Numbered items without ✅ or ⏭️ markers
- Items marked with ❌ (needs fixing)

**Examples:**

```
#### 1. Missing CSRF Protection ✅
- SKIP: Already completed

#### 2. No Content Security Policy (CSP) Headers ⏭️
- SKIP: Intentionally skipped

#### 3. Missing Security Headers
- IMPLEMENT: No completion/skip markers

#### ❌ 4. Turnstile Token Replay Attack Vulnerability
- IMPLEMENT: Marked as needing fix
```

### Phase 2: Implementation Strategy

**Work through each numbered fix item that needs implementation:**

- **Filter out completed (✅) and skipped (⏭️) items**
- Treat each remaining numbered item as one logical commit
- Implement the complete fix described in that item
- Include all related changes needed for that specific fix
- Work sequentially through remaining items

### Phase 3: Implementation Process

For each numbered fix item:

1. **Implement the complete fix:**
   - Make all changes required for this specific item
   - Follow existing codebase patterns and your ~/.claude/ standards
   - For new code, write comprehensive tests covering:
     - Happy path scenarios (expected behavior)
     - Unhappy path scenarios (error conditions)
     - Edge cases (boundary conditions, null/undefined inputs)
     - Integration scenarios (how it works with existing code)

2. **Quality checks:**

   ```bash
   npm run format
   npm run lint
   npm run build
   npm run test:all
   ```

3. **Commit the fix:**
   - Gather context: `git status`, `git diff HEAD`, `git branch --show-current`
   - Create conventional commit referencing the specific fix item

### Phase 4: Commit Message Format

For each fix implementation, use this commit format:

```
<type>: <brief description referencing fix item>

Implements code review fix: [Item description from review]

- What was implemented to address the security/architecture/quality issue
- Why this approach was chosen
- Implementation details and key files changed
- How this fix improves security/architecture/quality

Addresses: [specific item number or description from code review]
```

**Example commit:**

```
security: implement CSRF protection for contact form API

Implements code review fix: Missing CSRF Protection

- Added CSRF token validation middleware to /api/contact endpoint
- Integrated with Next.js built-in CSRF protection
- Updated ContactForm component to include CSRF token in submissions
- Added proper error handling for CSRF validation failures
- Key files: /api/contact.ts, ContactForm.tsx, middleware.ts

This prevents cross-site request forgery attacks by ensuring
all form submissions include a valid CSRF token.

Addresses: Security Review item #1 - Missing CSRF Protection
```

### Test Requirements for New Code

When implementing fixes that add new functionality:

**Required test scenarios:**

- **Happy Path**: Normal operation with valid inputs
- **Error Handling**: Invalid inputs, network failures, API errors
- **Edge Cases**: Empty strings, null/undefined, boundary values
- **Security Cases**: Test the specific security vulnerability being fixed

**Test patterns to follow:**

- Examine existing similar tests for assertion patterns
- Use same mocking strategies as existing tests
- Follow existing test file organization and naming
- Include security-specific test cases for security fixes

### Execution Guidelines

- **Parse and filter items first** - identify which items need implementation
- **Work sequentially** through remaining numbered items (skip ✅ and ⏭️)
- **Complete each item fully** before moving to the next
- **Don't implement items marked as completed (✅) or skipped (⏭️)**
- **Reference the original code review** in commit messages
- **Test security fixes thoroughly** with both positive and negative test cases
- **Move to next item** without stopping for approval between items

## START IMPLEMENTATION

Begin by parsing the code review file, filtering out completed/skipped items, and implementing the first remaining numbered fix item.
