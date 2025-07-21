---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Complete the task and verify stable state before commit
---

## Your task

Do the following in this exact order.

1. Follow the instructions that were given to you:
   #$ARGUMENTS

   If it is possible to do so, use a TDD approach, writing automated tests first.
   Do not attempt starting the server in order to verify behavior - instead use an e2e test(with playwright) or a contract test (with supertest) if necessary.

2. When you are finished with each current todo, run the following in order, one by one.
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
