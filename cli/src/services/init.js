const fs = require("node:fs/promises");
const path = require("node:path");

const { EXIT_CODES } = require("../exit-codes");
const { AppError } = require("../utils/app-error");

const INSTRUCTION_TEMPLATES = Object.freeze({
  codex: {
    fileName: "AGENTS.md",
    templatePath: path.join("codex", "AGENTS.md"),
    start: "<!-- task-kit:codex:start -->",
    end: "<!-- task-kit:codex:end -->",
  },
  claude: {
    fileName: "CLAUDE.md",
    templatePath: path.join("claude", "CLAUDE.md"),
    start: "<!-- task-kit:claude:start -->",
    end: "<!-- task-kit:claude:end -->",
  },
});

// 配布済みの廃止テンプレートを識別するための履歴。通常の展開対象は templates/ を走査する。
const KNOWN_TASK_KIT_TEMPLATE_FILES = new Set([
  path.join("tasks", "task.md"),
  path.join("tasks", "plan.md"),
  path.join("tasks", "review.md"),
  path.join("tasks", "issue.md"),
  path.join("tasks", "handoff.md"),
  path.join("tasks", "records", "findings.md"),
  path.join("tasks", "records", "scratchpad.md"),
  path.join("tasks", "references", ".gitkeep"),
  path.join("tasks", "outputs", ".gitkeep"),
  path.join("tasks", "retired.md"),
]);

async function runInit(options) {
  const targetRoot = options.targetRoot;
  const product = options.product || "copilot";
  const force = Boolean(options.force);
  const sync = Boolean(options.sync);
  const preserveTaskKit = Boolean(options.preserveTaskKit);

  if (!["copilot", "codex", "claude"].includes(product)) {
    throw new AppError(`未対応の製品です: ${product}`, EXIT_CODES.INPUT_ERROR);
  }

  const templatesRoot = await resolveTemplatesRoot();
  const sources = buildSources({ templatesRoot, targetRoot, product });
  await ensurePathWritable(targetRoot);

  const operations = [];
  const conflicts = [];
  const templateFiles = new Map();

  for (const source of sources) {
    await ensurePathReadable(source.from);
    const files = await collectFiles(source.from);
    templateFiles.set(source.name, files);
    await copyFiles(source, files, {
      force,
      sync,
      preserveExisting: preserveTaskKit && source.name === ".task-kit",
      operations,
      conflicts,
    });
  }

  if (product !== "copilot") {
    await applyInstructionTemplate({
      templatesRoot,
      targetRoot,
      product,
      force,
      sync,
      operations,
      conflicts,
    });
  }

  if (sync) {
    await removeObsoleteFiles({ targetRoot, product, templateFiles, operations });
  }

  return { targetRoot, product, operations, conflicts };
}

async function runSwitch(options) {
  const result = await runInit({
    targetRoot: options.targetRoot,
    product: options.toProduct,
    force: options.force,
    sync: options.sync,
    preserveTaskKit: !options.force,
  });

  if (result.conflicts.length === 0) {
    await removeProductAssets({
      targetRoot: options.targetRoot,
      product: options.fromProduct,
      operations: result.operations,
    });
  }
  return result;
}

function buildSources(options) {
  let productSource;
  if (options.product === "copilot") {
    productSource = {
      name: ".github",
      from: path.join(options.templatesRoot, "github"),
      to: path.join(options.targetRoot, ".github"),
    };
  } else if (options.product === "codex") {
    productSource = {
      name: ".agents/skills",
      from: path.join(options.templatesRoot, "skills"),
      to: path.join(options.targetRoot, ".agents", "skills"),
    };
  } else {
    productSource = {
      name: ".claude/skills",
      from: path.join(options.templatesRoot, "skills"),
      to: path.join(options.targetRoot, ".claude", "skills"),
    };
  }

  return [
    productSource,
    {
      name: ".task-kit",
      from: path.join(options.templatesRoot, ".task-kit"),
      to: path.join(options.targetRoot, ".task-kit"),
    },
  ];
}

