---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Complete the task and verify stable state before commit
---

## Your task

Do the following in this exact order.

Do not stop to inform the user of your progress
unless you need clarification on requirements,
or require user intervention to continue
(e.g. adding environment variables to a `.env*` file).

1. This is your main goal:

#$ARGUMENTS

You must work in small pieces, so that you can make small stable commits as you work through the task at hand. Each commit must be stable, but working in small pieces leaves a commit trail that is easy to review.

If it is possible to do so, use a TDD approach.
First, consider existing tests where the expected behavior will change.
Second, consider additional tests you may need to write to verify new behavior.

Do not attempt starting the server in order to verify behavior.
Instead use an a contract test (with supertest).
And if that is not going to work due to visibility, consider an e2e test with playwright.

When writing tests, follow the existing setup and patterns in the codebase.

2. Before add files for each commit, run the following in order, one by one.

If there are problems reported from any command, fix those problems.
Then start again from the beginning of the command list (npm run format).

```bash
npm run format
npm run lint
npm run build
npm run test:all
```

If there are any failing tests you must find the root cause and fix it.
You MUST NOT remove tests, skip tests, or otherwise bypass any test case's intent.
Think hard about recent changes, how they may affect the tests, and consider the simplest fix first.

3. Commit and push the changes by using the following context and task:

Context:

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

Task:

Create a commit message following conventional commit format, choosing from one of these verbs that best fits the majority of the changes present (the most changed lines):

feat
fix
chore
refactor
test
docs
style

And the body of the commit should be detailed, including:

- Problems solved
- Decisions made
- Reasoning behind decisions made
- Effects of the changes on the codebase
- What was changed and why

The body can be a list of bullet points as is standard but should cover as much of the above as is relevant to the changes being committed.
