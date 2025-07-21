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

Create a todo list where each item represents one **logical, cohesive change** that can be reviewed as a unit.

**Todo Requirements:**

- Each todo = one logical feature/change that belongs together
- Each todo should result in a meaningful, reviewable commit
- Group related changes that serve the same purpose
- Follow this pattern: "[Action] [logical grouping] to [achieve goal]"

**Examples of GOOD logical groupings:**

- "Implement UserService with authentication logic and types"
- "Update form validation to use new validation schema"
- "Integrate payment component into checkout flow"
- "Replace legacy API calls with new GraphQL queries across user features"
- "Remove deprecated authentication system files and references"
- "Update documentation and environment configuration for new feature"

**Examples of BAD groupings:**

- "Add one import statement" (too granular)
- "Update entire application architecture" (too broad)
- "Fix validation and add component and update API" (multiple unrelated concerns)

### Phase 2: Todo Validation Agent

After creating your todo list, validate it using this agent:

**Todo Validation Agent:**

You are a senior engineering manager reviewing a development plan.
Your job is to ensure each todo item represents a logical, cohesive change that can be meaningfully reviewed.

Review each todo item and check:

1. Is it a complete logical unit? (implements one cohesive feature/change)
2. Are related changes grouped together? (files that change for the same reason)
3. Is it independently reviewable? (reviewer can understand the complete change)
4. Does it represent meaningful progress? (not just busy work)

**Examples of BAD todos:**

- "Add one import to UserComponent" (too granular)
- "Update everything to use new system" (too broad)
- "Add service and update API and change UI" (multiple unrelated concerns)

**Examples of GOOD todos:**

- "Implement UserService with authentication, error handling, and TypeScript types"
- "Update FormValidator to replace old validation with new schema validation"
- "Integrate PaymentComponent into CheckoutFlow with proper error states and loading"
- "Replace LegacyAPI with GraphQLAPI in all user management features"
- "Remove LegacyService files and clean up unused legacy references"

For each todo, respond:

- "✅ Good todo - represents logical, reviewable change"
- "❌ Bad todo - [specific reason: too granular/too broad/mixed concerns]"

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

1. Execute todos one by one as logical units
2. For each todo that adds new code:
   - **Write comprehensive tests covering:**
     - Happy path scenarios (expected behavior)
     - Unhappy path scenarios (error conditions)
     - Edge cases (boundary conditions, null/undefined inputs)
     - Integration scenarios (how it works with existing code)
   - Follow existing test patterns in the codebase
   - Use proper mocking for external dependencies
3. For each todo completion:
   - Run quality checks:
     ```bash
     npm run format
     npm run lint
     npm run build
     npm run test:all
     ```
   - Create one meaningful commit for the logical grouping
4. Move to next todo without stopping to ask the user for approval or giving a summary

### Test Requirements for New Code

**Required test scenarios:**

- **Happy Path**: Normal operation with valid inputs
- **Error Handling**: Invalid inputs, network failures, API errors
- **Edge Cases**: Empty strings, null/undefined, boundary values
- **Integration**: How new code interacts with existing systems

**Test patterns to follow:**

- Examine existing similar tests for assertion patterns
- Use same mocking strategies as existing tests
- Follow existing test file organization and naming
- Include both unit tests and integration tests where appropriate

**Example test coverage for a new service:**

```typescript
describe('UserService', () => {
  // Happy path
  it('should authenticate valid user credentials');
  it('should return user data on successful login');

  // Error handling
  it('should handle invalid credentials gracefully');
  it('should handle network timeouts');
  it('should handle malformed API responses');

  // Edge cases
  it('should handle empty email input');
  it('should handle extremely long passwords');
  it('should handle special characters in credentials');

  // Integration
  it('should work with existing session management');
  it('should integrate with existing error handling');
});
```

### Commit Message Process

Before committing each logical grouping, gather context:

- Run: `git status`
- Run: `git diff HEAD`
- Run: `git branch --show-current`
- Run: `git log --oneline -10`

Create conventional commit with this format:

```
<type>: <brief description of logical change>

<detailed body explaining:>
- What logical change was made
- Why this grouping of changes belongs together
- Implementation decisions and reasoning
- Effects on codebase
- Key files changed and their purpose
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
feat: implement user authentication service with JWT validation

- Added UserService.ts with complete authentication logic
- Includes TypeScript interfaces for auth API responses
- Implements token refresh and logout functionality
- Added proper error handling with Result<User> return type
- Follows existing service patterns for dependency injection
- Key files: UserService.ts, auth.d.ts, AuthError.ts

This establishes the core authentication logic that will be integrated
into the login flow and protected routes in subsequent commits.
```

## START WITH PHASE 1

Create your initial todo list now.