async function resolveTemplatesRoot() {
  const candidates = [
    path.resolve(__dirname, "..", "..", "templates"),
    path.resolve(__dirname, "..", "..", "..", "templates"),
  ];

  for (const candidate of candidates) {
    if (await hasRequiredTemplates(candidate)) {
      return candidate;
    }
  }
  throw new AppError("テンプレートディレクトリを解決できませんでした。", EXIT_CODES.INTERNAL_ERROR);
}

async function hasRequiredTemplates(rootPath) {
  const requiredPaths = [
    path.join(rootPath, "github", "prompts"),
    path.join(rootPath, ".task-kit"),
    path.join(rootPath, "skills"),
    path.join(rootPath, "codex", "AGENTS.md"),
    path.join(rootPath, "claude", "CLAUDE.md"),
  ];
  return (await Promise.all(requiredPaths.map(pathExists))).every(Boolean);
}

async function ensurePathReadable(targetPath) {
  try {
    await fs.access(targetPath);
  } catch (error) {
    throw new AppError(`テンプレートが見つかりません: ${targetPath}`, EXIT_CODES.INTERNAL_ERROR, error);
  }
}

async function ensurePathWritable(targetPath) {
  try {
    await fs.access(targetPath);
  } catch (error) {
    throw new AppError(
      `展開先パスが存在しないかアクセスできません: ${targetPath}`,
      EXIT_CODES.PATH_OR_PERMISSION_ERROR,
      error,
    );
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
  return files.sort();
}

async function copyFiles(source, files, options) {
  for (const relativePath of files) {
    const sourcePath = safeResolve(source.from, relativePath);
    const destinationPath = safeResolve(source.to, relativePath);
    const targetRelativePath = path.join(source.name, relativePath);
    await ensurePathDoesNotTraverseSymbolicLink(targetRootFor(source.to), destinationPath);
    const exists = await pathExists(destinationPath);

    if (exists && (isProtectedPath(source.name, relativePath) || options.preserveExisting)) {
      options.operations.push({ type: "skip", path: targetRelativePath, result: "保護" });
      continue;
    }
    if (exists && !options.force) {
      if (options.sync) {
        options.operations.push({ type: "conflict", path: targetRelativePath, result: "未更新" });
        options.conflicts.push(targetRelativePath);
        continue;
      }
      throw new AppError(
        `既存ファイルと競合しました: ${destinationPath} (上書きする場合は --force)`,
        EXIT_CODES.CONFLICT_ERROR,
      );
    }

    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(sourcePath, destinationPath);
    options.operations.push({
      type: exists ? "update" : "create",
      path: targetRelativePath,
      result: "完了",
    });
  }
}

async function applyInstructionTemplate(options) {
  const config = INSTRUCTION_TEMPLATES[options.product];
  const templatePath = path.join(options.templatesRoot, config.templatePath);
  const targetPath = path.join(options.targetRoot, config.fileName);
  await ensurePathReadable(templatePath);
  await ensurePathDoesNotTraverseSymbolicLink(options.targetRoot, targetPath);

  const template = await fs.readFile(templatePath, "utf8");
  if (!(await pathExists(targetPath))) {
    await fs.writeFile(targetPath, template);
    options.operations.push({ type: "create", path: config.fileName, result: "完了" });
    return;
  }

  const current = await fs.readFile(targetPath, "utf8");
  const startIndex = current.indexOf(config.start);
  const endIndex = current.indexOf(config.end);

  if (startIndex === -1 && endIndex === -1) {
    const separator = current.endsWith("\n") ? "\n" : "\n\n";
    await fs.writeFile(targetPath, `${current}${separator}${template}`);
    options.operations.push({ type: "append", path: config.fileName, result: "完了" });
    return;
  }
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new AppError(
      `${config.fileName} の Task-Kit 管理コメントが不完全です。`,
      EXIT_CODES.CONFLICT_ERROR,
    );
  }

  const managedEnd = endIndex + config.end.length;
  const currentBlock = current.slice(startIndex, managedEnd);
  const templateBlock = template.trimEnd();
  if (currentBlock === templateBlock) {
    options.operations.push({ type: "skip", path: config.fileName, result: "変更なし" });
    return;
  }
  if (!options.force) {
    if (options.sync) {
      options.operations.push({ type: "conflict", path: config.fileName, result: "未更新" });
      options.conflicts.push(config.fileName);
      return;
    }
    throw new AppError(
      `${config.fileName} の Task-Kit 管理区間と競合しました (更新する場合は --force)。`,
      EXIT_CODES.CONFLICT_ERROR,
    );
  }

  await fs.writeFile(targetPath, `${current.slice(0, startIndex)}${templateBlock}${current.slice(managedEnd)}`);
  options.operations.push({ type: "update", path: config.fileName, result: "管理区間のみ更新" });
}

