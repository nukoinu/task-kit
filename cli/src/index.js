#!/usr/bin/env node

const path = require("node:path");

const { EXIT_CODES } = require("./exit-codes");
const { runInit } = require("./services/init");
const { AppError } = require("./utils/app-error");

async function main(argv) {
  const args = argv.slice(2);

  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printHelp();
    return EXIT_CODES.INPUT_ERROR;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  if (command !== "init") {
    throw new AppError(
      `不明なコマンドです: ${command}`,
      EXIT_CODES.INPUT_ERROR,
    );
  }

  const options = parseInitOptions(commandArgs);
  const result = await runInit({
    targetRoot: process.cwd(),
    force: options.force,
    sync: options.sync,
  });

  for (const operation of result.operations) {
    console.log(`${operation.type}: ${operation.path} (${operation.result})`);
  }

  if (result.conflicts.length > 0) {
    throw new AppError(
      `既存ファイルと競合しました: ${result.conflicts.join(", ")} (上書きする場合は --force)`,
      EXIT_CODES.CONFLICT_ERROR,
    );
  }

  console.log(`展開が完了しました: ${result.targetRoot}`);
  console.log("作成/更新: .github, .task-kit");
  return EXIT_CODES.SUCCESS;
}

function parseInitOptions(args) {
  const options = {
    force: false,
    sync: false,
  };

  for (const arg of args) {
    if (arg === "--copilot") {
      // --copilot は現時点ではデフォルト動作と同じ別名。
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

    throw new AppError(
      `不明なオプションです: ${arg}`,
      EXIT_CODES.INPUT_ERROR,
    );
  }

  return options;
}

function printHelp() {
  console.log("Task-Kit CLI");
  console.log("");
  console.log("使い方:");
  console.log("  task-kit init [--copilot] [--force] [--sync]");
  console.log("");
  console.log("オプション:");
  console.log("  --copilot  task-kit init と同一動作の別名オプション");
  console.log("  --force    既存ファイルがあっても上書きする");
  console.log("  --sync     廃止された Task-Kit 管理資産を削除する");
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
    console.error(error && error.message ? error.message : String(error));
    process.exitCode = EXIT_CODES.INTERNAL_ERROR;
  });
