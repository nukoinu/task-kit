const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");

const repositoryRoot = path.resolve(__dirname, "..", "..");

const parityCases = [
  {
    skill: "task-kit-new-task",
    agent: "task-kit.task.agent.md",
    prompts: { "new-task": "task-kit.new-task.prompt.md" },
  },
  {
    skill: "task-kit-task-update",
    agent: "task-kit.task.agent.md",
    prompts: { "task-update": "task-kit.task-update.prompt.md" },
  },
  {
    skill: "task-kit-issue-consult",
    agent: "task-kit.task.agent.md",
    prompts: { "issue-consult": "task-kit.issue-consult.prompt.md" },
  },
  {
    skill: "task-kit-plan-update",
    agent: "task-kit.plan.agent.md",
    prompts: { "plan-update": "task-kit.plan-update.prompt.md" },
  },
  {
    skill: "task-kit-task-execute",
    agent: "task-kit.execute.agent.md",
    prompts: { "task-execute": "task-kit.task-execute.prompt.md" },
  },
  {
    skill: "task-kit-review",
    agent: "task-kit.review.agent.md",
    prompts: { review: "task-kit.review.prompt.md" },
  },
];

for (const parityCase of parityCases) {
  test(`${parityCase.skill} は Copilot agent と prompt の実行契約を省略せず保持する`, async () => {
    const skill = await readNormalized(
      path.join(repositoryRoot, "templates", "skills", parityCase.skill, "SKILL.md"),
    );
    const agent = stripFrontmatter(await readNormalized(
      path.join(repositoryRoot, "templates", "github", "agents", parityCase.agent),
    ));

    assert.equal(extractContract(skill, "agent"), agent.trim());

    for (const [id, promptFile] of Object.entries(parityCase.prompts)) {
      const prompt = stripFrontmatter(await readNormalized(
        path.join(repositoryRoot, "templates", "github", "prompts", promptFile),
      ));
      assert.equal(extractContract(skill, `prompt:${id}`), prompt.trim());
    }

    assert.doesNotMatch(skill, /(?:templates[\\/]github|\.github[\\/])/);
    assert.match(skill, /別製品のテンプレートを実行時に読んで補完しない/);
  });
}

test("すべての Copilot agent と prompt が同等性検証の対象になっている", async () => {
  const agentFiles = (await fs.readdir(
    path.join(repositoryRoot, "templates", "github", "agents"),
  )).filter((file) => file.startsWith("task-kit.") && file.endsWith(".agent.md")).sort();
  const promptFiles = (await fs.readdir(
    path.join(repositoryRoot, "templates", "github", "prompts"),
  )).filter((file) => file.startsWith("task-kit.") && file.endsWith(".prompt.md")).sort();

  assert.deepEqual([...new Set(parityCases.map((entry) => entry.agent))].sort(), agentFiles);
  assert.deepEqual(
    parityCases.flatMap((entry) => Object.values(entry.prompts)).sort(),
    promptFiles,
  );
});

test("6 skill はディレクトリ名と一致する frontmatter name を持つ", async () => {
  for (const parityCase of parityCases) {
    const skill = await readNormalized(path.join(repositoryRoot, "templates", "skills", parityCase.skill, "SKILL.md"));
    assert.match(skill, new RegExp(`^---\\nname: ${parityCase.skill}\\n`, "m"));
  }
});

test("実行セッションパッケージは Codex と Claude Code の呼び出し記法を定義する", async () => {
  const planSkill = await readNormalized(
    path.join(repositoryRoot, "templates", "skills", "task-kit-plan-update", "SKILL.md"),
  );
  const executeSkill = await readNormalized(
    path.join(repositoryRoot, "templates", "skills", "task-kit-task-execute", "SKILL.md"),
  );

  for (const skill of [planSkill, executeSkill]) {
    assert.match(skill, /\$task-kit-task-execute/);
    assert.match(skill, /\/task-kit-task-execute/);
  }
  assert.match(executeSkill, /\/task-kit\.task-execute/);
});

test("実行セッションパッケージはスラッシュコマンドをコードブロックの先頭行に置く", async () => {
  const planPrompt = await readNormalized(
    path.join(repositoryRoot, "templates", "github", "prompts", "task-kit.plan-update.prompt.md"),
  );
  const executePrompt = await readNormalized(
    path.join(repositoryRoot, "templates", "github", "prompts", "task-kit.task-execute.prompt.md"),
  );

  assert.match(planPrompt, /コードブロックの先頭行を `\/task-kit\.task-execute`/);
  assert.doesNotMatch(planPrompt, /コードブロックの先頭行は `## 実行セッションパッケージ`/);
  assert.match(executePrompt, /先頭行が `\/task-kit\.task-execute` のコードブロック/);
});

test("task-execute の直接呼出しは不足入力を同じセッションで確認する", async () => {
  const executeAgent = await readNormalized(
    path.join(repositoryRoot, "templates", "github", "agents", "task-kit.execute.agent.md"),
  );

  assert.match(executeAgent, /直接の呼出しも有効な実行開始として受理する/);
  assert.match(executeAgent, /現在のセッションで不足事項だけをまとめて利用者へ確認する/);
  assert.doesNotMatch(executeAgent, /直接の呼出しでは[^\n]*新しいセッションを開始/);
});

function extractContract(content, id) {
  const start = `<!-- task-kit-parity:${id}:start -->`;
  const end = `<!-- task-kit-parity:${id}:end -->`;
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);

  assert.notEqual(startIndex, -1, `${start} がありません`);
  assert.notEqual(endIndex, -1, `${end} がありません`);
  assert.ok(endIndex > startIndex, `${id} のマーカー順が不正です`);
  return content.slice(startIndex + start.length, endIndex).trim();
}

function stripFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n/, "");
}

async function readNormalized(filePath) {
  return (await fs.readFile(filePath, "utf8")).replaceAll("\r\n", "\n");
}
