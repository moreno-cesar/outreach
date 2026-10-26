import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "coverage", "out"]);
const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".html",
  ".md",
  ".json",
  ".yml",
  ".yaml",
  ".svg",
]);

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      found.push(...sourceFiles(path));
      continue;
    }
    if (entry === "package-lock.json") continue;
    if (TEXT_EXT.has(extname(entry))) found.push(path);
  }
  return found;
}

describe("personal data", () => {
  it("does not ship real contact details or the old seed list", () => {
    const files = sourceFiles(ROOT);
    expect(files.length).toBeGreaterThan(0);
    const combined = files.map((path) => readFileSync(path, "utf8")).join("\n");

    const retiredSeed = ["SEED", "CONTACTS"].join("_");
    expect(combined.includes(retiredSeed)).toBe(false);

    const emails = combined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
    for (const email of emails) {
      const domain = email.split("@")[1]?.toLowerCase();
      expect(["example.com", "example.org", "example.net"]).toContain(domain);
    }

    const phones = combined.match(/\b\d{3}-\d{3}-\d{4}\b/g) ?? [];
    for (const phone of phones) {
      expect(phone.startsWith("555-01")).toBe(true);
    }
  });
});
