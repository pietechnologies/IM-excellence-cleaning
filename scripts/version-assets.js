// Keep static GitHub Pages deployments cache-safe without a build dependency.
const { createHash } = require("node:crypto");
const { readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "index.html");
const original = readFileSync(htmlPath, "utf8");
let updated = original;

for (const asset of ["css/style.css", "js/service-areas.js", "js/main.js"]) {
  const version = createHash("sha256")
    .update(readFileSync(path.join(root, asset)))
    .digest("hex")
    .slice(0, 12);
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Match the complete attribute, not URLs in copy or unrelated assets.
  const exactAttribute = new RegExp(
    `((?:href|src)=")${escaped}(?:\\?v=[^"]*)?(\")`,
    "g",
  );
  let found = false;
  updated = updated.replace(exactAttribute, (_, start, end) => {
    found = true;
    return `${start}${asset}?v=${version}${end}`;
  });
  if (!found) throw new Error(`No HTML reference found for ${asset}`);
}

if (process.argv.includes("--check")) {
  if (updated !== original) {
    console.error(
      "Asset versions are stale. Run npm run version:assets before publishing.",
    );
    process.exitCode = 1;
  }
} else if (updated !== original) {
  writeFileSync(htmlPath, updated);
  console.log("Updated stylesheet and script content versions in index.html.");
}
