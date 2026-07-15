const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const cliPath = path.resolve(__dirname, "..", "src", "index.js");
const templatesRoot = path.resolve(__dirname, "..", "..", "templates");

test("init は既定で Copilot と共通テンプレートを展開する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const result = runCli(targetRoot, "init");

  assert.equal(result.status, 0, result.stderr);
  await assertTemplateTree(path.join(templatesRoot, "github"), path.join(targetRoot, ".github"));
  await assertTemplateTree(path.join(templatesRoot, ".task-kit"), path.join(targetRoot, ".task-kit"));
  assert.equal(await pathExists(path.join(targetRoot, ".agents")), false);
  assert.equal(await pathExists(path.join(targetRoot, ".claude")), false);
});

test("init --codex は skills を .agents/skills に展開する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const result = runCli(targetRoot, "init", "--codex");

  assert.equal(result.status, 0, result.stderr);
  await assertTemplateTree(path.join(templatesRoot, "skills"), path.join(targetRoot, ".agents", "skills"));
  assert.equal(await pathExists(path.join(targetRoot, "AGENTS.md")), true);
  assert.equal(await pathExists(path.join(targetRoot, ".github")), false);
  const skill = await fs.readFile(path.join(targetRoot, ".agents", "skills", "task-kit-task", "SKILL.md"), "utf8");
  assert.doesNotMatch(skill, /\.github[\\/]/);
});

test("init --claude は skills を .claude/skills に展開する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const result = runCli(targetRoot, "init", "--claude");

  assert.equal(result.status, 0, result.stderr);
  await assertTemplateTree(path.join(templatesRoot, "skills"), path.join(targetRoot, ".claude", "skills"));
  assert.equal(await pathExists(path.join(targetRoot, "CLAUDE.md")), true);
  assert.equal(await pathExists(path.join(targetRoot, ".github")), false);
});

test("既存 AGENTS.md にはコメント付き管理区間を一度だけ追記する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const targetPath = path.join(targetRoot, "AGENTS.md");
  await writeFile(targetPath, "# 利用者の指示\n\n- 既存ルール\n");

  const first = runCli(targetRoot, "init", "--codex");
  const second = runCli(targetRoot, "init", "--codex", "--force");
  const content = await fs.readFile(targetPath, "utf8");

  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.match(content, /# 利用者の指示/);
  assert.equal(countMatches(content, "<!-- task-kit:codex:start -->"), 1);
  assert.equal(countMatches(content, "<!-- task-kit:codex:end -->"), 1);
});

test("既存 CLAUDE.md にはコメント付き管理区間を追記する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const targetPath = path.join(targetRoot, "CLAUDE.md");
  await writeFile(targetPath, "# 利用者の指示\n");

  const result = runCli(targetRoot, "init", "--claude");
  const content = await fs.readFile(targetPath, "utf8");

  assert.equal(result.status, 0, result.stderr);
  assert.match(content, /# 利用者の指示/);
  assert.match(content, /<!-- task-kit:claude:start -->/);
  assert.match(content, /<!-- task-kit:claude:end -->/);
});

test("init は既存ファイルの競合を終了コード5で通知する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const targetPath = path.join(targetRoot, ".github", "agents", "task-kit.task.agent.md");
  await writeFile(targetPath, "利用者の変更");

  const result = runCli(targetRoot, "init");

  assert.equal(result.status, 5);
  assert.equal(await fs.readFile(targetPath, "utf8"), "利用者の変更");
});

test("init --force は配布対象を上書きする", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const targetPath = path.join(targetRoot, ".github", "agents", "task-kit.task.agent.md");
  await writeFile(targetPath, "利用者の変更");

  const result = runCli(targetRoot, "init", "--force");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await fs.readFile(targetPath, "utf8"),
    await fs.readFile(path.join(templatesRoot, "github", "agents", "task-kit.task.agent.md"), "utf8"),
  );
});

test("init --sync は廃止資産を削除し、保護対象と他製品資産を維持する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const stalePath = path.join(targetRoot, ".github", "prompts", "task-kit.retired.prompt.md");
  const otherProductPath = path.join(targetRoot, ".github", "prompts", "other.prompt.md");
  const taskPath = path.join(targetRoot, "tasks", "task-kit.retired.md");
  const currentTaskPath = path.join(targetRoot, ".task-kit", "current-task.md");
  const profilePath = path.join(targetRoot, ".task-kit", "defaults", "user-profile.md");
  await Promise.all([
    writeFile(stalePath, "廃止資産"),
    writeFile(otherProductPath, "他製品"),
    writeFile(taskPath, "利用者タスク"),
    writeFile(currentTaskPath, "現在のタスク"),
    writeFile(profilePath, "利用者設定"),
  ]);

  const result = runCli(targetRoot, "init", "--sync");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await pathExists(stalePath), false);
  assert.equal(await fs.readFile(otherProductPath, "utf8"), "他製品");
  assert.equal(await fs.readFile(taskPath, "utf8"), "利用者タスク");
  assert.equal(await fs.readFile(currentTaskPath, "utf8"), "現在のタスク");
  assert.equal(await fs.readFile(profilePath, "utf8"), "利用者設定");
});

