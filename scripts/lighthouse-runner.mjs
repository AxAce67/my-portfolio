import { mkdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const RUNS = Number(process.env.LH_RUNS ?? '3');
const BASE_URL = process.env.LH_BASE_URL ?? 'http://127.0.0.1:3000';
const URLS = (process.env.LH_URLS ?? '/ja')
  .split(',')
  .map((segment) => segment.trim())
  .filter(Boolean)
  .map((segment) => `${BASE_URL}${segment}`);

const outDir = path.resolve(process.cwd(), '.lighthouse');
mkdirSync(outDir, { recursive: true });

const scoreKeys = ['performance', 'accessibility', 'best-practices', 'seo'];
const metricKeys = [
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
  'speed-index',
  'first-contentful-paint',
];

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
};

for (const url of URLS) {
  const runs = [];

  for (let i = 1; i <= RUNS; i += 1) {
    const reportPath = path.join(outDir, `lh-${new URL(url).pathname.replaceAll('/', '_') || 'root'}-run${i}.json`);
    const args = [
      '--no-install',
      'lighthouse',
      url,
      '--quiet',
      '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
      '--output=json',
      `--output-path=${reportPath}`,
      '--only-categories=performance,accessibility,best-practices,seo',
    ];

    execFileSync('npx', args, { stdio: 'inherit' });
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    runs.push(report);
  }

  const scoreSummary = Object.fromEntries(
    scoreKeys.map((key) => {
      const values = runs.map((report) => Math.round((report.categories?.[key]?.score ?? 0) * 100));
      return [key, Math.round(median(values))];
    }),
  );

  const metricSummary = Object.fromEntries(
    metricKeys.map((key) => {
      const values = runs.map((report) => Number(report.audits?.[key]?.numericValue ?? 0));
      return [key, Math.round(median(values))];
    }),
  );

  console.log('\n=== Lighthouse Median Summary ===');
  console.log(`URL: ${url}`);
  console.log(`Runs: ${RUNS}`);
  console.log(
    `Scores -> Perf: ${scoreSummary.performance} / A11y: ${scoreSummary.accessibility} / Best: ${scoreSummary['best-practices']} / SEO: ${scoreSummary.seo}`,
  );
  console.log(
    `Metrics -> LCP: ${metricSummary['largest-contentful-paint']}ms, TBT: ${metricSummary['total-blocking-time']}ms, CLS: ${metricSummary['cumulative-layout-shift']}, SI: ${metricSummary['speed-index']}ms, FCP: ${metricSummary['first-contentful-paint']}ms`,
  );
  console.log(`Reports: ${outDir}`);
}