async function removeObsoleteFiles(options) {
  const taskKitFiles = new Set(options.templateFiles.get(".task-kit"));

  if (options.product === "copilot") {
    const githubFiles = new Set(options.templateFiles.get(".github"));
    await removeObsoleteManagedFiles({
      rootPath: path.join(options.targetRoot, ".github", "agents"),
      expectedFiles: toChildFileSet(githubFiles, "agents"),
      isManaged: (relativePath) => path.basename(relativePath).startsWith("task-kit."),
      targetPrefix: path.join(".github", "agents"),
      operations: options.operations,
    });
    await removeObsoleteManagedFiles({
      rootPath: path.join(options.targetRoot, ".github", "prompts"),
      expectedFiles: toChildFileSet(githubFiles, "prompts"),
      isManaged: (relativePath) => path.basename(relativePath).startsWith("task-kit."),
      targetPrefix: path.join(".github", "prompts"),
      operations: options.operations,
    });
    await removeObsoleteSkills({
      rootPath: path.join(options.targetRoot, ".github", "skills"),
      expectedSkills: toChildDirectorySet(githubFiles, "skills"),
      targetPrefix: path.join(".github", "skills"),
      operations: options.operations,
    });
  } else {
    const sourceName = options.product === "codex" ? ".agents/skills" : ".claude/skills";
    await removeObsoleteSkills({
      rootPath: path.join(options.targetRoot, ...sourceName.split("/")),
      expectedSkills: toTopLevelDirectorySet(options.templateFiles.get(sourceName)),
      targetPrefix: sourceName,
      operations: options.operations,
    });
  }

  await removeObsoleteManagedFiles({
    rootPath: path.join(options.targetRoot, ".task-kit", "prompts"),
    expectedFiles: toChildFileSet(taskKitFiles, "prompts"),
    isManaged: (relativePath) => path.basename(relativePath).startsWith("task-kit."),
    targetPrefix: path.join(".task-kit", "prompts"),
    operations: options.operations,
  });
  await removeObsoleteKnownTaskKitTemplates({
    rootPath: path.join(options.targetRoot, ".task-kit", "templates"),
    expectedFiles: toChildFileSet(taskKitFiles, "templates"),
    targetRoot: options.targetRoot,
    operations: options.operations,
  });
}

async function removeProductAssets(options) {
  if (options.product !== "copilot") {
    return;
  }

  for (const childDirectory of ["agents", "prompts"]) {
    await removeObsoleteManagedFiles({
      rootPath: path.join(options.targetRoot, ".github", childDirectory),
      expectedFiles: new Set(),
      isManaged: (relativePath) => path.basename(relativePath).startsWith("task-kit."),
      targetPrefix: path.join(".github", childDirectory),
      operations: options.operations,
    });
  }
  await removeObsoleteSkills({
    rootPath: path.join(options.targetRoot, ".github", "skills"),
    expectedSkills: new Set(),
    targetPrefix: path.join(".github", "skills"),
    operations: options.operations,
  });
}

async function removeObsoleteManagedFiles(options) {
  await ensurePathDoesNotTraverseSymbolicLink(targetRootFor(options.rootPath), options.rootPath);
  if (!(await pathExists(options.rootPath))) {
    return;
  }

  for (const relativePath of await collectFiles(options.rootPath)) {
    if (!options.isManaged(relativePath) || options.expectedFiles.has(relativePath)) {
      continue;
    }
    const targetPath = safeResolve(options.rootPath, relativePath);
    await ensurePathDoesNotTraverseSymbolicLink(targetRootFor(options.rootPath), targetPath);
    await fs.rm(targetPath);
    options.operations.push({
      type: "delete",
      path: path.join(options.targetPrefix, relativePath),
      result: "完了",
    });
  }
}

