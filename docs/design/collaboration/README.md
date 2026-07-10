# Collaboration Design Index

このディレクトリは、協業運用に関する一次情報への導線だけを持ちます。
運用ルール本文をここに重複記載しないことで、乖離を防ぎます。

## Collaboration Primary Sources

### Design Documents
- docs/design/task-kit-agent-plugin-design-delta-v1.0.md
- docs/design/task-kit-template-enhancement-design-delta-v1.0.md

### Agent Definitions
- .github/agents/expert-prompt-engineer.agent.md
- .github/agents/expert-software-engineer.agent.md
- .github/agents/requirements-spec-coordinator.agent.md
- .github/agents/solution-designer.agent.md
- .github/agents/document-author.agent.md
- .github/agents/document-reviewer.agent.md
- templates/github/agents/task-kit.task.agent.md
- templates/github/agents/task-kit.review.agent.md

### Instructions
- .github/instructions/commit-message.instructions.md
- .github/instructions/common-quality.instructions.md
- .github/instructions/japanese-response.instructions.md
- .github/instructions/prompt-frontmatter.instructions.md
- .github/instructions/pull-request.instructions.md
- .github/instructions/pull-request-title.instructions.md

### Skills
- .github/skills/document-review-minimum.SKILL.md

### Prompts
- .github/prompts/codex-collaboration.prompt.md
- templates/github/prompts/task-kit.new-task.prompt.md
- templates/github/prompts/task-kit.task-update.prompt.md
- templates/github/prompts/task-kit.plan-update.prompt.md
- templates/github/prompts/task-kit.task-execute.prompt.md
- templates/github/prompts/task-kit.review.prompt.md
- templates/github/prompts/task-kit.issue-consult.prompt.md

### Terminology Governance
- docs/terminology/term-governance.md
- docs/terminology/misuse-log.md

### Templates
- .github/PULL_REQUEST_TEMPLATE.md
- .github/ISSUE_TEMPLATE/change-request.md
- .github/ISSUE_TEMPLATE/bug-report.md
- .github/ISSUE_TEMPLATE/documentation-change.md
- docs/templates/common-agent-input-template.md
- docs/templates/solution-design-template.md
- docs/templates/team-review-record-template.md
- templates/.task-kit/templates/tasks/task.md
- templates/.task-kit/templates/tasks/plan.md
- templates/.task-kit/templates/tasks/issue.md
- templates/.task-kit/templates/tasks/handoff.md
- templates/.task-kit/templates/tasks/records/findings.md
- templates/.task-kit/templates/tasks/records/scratchpad.md

## Update Policy
1. 仕様や運用の変更は、上記の一次情報ファイルのみ更新する。
2. このファイルには要約や再記述を追加しない。
3. 参照先パスの変更時のみ、このファイルを更新する。
