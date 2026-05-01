import { type ForwardedRef, forwardRef } from "react";
import { ContentEditable } from "./contenteditable";
import { EditorProvider } from "./context";
import { buildThemeStyle } from "./theme";
import type { EditorProps } from "./types";

export const Editor = forwardRef(function Editor(
	{
		children,
		containerProps,
		onImportImage,
		dictionary,
		theme,
		...rest
	}: EditorProps,
	ref: ForwardedRef<HTMLDivElement>,
) {
	const {
		className: containerClass,
		style: containerStyle,
		...containerRest
	} = containerProps ?? {};
	const themeStyle = buildThemeStyle(theme);
	const mergedStyle =
		themeStyle || containerStyle
			? { ...themeStyle, ...containerStyle }
			: undefined;
	// Spread only when defined — required by exactOptionalPropertyTypes
	const providerProps = {
		...(onImportImage !== undefined ? { onImportImage } : {}),
		...(dictionary !== undefined ? { dictionary } : {}),
	};

	return (
		<EditorProvider {...providerProps}>
			<div
				{...containerRest}
				className={["rsw-editor", containerClass].filter(Boolean).join(" ")}
				{...(mergedStyle !== undefined ? { style: mergedStyle } : {})}
			>
				{children}
				<ContentEditable {...rest} ref={ref} />
			</div>
		</EditorProvider>
	);
});