async function removeObsoleteKnownTaskKitTemplates(options) {
  for (const relativePath of KNOWN_TASK_KIT_TEMPLATE_FILES) {
    if (options.expectedFiles.has(relativePath)) {
      continue;
    }
    const targetPath = safeResolve(options.rootPath, relativePath);
    await ensurePathDoesNotTraverseSymbolicLink(options.targetRoot, targetPath);
    if (await pathExists(targetPath)) {
      await fs.rm(targetPath);
      options.operations.push({
        type: "delete",
        path: path.join(".task-kit", "templates", relativePath),
        result: "完了",
      });
    }
  }
}

async function removeObsoleteSkills(options) {
  await ensurePathDoesNotTraverseSymbolicLink(targetRootFor(options.rootPath), options.rootPath);
  if (!(await pathExists(options.rootPath))) {
    return;
  }

  const entries = await fs.readdir(options.rootPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("task-kit-") || options.expectedSkills.has(entry.name)) {
      continue;
    }
    const targetPath = safeResolve(options.rootPath, entry.name);
    await ensurePathDoesNotTraverseSymbolicLink(targetRootFor(options.rootPath), targetPath);
    await fs.rm(targetPath, { recursive: true });
    options.operations.push({
      type: "delete",
      path: path.join(options.targetPrefix, entry.name),
      result: "完了",
    });
  }
}

function toChildFileSet(files, childDirectory) {
  const prefix = `${childDirectory}${path.sep}`;
  return new Set(
    [...files]
      .filter((relativePath) => relativePath.startsWith(prefix))
      .map((relativePath) => relativePath.slice(prefix.length)),
  );
}

function toChildDirectorySet(files, childDirectory) {
  const prefix = `${childDirectory}${path.sep}`;
  return new Set(
    [...files]
      .filter((relativePath) => relativePath.startsWith(prefix))
      .map((relativePath) => relativePath.slice(prefix.length).split(path.sep)[0]),
  );
}

function toTopLevelDirectorySet(files) {
  return new Set([...files].map((relativePath) => relativePath.split(path.sep)[0]));
}

function targetRootFor(targetPath) {
  return path.resolve(targetPath, "..", "..");
}

function isProtectedPath(sourceName, relativePath) {
  return sourceName === ".task-kit" && [
    "current-task.md",
    path.join("defaults", "user-profile.md"),
  ].includes(relativePath);
}

function safeResolve(rootPath, relativePath) {
  const normalizedPath = path.normalize(relativePath);
  if (path.isAbsolute(normalizedPath) || normalizedPath === ".." || normalizedPath.startsWith(`..${path.sep}`)) {
    throw new AppError("テンプレートの相対パスが不正です。", EXIT_CODES.INTERNAL_ERROR);
  }

  const resolvedPath = path.resolve(rootPath, normalizedPath);
  const relativeToRoot = path.relative(rootPath, resolvedPath);
  if (relativeToRoot === ".." || relativeToRoot.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToRoot)) {
    throw new AppError("テンプレートのパス境界を越えています。", EXIT_CODES.INTERNAL_ERROR);
  }
  return resolvedPath;
}

async function ensurePathDoesNotTraverseSymbolicLink(rootPath, targetPath) {
  const resolvedRootPath = path.resolve(rootPath);
  const relativePath = path.relative(resolvedRootPath, targetPath);
  const segments = relativePath ? relativePath.split(path.sep) : [];
  let currentPath = resolvedRootPath;

  for (const segment of segments) {
    currentPath = path.join(currentPath, segment);
    try {
      const stat = await fs.lstat(currentPath);
      if (stat.isSymbolicLink()) {
        throw new AppError(
          `シンボリックリンクを経由する展開先は使用できません: ${currentPath}`,
          EXIT_CODES.PATH_OR_PERMISSION_ERROR,
        );
      }
    } catch (error) {
      if (error && error.code === "ENOENT") {
        return;
      }
      throw error;
    }
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

module.exports = { runInit, runSwitch };
