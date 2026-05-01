import type { MouseEvent, ReactNode } from "react";
import { useEditorContext } from "./context";
import type { ButtonProps, Command, CreateButtonOptions } from "./types";

export const createButton = (
	title: string,
	content: ReactNode,
	command: Command,
	options: CreateButtonOptions = {},
) => {
	const Button = ({ className, ...rest }: ButtonProps) => {
		const { getCommandAPI, selectionTick: _ } = useEditorContext();

		const active = options.alwaysActive
			? false
			: typeof command === "string"
				? (() => {
						try {
							return document.queryCommandState(command);
						} catch {
							return false;
						}
					})()
				: false;

		const onMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			const api = getCommandAPI();
			if (!api) return;

			api.focus();

			if (typeof command === "string") {
				api.exec(command);
			} else {
				command(api);
			}
		};

		return (
			<button
				{...rest}
				className={["rsw-btn", className].filter(Boolean).join(" ")}
				data-active={active || undefined}
				onMouseDown={onMouseDown}
				tabIndex={-1}
				title={title}
				type="button"
			>
				{content}
			</button>
		);
	};

	Button.displayName = `Btn${title.replace(/\s+/g, "")}`;
	return Button;
};

export const Separator = () => <div className="rsw-separator" aria-hidden />;
