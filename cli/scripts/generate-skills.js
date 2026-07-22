#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const contracts = {
  "task-kit-new-task": ["task-kit.task.agent.md", "task-kit.new-task.prompt.md", "new-task"],
  "task-kit-task-update": ["task-kit.task.agent.md", "task-kit.task-update.prompt.md", "task-update"],
  "task-kit-plan-update": ["task-kit.plan.agent.md", "task-kit.plan-update.prompt.md", "plan-update"],
  "task-kit-task-execute": ["task-kit.execute.agent.md", "task-kit.task-execute.prompt.md", "task-execute"],
  "task-kit-review": ["task-kit.review.agent.md", "task-kit.review.prompt.md", "review"],
  "task-kit-issue-consult": ["task-kit.task.agent.md", "task-kit.issue-consult.prompt.md", "issue-consult"],
};

const lintContract = [
  "## Markdown の検証",
  "",
  "- Markdown ファイルを作成または更新した場合は、リポジトリの Markdownlint 設定に従って変更対象を検証する。",
  "- 自動修正によって文書の意味、Task-Kit テンプレート構造、frontmatter、管理コメント、状態、受け入れ基準を変更してはならない。",
  "- 作業完了時には、今回作成・変更した Markdown へ Markdownlint 警告を残さない。意味上の変更が必要な場合は自動修正せず、停止または明示報告する。",
].join("\n");

async function main() {
  const skillsRoot = path.join(root, "templates", "skills");
  await fs.rm(skillsRoot, { recursive: true, force: true });
  for (const [skill, [agentFile, promptFile, operation]] of Object.entries(contracts)) {
    const agent = await readContract(path.join(root, "templates", "github", "agents", agentFile));
    const prompt = await readContract(path.join(root, "templates", "github", "prompts", promptFile));
    const content = [
      "---",
      `name: ${skill}`,
      `description: Task-Kit の ${operation} を Copilot と同じ自己完結契約で実行する。`,
      "---",
      "",
      `# ${skill}`,
      "",
      "## 製品別適用規則（最優先）",
      "",
      "- 以下の agent 契約と command 契約を両方適用し、手順、停止条件、状態遷移、出力契約を省略しない。",
      "- `#.task-kit/...` は添付済みと仮定せず、リポジトリ内の対応する `.task-kit/...` を直接読む。",
      "- 他 agent への委譲は、対応する新しい Task-Kit skill の呼び出しとして扱う。この skill 自身は直接実行する。",
      "- このファイルは自己完結した実行契約であり、別製品のテンプレートを実行時に読んで補完しない。",
      "",
      "### 論理操作と製品別呼び出し",
      "",
      "| 論理操作 | Copilot | Claude Code | Codex |",
      "| --- | --- | --- | --- |",
      "| new-task | `/task-kit.new-task` | `/task-kit-new-task` | `$task-kit-new-task` |",
      "| task-update | `/task-kit.task-update` | `/task-kit-task-update` | `$task-kit-task-update` |",
      "| plan-update | `/task-kit.plan-update` | `/task-kit-plan-update` | `$task-kit-plan-update` |",
      "| task-execute | `/task-kit.task-execute` | `/task-kit-task-execute` | `$task-kit-task-execute` |",
      "| review | `/task-kit.review` | `/task-kit-review` | `$task-kit-review` |",
      "| issue-consult | `/task-kit.issue-consult` | `/task-kit-issue-consult` | `$task-kit-issue-consult` |",
      "",
      "## Agent 契約",
      "",
      "<!-- task-kit-parity:agent:start -->",
      agent,
      "<!-- task-kit-parity:agent:end -->",
      "",
      "## Command 契約",
      "",
      `<!-- task-kit-parity:prompt:${operation}:start -->`,
      prompt,
      `<!-- task-kit-parity:prompt:${operation}:end -->`,
      "",
    ].join("\n");
    const skillFile = path.join(skillsRoot, skill, "SKILL.md");
    await fs.mkdir(path.dirname(skillFile), { recursive: true });
    await fs.writeFile(skillFile, content);
  }
}

async function readContract(filePath) {
  return (await fs.readFile(filePath, "utf8"))
    .replaceAll("\r\n", "\n")
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .trim();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
