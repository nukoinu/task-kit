const fs = require("node:fs/promises");
const path = require("node:path");

const { EXIT_CODES } = require("../exit-codes");
const { AppError } = require("../utils/app-error");

async function runInit(options) {
  const targetRoot = options.targetRoot;
  const force = options.force;

  const templatesRoot = await resolveTemplatesRoot();

  const sources = [
    {
      from: path.join(templatesRoot, "github"),
      to: path.join(targetRoot, ".github"),
    },
    {
      from: path.join(templatesRoot, ".task-kit"),
      to: path.join(targetRoot, ".task-kit"),
    },
  ];

  await ensurePathWritable(targetRoot);

  for (const source of sources) {
    await ensurePathReadable(source.from);
    await copyDirectory(source.from, source.to, { force });
  }

  return {
    targetRoot,
    copied: [".github", ".task-kit"],
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

async function copyDirectory(from, to, options) {
  await fs.mkdir(to, { recursive: true });

  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const dstPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, dstPath, options);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const exists = await pathExists(dstPath);
    if (exists && !options.force) {
      throw new AppError(
        `既存ファイルと競合しました: ${dstPath} (上書きする場合は --force)` ,
        EXIT_CODES.CONFLICT_ERROR,
      );
    }

    await fs.mkdir(path.dirname(dstPath), { recursive: true });
    await fs.copyFile(srcPath, dstPath);
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
