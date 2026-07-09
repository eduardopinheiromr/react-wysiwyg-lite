#!/usr/bin/env node
/**
 * CLI for react-wysiwyg-lite.
 * Installs the AI agent skill so coding assistants (Copilot, Claude, etc.)
 * can discover the library's full API surface.
 */

const fs = require("fs");
const path = require("path");

const SKILL_NAME = "react-wysiwyg-lite";
const SKILL_SRC = path.join(__dirname, "..", "skills", SKILL_NAME);
const USAGE = `
Usage: npx react-wysiwyg-lite install-skill [options]

Install the react-wysiwyg-lite skill into your project so AI agents
can help you integrate the WYSIWYG editor.

Options:
  --global       Install to ~/.agents/skills/ (available to all projects)
  --path <dir>   Install to a custom .agents/skills/ parent directory
  --help         Show this message

Examples:
  npx react-wysiwyg-lite install-skill              # Install in current project
  npx react-wysiwyg-lite install-skill --global     # Install globally
  npx react-wysiwyg-lite install-skill --path ~/my-project
`;

function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	if (command !== "install-skill" || args.includes("--help")) {
		console.log(USAGE);
		process.exit(command === "install-skill" ? 0 : 0);
	}

	const globalFlag = args.includes("--global");
	const pathIdx = args.indexOf("--path");
	const customPath = pathIdx !== -1 ? args[pathIdx + 1] : null;

	let targetDir;
	if (globalFlag) {
		targetDir = path.join(
			require("os").homedir(),
			".agents",
			"skills",
			SKILL_NAME,
		);
	} else if (customPath) {
		targetDir = path.join(customPath, ".agents", "skills", SKILL_NAME);
	} else {
		targetDir = path.join(process.cwd(), ".agents", "skills", SKILL_NAME);
	}

	if (!fs.existsSync(SKILL_SRC)) {
		console.error(`Error: Skill not found at ${SKILL_SRC}`);
		console.error("Make sure react-wysiwyg-lite is installed correctly.");
		process.exit(1);
	}

	if (fs.existsSync(targetDir)) {
		console.log(`Skill already installed at ${targetDir}`);
		console.log("To reinstall, delete the directory and run again.");
		process.exit(0);
	}

	fs.mkdirSync(path.dirname(targetDir), { recursive: true });
	copyRecursive(SKILL_SRC, targetDir);

	console.log(`Installed react-wysiwyg-lite skill at ${targetDir}`);
	console.log(
		"AI agents in this project can now help you integrate the WYSIWYG editor.",
	);
}

function copyRecursive(src, dest) {
	fs.mkdirSync(dest, { recursive: true });
	for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);
		if (entry.isDirectory()) {
			copyRecursive(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

main();
