import {
	type ClipboardEvent,
	type DragEvent,
	type ForwardedRef,
	createElement,
	forwardRef,
	useEffect,
	useRef,
} from "react";
import { useEditorContext } from "./context";
import { escapeAttr } from "./html";
import { normalizeHTML, sanitizePastedHTML } from "./html";
import {
	caretRangeFromPoint,
	insertHTML,
	restoreCaretPosition,
	saveCaretPosition,
} from "./selection";
import type { ContentEditableProps } from "./types";

const fileToDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => resolve(e.target?.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});

export const ContentEditable = forwardRef(function ContentEditable(
	{
		value = "",
		name,
		disabled,
		tagName = "div",
		className,
		onChange,
		onPaste,
		onDragOver: userOnDragOver,
		onDrop: userOnDrop,
		placeholder,
		...rest
	}: ContentEditableProps,
	ref: ForwardedRef<HTMLDivElement>,
) {
	const elRef = useRef<HTMLDivElement>(null);
	const htmlRef = useRef<string>("");
	const onChangeRef = useRef(onChange);
	const nameRef = useRef(name);
	const { setEl, getCommandAPI, getOnImportImage } = useEditorContext();

	useEffect(() => {
		onChangeRef.current = onChange;
		nameRef.current = name;
	});

	// Register element in context + forward ref
	useEffect(() => {
		const el = elRef.current;
		if (!el) return;

		setEl(el);

		if (typeof ref === "function") ref(el);
		else if (ref) ref.current = el;

		return () => setEl(null);
	}, []);

	// Initialize innerHTML on mount
	useEffect(() => {
		const el = elRef.current;
		if (!el) return;
		el.innerHTML = value;
		htmlRef.current = value;
	}, []);

	// Sync value prop → DOM without losing caret position
	useEffect(() => {
		const el = elRef.current;
		if (!el) return;
		if (normalizeHTML(htmlRef.current) === normalizeHTML(value)) return;

		htmlRef.current = value;
		const caret = saveCaretPosition(el);
		el.innerHTML = value;
		if (caret) restoreCaretPosition(el, caret);
	}, [value]);

	// MutationObserver — stable, not re-connected on re-renders
	useEffect(() => {
		const el = elRef.current;
		if (!el) return;

		const observer = new MutationObserver(() => {
			const html = el.innerHTML;
			if (normalizeHTML(html) === normalizeHTML(htmlRef.current)) return;

			htmlRef.current = html;
			onChangeRef.current?.({
				target: { value: html, name: nameRef.current },
			} as unknown as import("./types").ChangeEvent);
		});

		observer.observe(el, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["style", "class", "href", "src", "data-*"],
		});

		return () => observer.disconnect();
	}, []);

	const handlePaste = (e: ClipboardEvent<HTMLElement>) => {
		if (onPaste) {
			onPaste(e);
			return;
		}

		e.preventDefault();
		const html = e.clipboardData.getData("text/html");
		const text = e.clipboardData.getData("text/plain");

		if (html) {
			insertHTML(sanitizePastedHTML(html));
		} else if (text) {
			insertHTML(text.replace(/\n/g, "<br>"));
		}
	};

	const handleDragOver = (e: DragEvent<HTMLElement>) => {
		const hasImage = Array.from(e.dataTransfer.items).some((item) =>
			item.type.startsWith("image/"),
		);
		if (hasImage) {
			e.preventDefault();
			e.dataTransfer.dropEffect = "copy";
		}
		userOnDragOver?.(e);
	};

	const handleDrop = (e: DragEvent<HTMLElement>) => {
		const files = Array.from(e.dataTransfer.files).filter((f) =>
			f.type.startsWith("image/"),
		);
		if (!files.length) {
			userOnDrop?.(e);
			return;
		}

		e.preventDefault();

		const { clientX, clientY } = e;
		const api = getCommandAPI();
		const onImport = getOnImportImage();

		void (async () => {
			const range = caretRangeFromPoint(clientX, clientY);

			for (const file of files) {
				let src: string;
				let alt = file.name;

				if (onImport) {
					try {
						const result = await onImport(file);
						if (typeof result === "string") {
							src = result;
						} else {
							src = result.url;
							alt = result.alt ?? file.name;
						}
					} catch {
						continue;
					}
				} else {
					try {
						src = await fileToDataUrl(file);
					} catch {
						continue;
					}
				}

				if (range) {
					const sel = window.getSelection();
					sel?.removeAllRanges();
					sel?.addRange(range.cloneRange());
				}

				api?.focus();
				api?.insertHTML(
					`<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="max-width:100%;height:auto;display:block;margin:4px 0;">`,
				);
			}
		})();
	};

	return createElement(tagName, {
		...rest,
		ref: elRef,
		className: ["rsw-ce", className].filter(Boolean).join(" "),
		contentEditable: !disabled,
		suppressContentEditableWarning: true,
		"data-placeholder": placeholder,
		onPaste: handlePaste,
		onDragOver: handleDragOver,
		onDrop: handleDrop,
	});
});
