#!/usr/bin/env node
/**
 * Post-install script for react-wysiwyg-lite.
 * Copies the AI agent skill into ~/.agents/skills/ so AI coding assistants
 * (Copilot, Claude, etc.) can discover the library's full API surface.
 *
 * Non-invasive: silently exits if the target directory doesn't exist.
 */

import { cpSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const src = join(__dirname, "..", "skills", "react-wysiwyg-lite");
const dest = join(homedir(), ".agents", "skills", "react-wysiwyg-lite");

// Only install if .agents/skills/ exists (user has AI agent tooling set up)
if (!existsSync(join(homedir(), ".agents", "skills"))) {
	process.exit(0);
}

try {
	cpSync(src, dest, { recursive: true, force: true });
	console.log("[react-wysiwyg-lite] AI agent skill installed to", dest);
} catch {
	// Silently ignore — skill is optional, don't break installs
}
