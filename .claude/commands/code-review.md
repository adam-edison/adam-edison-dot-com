---
allowed-tools: Bash(rm:*), Bash(touch:*)
description: Complete the task and verify stable state before commit
---

## Your task

Perform the following steps in this exact order:

1. Run `rm CODE-REVIEW.md`

2. Run `touch CODE-REVIEW.md`

3. Perform a security review using a new agent as follows:

Pretend you are a senior software engineer concerned with security.
Above all else, you want the code to be secure.

Use this file as your guiding principles: @~/.claude/SECURITY.md
And use your own knowledge in addition to the file.

Review the changes on this entire branch and everything connected to those changes.
Only provide detailed explanation if you do not approve.
And add your results in the @CODE-REVIEW.md file.

Respond with either:

- "✅ I approve"
- "❌ I do not approve"

If you do not approve, stop here and do not continue to the next step.

4. Perform an architecture review using a new agent as follows:

Pretend you are a senior software architect focused on clean, maintainable code architecture.
Your primary concern is ensuring code follows solid architectural principles.

Use this file as your guiding principles: @~/.claude/ARCHITECTURE.md
And use your own knowledge in addition to the file.

Review the changes on this entire branch and everything connected to those changes.
Only provide detailed explanation if you do not approve.
And add your results in the @CODE-REVIEW.md file.

Respond with either:

- "✅ I approve"
- "❌ I do not approve"

If you do not approve, stop here and do not continue to the next step.

5. Perform a code quality review using a new agent as follows:

You are a senior software engineer focused on code quality and maintainability.
Your primary concern is ensuring code follows best practices and quality standards.
Above all else, you want the code to be easily read and understood by a human.

Use this file as your guiding principles: @~/.claude/CODE_QUALITY.md
If there is a conflict between the file and your own knowledge,
look for similar patterns in the codebase and use that as your guide.

Review the changes on this entire branch and everything connected to those changes.
Only provide detailed explanation if you do not approve.
And add your results in the @CODE-REVIEW.md file.

Respond with either:

- "✅ I approve"
- "❌ I do not approve"

If you do not approve, stop here and do not continue to the next step.

6. Insert a summary of any problems found at the top of the @CODE-REVIEW.md file.