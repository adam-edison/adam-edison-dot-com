# Frontend Code Quality Rules

This file contains specific code quality rules and patterns for frontend development in this project.

## React useEffect with Async Functions

When using async functions inside `useEffect`, prefer the "early return" pattern for cleaner control flow:

**Preferred:**
```typescript
useEffect(() => {
  const asyncFunction = async () => {
    const result = await someAsyncOperation();

    if (result.success) {
      handleSuccess(result.data);
      return;
    }

    handleError(result.error);
  };

  asyncFunction();
}, [dependencies]);
```

**Avoid:**
```typescript
// Don't use if/else blocks when early return is cleaner
useEffect(() => {
  const asyncFunction = async () => {
    const result = await someAsyncOperation();

    if (result.success) {
      handleSuccess(result.data);
    } else {
      handleError(result.error);
    }
  };

  asyncFunction();
}, [dependencies]);

// Don't extract async functions outside useEffect (causes re-renders)
const asyncFunction = async () => { /* ... */ };
useEffect(() => {
  asyncFunction();
}, [asyncFunction]); // Bad: function recreated every render

// Don't use useCallback unless the function is used elsewhere
const asyncFunction = useCallback(async () => { /* ... */ }, [deps]);
useEffect(() => {
  asyncFunction();
}, [asyncFunction]); // Unnecessary complexity
```

## Error Handling: Fail Fast with Guard Clauses

**Always handle error cases first with early returns:**

```typescript
// Preferred: Guard clauses first
if (!result.success) {
  logger.error('Failed to initialize:', result.error);
  setConfigStatus('error');
  return;
}

// Happy path is clean and unindented
setConfigStatus('ready');
processSuccessfulResult(result.data);
```

**Avoid:**
```typescript
// Don't nest happy path inside success checks
if (result.success) {
  setConfigStatus('ready');
  processSuccessfulResult(result.data);
} else {
  logger.error('Failed to initialize:', result.error);
  setConfigStatus('error');
}
```

**Rationale:**
- **Fail fast principle** - handle problems immediately where they occur
- **Reduced cognitive load** - once past the guards, you know you're in a valid state
- **Cleaner happy path** - success logic isn't nested or mixed with error handling
- **Better debugging** - error conditions are explicit and handled upfront
- **Prevents deep nesting** - scales well when multiple error conditions exist