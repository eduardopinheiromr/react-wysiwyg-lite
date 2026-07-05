import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(__dirname, "..", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

const [major, minor, patch] = pkg.version.split(".").map(Number);
const nextPatch = patch + 1;
const nextVersion =
	nextPatch >= 10
		? `${major}.${minor + 1}.0`
		: `${major}.${minor}.${nextPatch}`;

pkg.version = nextVersion;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`);

console.log(`Bumped ${pkg.name}: ${pkg.version}`);
