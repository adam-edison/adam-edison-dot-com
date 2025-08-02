# Code Style Rules

This file contains specific code style rules and formatting guidelines for this project.

## Vertical Spacing for Readability

**Use blank lines to separate logical blocks of code for better readability:**

**Preferred (with spacing):**
```typescript
const initializeService = async () => {
  const result = await contactService.initialize();

  if (!result.success) {
    logger.error('Failed to initialize contact service:', result.error);
    setConfigStatus('error');
    return;
  }

  setConfigStatus('ready');
};
```

**Avoid (without spacing):**
```typescript
const initializeService = async () => {
  const result = await contactService.initialize();
  if (!result.success) {
    logger.error('Failed to initialize contact service:', result.error);
    setConfigStatus('error');
    return;
  }
  setConfigStatus('ready');
};
```

**Guidelines:**
- Add blank lines after variable declarations before the main logic
- Add blank lines before return statements in guard clauses
- Add blank lines after error handling blocks before the happy path
- Separate logical groups of operations with blank lines
- Use vertical spacing to create visual "paragraphs" in your code

**Rationale:**
- **Improved readability** - code is easier to scan and understand
- **Visual separation** - logical blocks are clearly distinguished
- **Reduced cognitive load** - the eye can quickly identify different sections
- **Better code review** - reviewers can follow the flow more easily