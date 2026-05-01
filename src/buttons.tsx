import type React from "react";
import {
	type ChangeEvent,
	type MouseEvent as ReactMouseEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { createButton } from "./button";
import { useEditorContext } from "./context";
import { escapeAttr } from "./html";

const icon = (path: string, size = 16) => (
	<svg
		aria-label="Button icon"
		viewBox="0 0 24 24"
		width={size}
		height={size}
		fill="currentColor"
		aria-hidden="true"
	>
		<path d={path} />
	</svg>
);

export const BtnBold = createButton(
	"Bold",
	<strong style={{ fontFamily: "serif", fontSize: "1em" }}>B</strong>,
	"bold",
);
export const BtnItalic = createButton(
	"Italic",
	<em style={{ fontFamily: "serif", fontSize: "1em" }}>I</em>,
	"italic",
);
export const BtnUnderline = createButton("Underline", <u>U</u>, "underline");
export const BtnStrikeThrough = createButton(
	"Strikethrough",
	<s>S</s>,
	"strikeThrough",
);
export const BtnUndo = createButton(
	"Undo",
	icon(
		"M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
	),
	"undo",
);
export const BtnRedo = createButton(
	"Redo",
	icon(
		"M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z",
	),
	"redo",
);
export const BtnClearFormatting = createButton(
	"Clear formatting",
	icon(
		"M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.43L15.73 21 17 19.73 3.55 6.28 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z",
	),
	"removeFormat",
);
export const BtnBulletList = createButton(
	"Bullet list",
	icon(
		"M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z",
	),
	"insertUnorderedList",
);
export const BtnOrderedList = createButton(
	"Numbered list",
	icon(
		"M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-7v2h14V4H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z",
	),
	"insertOrderedList",
);
export const BtnAlignLeft = createButton(
	"Align left",
	icon(
		"M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z",
	),
	"justifyLeft",
);
export const BtnAlignCenter = createButton(
	"Align center",
	icon(
		"M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z",
	),
	"justifyCenter",
);
export const BtnAlignRight = createButton(
	"Align right",
	icon(
		"M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z",
	),
	"justifyRight",
);
export const BtnSubscript = createButton(
	"Subscript",
	<span style={{ fontSize: "0.9em" }}>
		x<sub>2</sub>
	</span>,
	"subscript",
);
export const BtnSuperscript = createButton(
	"Superscript",
	<span style={{ fontSize: "0.9em" }}>
		x<sup>2</sup>
	</span>,
	"superscript",
);
export const BtnIndent = createButton(
	"Indent",
	icon(
		"M3 19h19v-2H3v2zm7-6h12v-2H10v2zm-7.59-5.59L7 11 2 6l4.59-4.41L8 3 3 8l5 5-1.41 1.41zM3 3v2h19V3H3z",
	),
	"indent",
);
export const BtnOutdent = createButton(
	"Outdent",
	icon(
		"M11 17h10v-2H11v2zm-8-5l5 5V7l-5 5zm0 9h19v-2H3v2zM3 3v2h19V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z",
	),
	"outdent",
);

// ─── BtnLink ────────────────────────────────────────────────────────────────
// Uses React-controlled state instead of the native Popover API.
// The Popover API's "light dismiss" fires on the mouseup outside the popover
// (i.e. on the button itself), which closed the popover immediately after open.

export const BtnLink = () => {
	const { getCommandAPI, selectionTick: _ } = useEditorContext();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const savedRange = useRef<Range | null>(null);
	const [url, setUrl] = useState("https://");
	const [open, setOpen] = useState(false);
	const [pos, setPos] = useState({ top: 0, left: 0 });

	// Close on outside pointer-down
	useEffect(() => {
		if (!open) return;
		const handler = (e: PointerEvent) => {
			if (
				popoverRef.current?.contains(e.target as Node) ||
				buttonRef.current?.contains(e.target as Node)
			)
				return;
			setOpen(false);
		};
		document.addEventListener("pointerdown", handler);
		return () => document.removeEventListener("pointerdown", handler);
	}, [open]);

	// Close on Escape
	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [open]);

	// Focus input when opened
	useEffect(() => {
		if (!open) return;
		requestAnimationFrame(() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		});
	}, [open]);

	const onMouseDown = (e: ReactMouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		const api = getCommandAPI();
		if (!api) return;
		api.focus();

		const range = api.getRange();
		const anchor = range?.commonAncestorContainer?.parentElement?.closest("a");
		if (anchor) {
			api.exec("unlink");
			return;
		}

		savedRange.current = range?.cloneRange() ?? null;
		setUrl("https://");

		const btn = buttonRef.current?.getBoundingClientRect();
		if (btn) {
			setPos({
				top: btn.bottom + 6,
				left: Math.min(btn.left, window.innerWidth - 320),
			});
		}
		setOpen(true);
	};

	const apply = () => {
		const trimmed = url.trim();
		if (!trimmed || !savedRange.current) return;
		const api = getCommandAPI();
		if (!api) return;
		const sel = window.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(savedRange.current);
		api.exec("createLink", trimmed);
		setOpen(false);
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			apply();
		}
	};

	return (
		<>
			<button
				ref={buttonRef}
				className="rsw-btn"
				onMouseDown={onMouseDown}
				tabIndex={-1}
				title="Link"
				type="button"
			>
				{icon(
					"M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
				)}
			</button>
			{open && (
				<div
					ref={popoverRef}
					className="rsw-link-popover"
					style={{ position: "fixed", top: pos.top, left: pos.left }}
				>
					<input
						name="link-url"
						ref={inputRef}
						type="url"
						value={url}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							setUrl(e.target.value)
						}
						onKeyDown={onKeyDown}
						placeholder="https://"
						className="rsw-link-input"
					/>
					<button type="button" className="rsw-link-apply" onClick={apply}>
						Apply
					</button>
					<button
						type="button"
						className="rsw-link-cancel"
						onClick={() => setOpen(false)}
						aria-label="Close"
					>
						{icon(
							"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
							14,
						)}
					</button>
				</div>
			)}
		</>
	);
};

