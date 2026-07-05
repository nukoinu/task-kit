#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const cliRoot = path.resolve(__dirname, "..");
  const sourceRoot = path.resolve(cliRoot, "..", "templates");
  const targetRoot = path.resolve(cliRoot, "templates");

  await fs.rm(targetRoot, { recursive: true, force: true });
  await copyDirectory(sourceRoot, targetRoot);

  console.log(`templates synced: ${targetRoot}`);
}

async function copyDirectory(from, to) {
  await fs.mkdir(to, { recursive: true });

  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const dstPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, dstPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    await fs.mkdir(path.dirname(dstPath), { recursive: true });
    await fs.copyFile(srcPath, dstPath);
  }
}

main().catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exitCode = 1;
});
