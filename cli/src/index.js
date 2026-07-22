#!/usr/bin/env node

const { EXIT_CODES } = require("./exit-codes");
const { runInit, runSwitch } = require("./services/init");
const { runLint } = require("./services/lint");
const { AppError } = require("./utils/app-error");

async function main(argv) {
  const args = argv.slice(2);

  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printHelp();
    return EXIT_CODES.INPUT_ERROR;
  }

  const command = args[0];
  const commandArgs = args.slice(1);
  let result;

  if (command === "init") {
    const options = parseInitOptions(commandArgs);
    result = await runInit({
      targetRoot: process.cwd(),
      product: options.product,
      force: options.force,
      sync: options.sync,
    });
  } else if (command === "switch") {
    const options = parseSwitchOptions(commandArgs);
    result = await runSwitch({
      targetRoot: process.cwd(),
      fromProduct: "copilot",
      toProduct: options.toProduct,
      force: options.force,
      sync: options.sync,
    });
  } else if (command === "lint") {
    const options = parseLintOptions(commandArgs);
    const lintResult = await runLint({ targetRoot: process.cwd(), ...options });
    if (lintResult.output) {
      process.stdout.write(lintResult.output);
    }
    return lintResult.status === 0 ? EXIT_CODES.SUCCESS : EXIT_CODES.PLAN_CONSTRAINT_ERROR;
  } else {
    throw new AppError(`不明なコマンドです: ${command}`, EXIT_CODES.INPUT_ERROR);
  }

  for (const operation of result.operations) {
    console.log(`${operation.type}: ${operation.path} (${operation.result})`);
  }

  if (result.conflicts.length > 0) {
    throw new AppError(
      `既存ファイルと競合しました: ${result.conflicts.join(", ")} (上書きする場合は --force)`,
      EXIT_CODES.CONFLICT_ERROR,
    );
  }

  if (command === "switch") {
    console.log(`移行が完了しました: copilot -> ${result.product}`);
  } else {
    console.log(`展開が完了しました: ${result.targetRoot}`);
    console.log(`対象製品: ${result.product}`);
  }
  return EXIT_CODES.SUCCESS;
}

function parseLintOptions(args) {
  const options = { fix: false, paths: [] };
  for (const arg of args) {
    if (arg === "--fix") { options.fix = true; continue; }
    if (arg === "-h" || arg === "--help") { printHelp(); process.exit(EXIT_CODES.SUCCESS); }
    if (arg.startsWith("-")) {
      throw new AppError(`不明なオプションです: ${arg}`, EXIT_CODES.INPUT_ERROR);
    }
    options.paths.push(arg);
  }
  return options;
}

function parseInitOptions(args) {
  const options = { product: "copilot", force: false, sync: false };
  let productSpecified = false;

  for (const arg of args) {
    if (["--copilot", "--codex", "--claude"].includes(arg)) {
      if (productSpecified) {
        throw new AppError("製品オプションは一つだけ指定してください。", EXIT_CODES.INPUT_ERROR);
      }
      options.product = arg.slice(2);
      productSpecified = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--sync") {
      options.sync = true;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(EXIT_CODES.SUCCESS);
    }
    throw new AppError(`不明なオプションです: ${arg}`, EXIT_CODES.INPUT_ERROR);
  }
  return options;
}

function parseSwitchOptions(args) {
  const options = { toProduct: null, force: false, sync: false };

  for (const arg of args) {
    if (arg === "--copilot-to-codex" || arg === "--copilot-to-claude") {
      if (options.toProduct) {
        throw new AppError("移行オプションは一つだけ指定してください。", EXIT_CODES.INPUT_ERROR);
      }
      options.toProduct = arg.endsWith("codex") ? "codex" : "claude";
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--sync") {
      options.sync = true;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(EXIT_CODES.SUCCESS);
    }
    throw new AppError(`不明なオプションです: ${arg}`, EXIT_CODES.INPUT_ERROR);
  }

  if (!options.toProduct) {
    throw new AppError(
      "移行オプション --copilot-to-codex または --copilot-to-claude を指定してください。",
      EXIT_CODES.INPUT_ERROR,
    );
  }
  return options;
}

function printHelp() {
  console.log("Task-Kit CLI");
  console.log("");
  console.log("使い方:");
  console.log("  task-kit init [--copilot|--codex|--claude] [--force] [--sync]");
  console.log("  task-kit switch [--copilot-to-codex|--copilot-to-claude] [--force] [--sync]");
  console.log("  task-kit lint [--fix] [paths...]");
  console.log("");
  console.log("オプション:");
  console.log("  --copilot            GitHub Copilot 用資産を展開する (init の既定値)");
  console.log("  --codex              Codex 用資産を展開する");
  console.log("  --claude             Claude Code 用資産を展開する");
  console.log("  --copilot-to-codex   Copilot 用 Task-Kit 資産を Codex 用へ移行する");
  console.log("  --copilot-to-claude  Copilot 用 Task-Kit 資産を Claude Code 用へ移行する");
  console.log("  --force              既存の Task-Kit 管理資産を上書きする");
  console.log("  --sync               選択製品の廃止済み Task-Kit 管理資産を削除する");
  console.log("  --fix                Markdown lint の安全な自動修正を適用する");
}

process.on("SIGINT", () => {
  console.error("処理をキャンセルしました。");
  process.exit(EXIT_CODES.CANCELED);
});

main(process.argv)
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    if (error instanceof AppError) {
      console.error(`[error:${error.exitCode}] ${error.message}`);
      process.exitCode = error.exitCode;
      return;
    }
    console.error(`[error:${EXIT_CODES.INTERNAL_ERROR}] 予期しないエラーが発生しました。`);
    process.exitCode = EXIT_CODES.INTERNAL_ERROR;
  });
