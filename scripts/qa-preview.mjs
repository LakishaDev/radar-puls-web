#!/usr/bin/env node

const baseUrl = (process.env.QA_PREVIEW_BASE_URL || process.env.BASE_URL || "http://localhost:8787").replace(/\/$/, "");

const locales = ["sr-latn", "sr-cyrl", "en"];
const legalRoutes = ["legal", "privacy", "terms", "cookies", "disclaimer", "community-guidelines"];

const routes = [
  "/",
  "/robots.txt",
  "/sitemap.xml",
  ...locales.map((locale) => `/${locale}`),
  ...locales.map((locale) => `/${locale}/mapa`),
  ...locales.flatMap((locale) => legalRoutes.map((route) => `/${locale}/${route}`)),
];

const timeoutMs = Number(process.env.QA_TIMEOUT_MS || 8000);

async function checkRoute(route) {
  const url = `${baseUrl}${route}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "user-agent": "qa-preview-route-health-check/1.0",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    const ok = response.status >= 200 && response.status < 400;
    return {
      route,
      ok,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    return {
      route,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  console.log(`QA preview health check: ${baseUrl}`);
  console.log(`Routes to test: ${routes.length}`);

  const results = [];

  for (const route of routes) {
    const result = await checkRoute(route);
    results.push(result);

    if (result.ok) {
      console.log(`PASS ${route} -> ${result.status}`);
    } else if (result.error) {
      console.error(`FAIL ${route} -> ERROR ${result.error}`);
    } else {
      console.error(`FAIL ${route} -> ${result.status} ${result.statusText}`);
    }
  }

  const failed = results.filter((result) => !result.ok);

  console.log("------------------------------");
  console.log(`Summary: ${results.length - failed.length}/${results.length} PASS`);

  if (failed.length > 0) {
    console.error("Go-live gate: FAIL");
    process.exit(1);
  }

  console.log("Go-live gate: PASS");
}

run();
