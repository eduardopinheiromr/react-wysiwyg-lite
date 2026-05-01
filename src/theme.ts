import type { CSSProperties } from "react";
import type { EditorTheme, EditorThemeInput } from "./types";

const defaultTheme: EditorTheme = {
	colors: {
		editorBackground: "#ffffff",
		editorBorder: "#e2e8f0",
		toolbarBackground: "#f8fafc",
		buttonText: "#374151",
		buttonHoverBackground: "#f1f5f9",
		buttonActiveBackground: "#e0e7ff",
		buttonActiveText: "#4f46e5",
		linkApplyBackground: "#4f46e5",
		linkApplyText: "#ffffff",
		linkApplyHoverBackground: "#4338ca",
		selectionBackground: "#c7d2fe",
		selectionText: "#1e1b4b",
	},
};

type ThemeStyle = CSSProperties & Partial<Record<`--rsw-${string}`, string>>;

export const mergeTheme = (theme?: EditorThemeInput): EditorTheme => ({
	colors: { ...defaultTheme.colors, ...theme?.colors },
});

export const buildThemeStyle = (
	theme?: EditorThemeInput,
): ThemeStyle | undefined => {
	if (!theme) return undefined;

	const { colors } = mergeTheme(theme);

	return {
		"--rsw-color-bg": colors.editorBackground,
		"--rsw-color-border": colors.editorBorder,
		"--rsw-color-toolbar-bg": colors.toolbarBackground,
		"--rsw-color-btn": colors.buttonText,
		"--rsw-color-btn-hover": colors.buttonHoverBackground,
		"--rsw-color-btn-active": colors.buttonActiveBackground,
		"--rsw-color-btn-active-text": colors.buttonActiveText,
		"--rsw-color-link-apply-bg": colors.linkApplyBackground,
		"--rsw-color-link-apply-text": colors.linkApplyText,
		"--rsw-color-link-apply-hover": colors.linkApplyHoverBackground,
		"--rsw-selection-bg": colors.selectionBackground,
		"--rsw-selection-text": colors.selectionText,
	};
};
