const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const cliPath = path.resolve(__dirname, "..", "src", "index.js");
const templatesRoot = path.resolve(__dirname, "..", "..", "templates");

test("init はテンプレート配下の全ファイルを展開する", async (context) => {
  const targetRoot = await createTargetRoot(context);

  const result = runInit(targetRoot);

  assert.equal(result.status, 0, result.stderr);
  for (const relativePath of await collectFiles(templatesRoot)) {
    const targetRelativePath = relativePath.startsWith(`github${path.sep}`)
      ? path.join(".github", relativePath.slice("github".length + 1))
      : relativePath;
    assert.equal(await pathExists(path.join(targetRoot, targetRelativePath)), true, targetRelativePath);
  }
});

test("init は既存ファイルの競合を終了コード5で通知する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const targetPath = path.join(targetRoot, ".github", "agents", "task-kit.task.agent.md");
  await writeFile(targetPath, "利用者の変更");

  const result = runInit(targetRoot);

  assert.equal(result.status, 5);
  assert.equal(await fs.readFile(targetPath, "utf8"), "利用者の変更");
});

test("init --force は配布対象を上書きする", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const targetPath = path.join(targetRoot, ".github", "agents", "task-kit.task.agent.md");
  await writeFile(targetPath, "利用者の変更");

  const result = runInit(targetRoot, "--force");

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

  const result = runInit(targetRoot, "--sync");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await pathExists(stalePath), false);
  assert.equal(await fs.readFile(otherProductPath, "utf8"), "他製品");
  assert.equal(await fs.readFile(taskPath, "utf8"), "利用者タスク");
  assert.equal(await fs.readFile(currentTaskPath, "utf8"), "現在のタスク");
  assert.equal(await fs.readFile(profilePath, "utf8"), "利用者設定");
});

test("init --sync は競合を通知した後も廃止資産を削除する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const managedPath = path.join(targetRoot, ".github", "agents", "task-kit.task.agent.md");
  const stalePath = path.join(targetRoot, ".github", "prompts", "task-kit.retired.prompt.md");
  await Promise.all([writeFile(managedPath, "利用者の変更"), writeFile(stalePath, "廃止資産")]);

  const result = runInit(targetRoot, "--sync");

  assert.equal(result.status, 5);
  assert.equal(await fs.readFile(managedPath, "utf8"), "利用者の変更");
  assert.equal(await pathExists(stalePath), false);
});

test("init --force --sync は上書きと廃止資産削除を実行する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const managedPath = path.join(targetRoot, ".github", "agents", "task-kit.task.agent.md");
  const stalePath = path.join(targetRoot, ".task-kit", "templates", "tasks", "retired.md");
  await Promise.all([writeFile(managedPath, "利用者の変更"), writeFile(stalePath, "廃止資産")]);

  const result = runInit(targetRoot, "--force", "--sync");

  assert.equal(result.status, 0, result.stderr);
  assert.notEqual(await fs.readFile(managedPath, "utf8"), "利用者の変更");
  assert.equal(await pathExists(stalePath), false);
});

test("init --sync は利用者独自テンプレートを保持する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const customTemplatePath = path.join(targetRoot, ".task-kit", "templates", "tasks", "custom.md");
  await writeFile(customTemplatePath, "利用者独自テンプレート");

  const result = runInit(targetRoot, "--sync");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await fs.readFile(customTemplatePath, "utf8"), "利用者独自テンプレート");
});

test("init --sync は廃止済みの既知 Task-Kit テンプレートを削除する", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const stalePath = path.join(targetRoot, ".task-kit", "templates", "tasks", "retired.md");
  await writeFile(stalePath, "廃止済みテンプレート");

  const result = runInit(targetRoot, "--sync");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await pathExists(stalePath), false);
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

  const result = runInit(targetRoot, "--force");

  assert.equal(result.status, 2);
  assert.equal(await fs.readFile(externalPath, "utf8"), "ワークスペース外の内容");
});

test("init は親ディレクトリのシンボリックリンクを拒否してリンク先を変更しない", async (context) => {
  const targetRoot = await createTargetRoot(context);
  const externalRoot = await fs.mkdtemp(path.join(os.tmpdir(), "task-kit-external-"));
  const linkedPath = path.join(targetRoot, ".github");
  const externalPath = path.join(externalRoot, "agents", "task-kit.task.agent.md");
  await writeFile(externalPath, "ワークスペース外の内容");
  context.after(() => fs.rm(externalRoot, { recursive: true, force: true }));

  try {
    await fs.symlink(externalRoot, linkedPath, "dir");
  } catch (error) {
    context.skip(`シンボリックリンクを作成できません: ${error.code}`);
    return;
  }

  const result = runInit(targetRoot, "--force");

  assert.equal(result.status, 2);
  assert.equal(await fs.readFile(externalPath, "utf8"), "ワークスペース外の内容");
});

test("--target は未知オプションとして終了コード1を返す", async (context) => {
  const targetRoot = await createTargetRoot(context);

  const result = runInit(targetRoot, "--target", "other");

  assert.equal(result.status, 1);
});

async function createTargetRoot(context) {
  const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "task-kit-cli-"));
  context.after(() => fs.rm(targetRoot, { recursive: true, force: true }));
  return targetRoot;
}

function runInit(targetRoot, ...args) {
  return spawnSync(process.execPath, [cliPath, "init", ...args], {
    cwd: targetRoot,
    encoding: "utf8",
  });
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