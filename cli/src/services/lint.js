const fs = require("node:fs/promises");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { EXIT_CODES } = require("../exit-codes");
const { AppError } = require("../utils/app-error");

async function runLint(options) {
  const targetRoot = path.resolve(options.targetRoot);
  const paths = await resolveMarkdownPaths(targetRoot, options.paths);
  const configPath = path.join(targetRoot, ".markdownlint.jsonc");
  if (!await pathExists(configPath)) {
    throw new AppError(".markdownlint.jsonc が見つかりません。task-kit init を実行してください。", EXIT_CODES.INPUT_ERROR);
  }
  await assertNoSymbolicLink(targetRoot, configPath);

  let executable;
  try {
    executable = resolveLintExecutable();
  } catch (error) {
    throw new AppError("Markdown lint の依存関係が見つかりません。CLI を再インストールしてください。", EXIT_CODES.INTERNAL_ERROR, error);
  }
  const args = [executable, "--config", configPath, ...(options.fix ? ["--fix"] : []), ...paths];
  const result = spawnSync(process.execPath, args, { cwd: targetRoot, encoding: "utf8" });
  if (result.error) {
    throw new AppError("Markdown lint を実行できませんでした。", EXIT_CODES.INTERNAL_ERROR, result.error);
  }
  return { output: `${result.stdout || ""}${result.stderr || ""}`, status: result.status ?? EXIT_CODES.INTERNAL_ERROR };
}

function resolveLintExecutable() {
  for (const entryPoint of [
    "markdownlint-cli2",
    "markdownlint-cli2/markdownlint-cli2.mjs",
    "markdownlint-cli2/markdownlint-cli2.js",
  ]) {
    try {
      return require.resolve(entryPoint);
    } catch {
      // 次のエントリポイントを試す。
    }
  }
  throw new Error("markdownlint-cli2 executable was not found");
}

async function resolveMarkdownPaths(targetRoot, requestedPaths) {
  if (requestedPaths.length === 0) {
    return ["**/*.md", "#node_modules", "#.git", "#dist", "#build"];
  }
  const resolved = [];
  for (const requestedPath of requestedPaths) {
    const targetPath = path.resolve(targetRoot, requestedPath);
    if (targetPath !== targetRoot && !targetPath.startsWith(`${targetRoot}${path.sep}`)) {
      throw new AppError(`リポジトリ外のパスは検査できません: ${requestedPath}`, EXIT_CODES.INPUT_ERROR);
    }
    if (path.extname(targetPath).toLowerCase() !== ".md") {
      throw new AppError(`Markdown ファイルだけを指定してください: ${requestedPath}`, EXIT_CODES.INPUT_ERROR);
    }
    if (!await pathExists(targetPath)) {
      throw new AppError(`検査対象が見つかりません: ${requestedPath}`, EXIT_CODES.INPUT_ERROR);
    }
    await assertNoSymbolicLink(targetRoot, targetPath);
    resolved.push(path.relative(targetRoot, targetPath) || path.basename(targetPath));
  }
  return resolved;
}

async function assertNoSymbolicLink(rootPath, targetPath) {
  const relativePath = path.relative(rootPath, targetPath);
  let currentPath = rootPath;
  for (const segment of relativePath.split(path.sep).filter(Boolean)) {
    currentPath = path.join(currentPath, segment);
    if ((await fs.lstat(currentPath)).isSymbolicLink()) {
      throw new AppError(`シンボリックリンクを経由する検査対象は使用できません: ${currentPath}`, EXIT_CODES.PATH_OR_PERMISSION_ERROR);
    }
  }
}

async function pathExists(targetPath) {
  try { await fs.access(targetPath); return true; } catch { return false; }
}

module.exports = { runLint, resolveLintExecutable };