// ─── BtnImage ───────────────────────────────────────────────────────────────

const fileToDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (ev) => resolve(ev.target?.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});

const insertImage = (
	api: ReturnType<ReturnType<typeof useEditorContext>["getCommandAPI"]>,
	savedRange: Range | null,
	src: string,
	alt: string,
) => {
	if (!api) return;
	if (savedRange) {
		const sel = window.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(savedRange);
	}
	api.focus();
	api.insertHTML(
		`<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="max-width:100%;height:auto;display:block;margin:4px 0;">`,
	);
};

export const BtnImage = () => {
	const { getCommandAPI, getOnImportImage } = useEditorContext();
	const fileRef = useRef<HTMLInputElement>(null);
	const savedRange = useRef<Range | null>(null);

	const onMouseDown = (e: ReactMouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		const api = getCommandAPI();
		if (!api) return;
		savedRange.current = api.getRange()?.cloneRange() ?? null;
		fileRef.current?.click();
	};

	const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";

		const api = getCommandAPI();
		const range = savedRange.current;
		const handler = getOnImportImage();

		if (handler) {
			void handler(file).then((result) => {
				const src = typeof result === "string" ? result : result.url;
				const alt =
					typeof result === "object" ? (result.alt ?? file.name) : file.name;
				insertImage(api, range, src, alt);
			});
		} else {
			void fileToDataUrl(file).then((src) => {
				insertImage(api, range, src, file.name);
			});
		}
	};

	return (
		<>
			<button
				className="rsw-btn"
				onMouseDown={onMouseDown}
				tabIndex={-1}
				title="Insert image"
				type="button"
			>
				{icon(
					"M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
				)}
			</button>
			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				style={{ display: "none" }}
				onChange={onFileChange}
			/>
		</>
	);
};
