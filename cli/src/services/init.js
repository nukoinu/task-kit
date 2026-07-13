const fs = require("node:fs/promises");
const path = require("node:path");

const { EXIT_CODES } = require("../exit-codes");
const { AppError } = require("../utils/app-error");

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
  const force = options.force;
  const sync = options.sync;

  const templatesRoot = await resolveTemplatesRoot();

  const sources = [
    {
      name: ".github",
      from: path.join(templatesRoot, "github"),
      to: path.join(targetRoot, ".github"),
    },
    {
      name: ".task-kit",
      from: path.join(templatesRoot, ".task-kit"),
      to: path.join(targetRoot, ".task-kit"),
    },
  ];

  await ensurePathWritable(targetRoot);

  const operations = [];
  const conflicts = [];
  const templateFiles = new Map();

  for (const source of sources) {
    await ensurePathReadable(source.from);
    const files = await collectFiles(source.from);
    templateFiles.set(source.name, files);
    await copyFiles(source, files, { force, sync, operations, conflicts });
  }

  if (sync) {
    await removeObsoleteFiles({
      targetRoot,
      templateFiles,
      operations,
    });
  }

  return {
    targetRoot,
    operations,
    conflicts,
  };
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

  throw new AppError(
    "テンプレートディレクトリを解決できませんでした。",
    EXIT_CODES.INTERNAL_ERROR,
  );
}

async function hasRequiredTemplates(rootPath) {
  const githubRoot = path.join(rootPath, "github");
  const taskKitRoot = path.join(rootPath, ".task-kit");
  const promptsRoot = path.join(githubRoot, "prompts");

  if (!(await pathExists(githubRoot))) {
    return false;
  }

  if (!(await pathExists(taskKitRoot))) {
    return false;
  }

  if (!(await pathExists(promptsRoot))) {
    return false;
  }

  let promptEntries;
  try {
    promptEntries = await fs.readdir(promptsRoot, { withFileTypes: true });
  } catch {
    return false;
  }

  return promptEntries.some(
    (entry) => entry.isFile() && entry.name.endsWith(".prompt.md"),
  );
}

async function ensurePathReadable(targetPath) {
  try {
    await fs.access(targetPath);
  } catch (error) {
    throw new AppError(
      `テンプレートが見つかりません: ${targetPath}`,
      EXIT_CODES.INTERNAL_ERROR,
      error,
    );
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
  const entries = await fs.readdir(path.join(rootPath, relativePath), {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    const entryRelativePath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(rootPath, entryRelativePath));
      continue;
    }

    if (entry.isFile()) {
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

    if (exists && isProtectedPath(source.name, relativePath)) {
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

async function removeObsoleteFiles(options) {
  const githubFiles = new Set(options.templateFiles.get(".github"));
  const taskKitFiles = new Set(options.templateFiles.get(".task-kit"));

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
  await removeObsoleteSkills({
    rootPath: path.join(options.targetRoot, ".github", "skills"),
    expectedSkills: toChildDirectorySet(githubFiles, "skills"),
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
    if (!(await pathExists(targetPath))) {
      continue;
    }

    await fs.rm(targetPath);
    options.operations.push({
      type: "delete",
      path: path.join(".task-kit", "templates", relativePath),
      result: "完了",
    });
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
      path: path.join(".github", "skills", entry.name),
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

module.exports = {
  runInit,
};