test("init --codex --sync は廃止 skill を削除し、利用者 skill を維持する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const stalePath = path.join(targetRoot, ".agents", "skills", "task-kit-retired", "SKILL.md");
  const userPath = path.join(targetRoot, ".agents", "skills", "user-skill", "SKILL.md");
  await Promise.all([writeFile(stalePath, "廃止"), writeFile(userPath, "利用者")]);

  const result = runCli(targetRoot, "init", "--codex", "--sync");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await pathExists(stalePath), false);
  assert.equal(await fs.readFile(userPath, "utf8"), "利用者");
});

test("init --force --sync は上書きと廃止資産削除を実行する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const managedPath = path.join(targetRoot, ".github", "agents", "task-kit.task.agent.md");
  const stalePath = path.join(targetRoot, ".task-kit", "templates", "tasks", "retired.md");
  await Promise.all([writeFile(managedPath, "利用者の変更"), writeFile(stalePath, "廃止資産")]);

  const result = runCli(targetRoot, "init", "--force", "--sync");

  assert.equal(result.status, 0, result.stderr);
  assert.notEqual(await fs.readFile(managedPath, "utf8"), "利用者の変更");
  assert.equal(await pathExists(stalePath), false);
});

test("switch --copilot-to-codex は対象資産を展開後に Copilot 管理資産だけを削除する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  assert.equal(runCli(targetRoot, "init").status, 0);
  const otherPath = path.join(targetRoot, ".github", "prompts", "other.prompt.md");
  const currentTaskPath = path.join(targetRoot, ".task-kit", "current-task.md");
  await Promise.all([
    writeFile(otherPath, "他製品"),
    writeFile(currentTaskPath, "tasks/利用者タスク"),
  ]);

  const result = runCli(targetRoot, "switch", "--copilot-to-codex");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await pathExists(path.join(targetRoot, ".agents", "skills", "task-kit-task", "SKILL.md")), true);
  assert.equal(await pathExists(path.join(targetRoot, ".github", "agents", "task-kit.task.agent.md")), false);
  assert.equal(await pathExists(path.join(targetRoot, ".github", "prompts", "task-kit.new-task.prompt.md")), false);
  assert.equal(await fs.readFile(otherPath, "utf8"), "他製品");
  assert.equal(await fs.readFile(currentTaskPath, "utf8"), "tasks/利用者タスク");
});

test("switch --copilot-to-claude は Claude Code 資産へ移行する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  assert.equal(runCli(targetRoot, "init").status, 0);

  const result = runCli(targetRoot, "switch", "--copilot-to-claude");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await pathExists(path.join(targetRoot, ".claude", "skills", "task-kit-task", "SKILL.md")), true);
  assert.equal(await pathExists(path.join(targetRoot, "CLAUDE.md")), true);
  assert.equal(await pathExists(path.join(targetRoot, ".github", "agents", "task-kit.task.agent.md")), false);
});

test("switch は移行先競合時に Copilot 管理資産を削除しない", async (context) => {
  const targetRoot = await createTargetRoot(context);
  assert.equal(runCli(targetRoot, "init").status, 0);
  const sourcePath = path.join(targetRoot, ".github", "agents", "task-kit.task.agent.md");
  const targetPath = path.join(targetRoot, ".agents", "skills", "task-kit-task", "SKILL.md");
  await writeFile(targetPath, "利用者の変更");

  const result = runCli(targetRoot, "switch", "--copilot-to-codex");

  assert.equal(result.status, 5);
  assert.equal(await pathExists(sourcePath), true);
  assert.equal(await fs.readFile(targetPath, "utf8"), "利用者の変更");
});

test("init --force はシンボリックリンクを拒否してリンク先を変更しない", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const externalPath = path.join(targetRoot, "outside.md");
  const managedPath = path.join(targetRoot, ".github", "agents", "task-kit.task.agent.md");
  await writeFile(externalPath, "ワークスペース外の内容");

  try {
    await fs.mkdir(path.dirname(managedPath), { recursive: true });
    await fs.symlink(externalPath, managedPath, "file");
  } catch (error) {
    context.skip(`シンボリックリンクを作成できません: ${error.code}`);
    return;
  }

  const result = runCli(targetRoot, "init", "--force");

  assert.equal(result.status, 2);
  assert.equal(await fs.readFile(externalPath, "utf8"), "ワークスペース外の内容");
});

test("製品オプションの複数指定、switch の移行先未指定、--target は終了コード1", async (context) => {
  const targetRoot = await createTargetRoot(context);

  assert.equal(runCli(targetRoot, "init", "--codex", "--claude").status, 1);
  assert.equal(runCli(targetRoot, "switch").status, 1);
  assert.equal(runCli(targetRoot, "init", "--target", "other").status, 1);
});

async function createTargetRoot(context) {
  const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "task-kit-cli-"));
  context.after(() => fs.rm(targetRoot, { recursive: true, force: true }));
  return targetRoot;
}

function runCli(targetRoot, ...args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: targetRoot,
    encoding: "utf8",
  });
}

async function assertTemplateTree(sourceRoot, targetRoot) {
  for (const relativePath of await collectFiles(sourceRoot)) {
    assert.equal(await pathExists(path.join(targetRoot, relativePath)), true, relativePath);
  }
}

async function collectFiles(rootPath, relativePath = "") {
  const entries = await fs.readdir(path.join(rootPath, relativePath), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryRelativePath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(rootPath, entryRelativePath));
    } else if (entry.isFile()) {
      files.push(entryRelativePath);
    }
  }
  return files;
}

async function writeFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function countMatches(content, value) {
  return content.split(value).length - 1;
}
