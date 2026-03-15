#!/usr/bin/env node

import { spawn } from "node:child_process";

const baseUrl = (process.env.QA_PREVIEW_BASE_URL || process.env.BASE_URL || "http://localhost:8787").replace(/\/$/, "");
const healthPath = process.env.QA_PREVIEW_HEALTH_PATH || "/robots.txt";
const startupTimeoutMs = Number(process.env.QA_PREVIEW_STARTUP_TIMEOUT_MS || 90000);
const pollIntervalMs = Number(process.env.QA_PREVIEW_POLL_INTERVAL_MS || 1500);
const shutdownGraceMs = Number(process.env.QA_PREVIEW_SHUTDOWN_GRACE_MS || 5000);

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runNpm(args, options = {}) {
  return spawn(npmCmd, args, {
    stdio: "inherit",
    env: process.env,
    ...options,
  });
}

async function waitForPreviewReady(previewProcess) {
  const startedAt = Date.now();
  const url = `${baseUrl}${healthPath.startsWith("/") ? healthPath : `/${healthPath}`}`;

  while (Date.now() - startedAt < startupTimeoutMs) {
    if (previewProcess.exitCode !== null) {
      throw new Error(`Preview process exited early with code ${previewProcess.exitCode}.`);
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
      });

      if (response.status >= 200 && response.status < 500) {
        return;
      }
    } catch {
      // Keep polling while worker boots up.
    }

    await sleep(pollIntervalMs);
  }

  throw new Error(`Timed out waiting for preview worker at ${url}.`);
}

async function stopPreview(previewProcess) {
  if (previewProcess.exitCode !== null) {
    return;
  }

  previewProcess.kill("SIGTERM");

  const killAt = Date.now() + shutdownGraceMs;
  while (previewProcess.exitCode === null && Date.now() < killAt) {
    await sleep(100);
  }

  if (previewProcess.exitCode === null) {
    previewProcess.kill("SIGKILL");
  }
}

async function main() {
  const previewProcess = runNpm(["run", "preview:worker"]);

  const handleSignal = async (signal) => {
    console.error(`Received ${signal}; stopping preview worker...`);
    await stopPreview(previewProcess);
    process.exit(130);
  };

  process.on("SIGINT", handleSignal);
  process.on("SIGTERM", handleSignal);

  try {
    console.log(`Starting preview worker at ${baseUrl}`);
    await waitForPreviewReady(previewProcess);
    console.log("Preview worker is ready. Running QA checks...");

    const qaProcess = runNpm(["run", "qa:preview"], {
      env: {
        ...process.env,
        QA_PREVIEW_BASE_URL: baseUrl,
      },
    });

    const qaExitCode = await new Promise((resolve, reject) => {
      qaProcess.on("error", reject);
      qaProcess.on("exit", (code, signal) => {
        if (signal) {
          reject(new Error(`qa:preview terminated by signal ${signal}.`));
          return;
        }

        resolve(code ?? 1);
      });
    });

    if (qaExitCode !== 0) {
      process.exitCode = qaExitCode;
    }
  } finally {
    await stopPreview(previewProcess);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
