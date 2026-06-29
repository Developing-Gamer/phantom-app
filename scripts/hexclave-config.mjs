#!/usr/bin/env node

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const command = process.argv[2] ?? "push";

if (!["push", "pull"].includes(command)) {
  console.error("Usage: node scripts/hexclave-config.mjs <push|pull>");
  process.exit(1);
}

const configFile = process.env.HEXCLAVE_CONFIG_FILE ?? "./hexclave.config.ts";
const projectId =
  process.env.HEXCLAVE_PROJECT_ID ??
  process.env.STACK_PROJECT_ID ??
  process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID ??
  process.env.NEXT_PUBLIC_STACK_PROJECT_ID;

const args = ["config", command, "--config-file", configFile];

if (projectId) {
  args.push("--cloud-project-id", projectId);
}

if (command === "pull" && process.env.HEXCLAVE_CONFIG_OVERWRITE !== "false") {
  args.push("--overwrite");
}

if (command === "push") {
  const sourceRepo = process.env.HEXCLAVE_CONFIG_SOURCE_REPO;
  const sourcePath = process.env.HEXCLAVE_CONFIG_SOURCE_PATH;
  const sourceWorkflowPath = process.env.HEXCLAVE_CONFIG_SOURCE_WORKFLOW_PATH;

  if (sourceRepo) {
    args.push("--source", "github", "--source-repo", sourceRepo);
  }

  if (sourcePath) {
    args.push("--source-path", sourcePath);
  }

  if (sourceWorkflowPath) {
    args.push("--source-workflow-path", sourceWorkflowPath);
  }
}

const result = spawnSync("hexclave", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
