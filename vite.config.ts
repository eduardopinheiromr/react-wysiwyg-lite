import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

const reactRuntimePattern =
	/(?:^|[/\\])react[/\\]cjs[/\\]react-jsx(?:-dev)?-runtime(?:\.(?:production\.min|development))?\.js$/;

const reactRuntimeEntryPattern =
	/(?:^|[/\\])react[/\\]jsx(?:-dev)?-runtime(?:\.js)?$/;

const isExternalDependency = (id: string) =>
	id === "react" ||
	id === "react-dom" ||
	id === "react/jsx-runtime" ||
	id === "react/jsx-dev-runtime" ||
	reactRuntimeEntryPattern.test(id) ||
	reactRuntimePattern.test(id);

export default defineConfig({
	plugins: [
		react(),
		dts({
			include: ["src"],
			exclude: ["src/**/*.test.*", "src/test-setup.ts"],
			insertTypesEntry: true,
		}),
	],
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "ReactWysiwygLite",
			formats: ["es", "cjs", "umd"],
			fileName: (format) => {
				if (format === "es") return "index.js";
				if (format === "cjs") return "index.cjs";
				return "index.umd.js";
			},
		},
		rollupOptions: {
			external: isExternalDependency,
			output: {
				globals: {
					react: "React",
					"react-dom": "ReactDOM",
					"react/jsx-runtime": "jsxRuntime",
					"react/jsx-dev-runtime": "jsxRuntimeDev",
				},
				assetFileNames: (info) =>
					info.name === "style.css" ? "styles.css" : (info.name ?? ""),
			},
		},
		copyPublicDir: false,
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test-setup.ts"],
		globals: true,
		css: false,
	},
});
