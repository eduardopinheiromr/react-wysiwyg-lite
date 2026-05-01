import {
	type ClipboardEvent,
	type DragEvent,
	type ForwardedRef,
	type ChangeEvent as ReactChangeEvent,
	type MouseEvent as ReactMouseEvent,
	createElement,
	forwardRef,
	useEffect,
	useRef,
	useState,
} from "react";
import { useEditorContext } from "./context";
import {
	buildImageHTML,
	escapeHTML,
	normalizeHTML,
	sanitizeEditorHTML,
	sanitizeLinkURL,
	sanitizePastedHTML,
} from "./html";
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

const IMAGE_SELECTED_ATTR = "data-rsw-image-selected";
const TABLE_CELL_SELECTED_ATTR = "data-rsw-table-cell-selected";
const IMAGE_WRAP_WIDTH = "40%";

type FloatingToolbarPosition = { top: number; left: number };

const getClosestElement = <T extends Element>(
	node: Node | null,
	selector: string,
): T | null => {
	if (!node) return null;
	if (node instanceof Element) return node.closest(selector) as T | null;
	return node.parentElement?.closest(selector) as T | null;
};

const getFloatingToolbarPosition = (
	rect: { top: number; bottom: number; left: number; width: number },
	toolbar: HTMLDivElement | null,
): FloatingToolbarPosition => {
	const toolbarWidth = toolbar?.offsetWidth ?? 0;
	const left = Math.min(
		Math.max(8, rect.left + rect.width / 2 - toolbarWidth / 2),
		window.innerWidth - toolbarWidth - 8,
	);
	const top = rect.top > 56 ? rect.top - 44 : rect.bottom + 8;

	return { top, left };
};

const getRangeRect = (range: Range) => {
	const rect =
		typeof range.getBoundingClientRect === "function"
			? range.getBoundingClientRect()
			: null;

	if (rect && (rect.width > 0 || rect.height > 0)) {
		return rect;
	}

	const parent =
		range.commonAncestorContainer instanceof Element
			? range.commonAncestorContainer
			: range.commonAncestorContainer.parentElement;
	const fallback = parent?.getBoundingClientRect();
	const top = fallback?.top ?? 16;

	return {
		top,
		bottom: fallback?.bottom ?? top + 24,
		left: fallback?.left ?? 16,
		width: fallback?.width ?? 0,
	};
};

const getImageToolbarPosition = (
	img: HTMLImageElement,
	toolbar: HTMLDivElement | null,
): FloatingToolbarPosition => {
	return getFloatingToolbarPosition(img.getBoundingClientRect(), toolbar);
};

const getRangeToolbarPosition = (
	range: Range,
	toolbar: HTMLDivElement | null,
): FloatingToolbarPosition => {
	return getFloatingToolbarPosition(getRangeRect(range), toolbar);
};

const getTableToolbarPosition = (
	cell: HTMLTableCellElement,
	toolbar: HTMLDivElement | null,
): FloatingToolbarPosition => {
	return getFloatingToolbarPosition(cell.getBoundingClientRect(), toolbar);
};

const setImageSize = (img: HTMLImageElement, width: string) => {
	img.style.width = width;
	img.style.maxWidth = "100%";
	img.style.height = "auto";
};

const setImageBlockAlignment = (
	img: HTMLImageElement,
	alignment: "left" | "center" | "right",
) => {
	img.style.display = "block";
	img.style.float = "";
	img.style.marginTop = "4px";
	img.style.marginBottom = "4px";

	if (alignment === "left") {
		img.style.marginLeft = "0";
		img.style.marginRight = "0";
		return;
	}

	if (alignment === "center") {
		img.style.marginLeft = "auto";
		img.style.marginRight = "auto";
		return;
	}

	img.style.marginLeft = "auto";
	img.style.marginRight = "0";
};

const setImageWrapAlignment = (
	img: HTMLImageElement,
	alignment: "left" | "right",
) => {
	img.style.display = "block";
	img.style.float = alignment;
	img.style.marginTop = "4px";
	img.style.marginBottom = "8px";

	if (!img.style.width) {
		setImageSize(img, IMAGE_WRAP_WIDTH);
	}

	if (alignment === "left") {
		img.style.marginLeft = "0";
		img.style.marginRight = "16px";
		return;
	}

	img.style.marginLeft = "16px";
	img.style.marginRight = "0";
};

const createTableCell = (
	tagName: "td" | "th",
	label: string,
): HTMLTableCellElement => {
	const cell = document.createElement(tagName);
	const paragraph = document.createElement("p");
	paragraph.textContent = label;
	cell.appendChild(paragraph);
	return cell;
};

const replaceTableCellTag = (
	cell: HTMLTableCellElement,
	tagName: "td" | "th",
): HTMLTableCellElement => {
	if (cell.tagName.toLowerCase() === tagName) return cell;

	const replacement = document.createElement(tagName);
	replacement.innerHTML = cell.innerHTML;
	replacement.colSpan = cell.colSpan;
	replacement.rowSpan = cell.rowSpan;
	replacement.style.cssText = cell.style.cssText;
	replacement.className = cell.className;
	cell.replaceWith(replacement);
	return replacement;
};

const insertTableRow = (
	cell: HTMLTableCellElement,
	after: boolean,
	label: string,
): HTMLTableCellElement => {
	const row = cell.parentElement;
	if (!(row instanceof HTMLTableRowElement)) return cell;

	const newRow = document.createElement("tr");
	for (const currentCell of Array.from(row.cells)) {
		newRow.appendChild(
			createTableCell(
				currentCell.tagName.toLowerCase() === "th" ? "th" : "td",
				label,
			),
		);
	}

	if (after) {
		row.after(newRow);
	} else {
		row.before(newRow);
	}

	return newRow.cells[
		Math.min(cell.cellIndex, newRow.cells.length - 1)
	] as HTMLTableCellElement;
};

const insertTableColumn = (
	cell: HTMLTableCellElement,
	after: boolean,
	label: string,
): HTMLTableCellElement => {
	const row = cell.parentElement;
	const table = cell.closest("table");
	if (
		!(row instanceof HTMLTableRowElement) ||
		!(table instanceof HTMLTableElement)
	) {
		return cell;
	}

	const insertionIndex = cell.cellIndex + (after ? 1 : 0);

	for (const currentRow of Array.from(table.rows)) {
		const sourceCell =
			currentRow.cells[Math.min(cell.cellIndex, currentRow.cells.length - 1)];
		const newCell = createTableCell(
			sourceCell?.tagName.toLowerCase() === "th" ? "th" : "td",
			label,
		);
		const reference = currentRow.cells[insertionIndex] ?? null;
		currentRow.insertBefore(newCell, reference);
	}

	return row.cells[
		Math.min(insertionIndex, row.cells.length - 1)
	] as HTMLTableCellElement;
};

const deleteTableRow = (
	cell: HTMLTableCellElement,
): HTMLTableCellElement | null => {
	const row = cell.parentElement;
	const table = cell.closest("table");
	if (
		!(row instanceof HTMLTableRowElement) ||
		!(table instanceof HTMLTableElement)
	) {
		return null;
	}

	if (table.rows.length <= 1) {
		table.remove();
		return null;
	}

	const nextRow = row.nextElementSibling;
	const previousRow = row.previousElementSibling;
	const fallbackRow =
		nextRow instanceof HTMLTableRowElement
			? nextRow
			: previousRow instanceof HTMLTableRowElement
				? previousRow
				: null;
	const fallbackCell = fallbackRow?.cells[
		Math.min(cell.cellIndex, (fallbackRow?.cells.length ?? 1) - 1)
	] as HTMLTableCellElement | undefined;

	row.remove();
	return fallbackCell ?? null;
};

const deleteTableColumn = (
	cell: HTMLTableCellElement,
): HTMLTableCellElement | null => {
	const row = cell.parentElement;
	const table = cell.closest("table");
	if (
		!(row instanceof HTMLTableRowElement) ||
		!(table instanceof HTMLTableElement)
	) {
		return null;
	}

	const totalColumns = row.cells.length;
	if (totalColumns <= 1) {
		table.remove();
		return null;
	}

	const fallbackIndex =
		cell.cellIndex === totalColumns - 1
			? cell.cellIndex - 1
			: cell.cellIndex + 1;

	for (const currentRow of Array.from(table.rows)) {
		currentRow.cells[cell.cellIndex]?.remove();
	}

	return row.cells[
		Math.max(0, Math.min(fallbackIndex, row.cells.length - 1))
	] as HTMLTableCellElement | null;
};

const toggleTableHeaderRow = (
	cell: HTMLTableCellElement,
): HTMLTableCellElement | null => {
	const row = cell.parentElement;
	if (!(row instanceof HTMLTableRowElement)) return null;

	const useHeaderCells = Array.from(row.cells).some(
		(currentCell) => currentCell.tagName.toLowerCase() !== "th",
	);
	let selectedReplacement: HTMLTableCellElement | null = null;

	for (const currentCell of Array.from(row.cells)) {
		const replacement = replaceTableCellTag(
			currentCell as HTMLTableCellElement,
			useHeaderCells ? "th" : "td",
		);
		if (currentCell === cell) {
			selectedReplacement = replacement;
		}
	}

	return selectedReplacement;
};

const setTableCellAlignment = (
	cell: HTMLTableCellElement,
	alignment: "left" | "center" | "right",
): HTMLTableCellElement => {
	cell.style.textAlign = alignment;
	return cell;
};

const FloatingToolbarButton = ({
	label,
	title,
	onMouseDown,
	destructive,
}: {
	label: string;
	title: string;
	onMouseDown: (event: ReactMouseEvent<HTMLButtonElement>) => void;
	destructive?: boolean;
}) => (
	<button
		type="button"
		className="rsw-image-tool"
		title={title}
		aria-label={title}
		onMouseDown={onMouseDown}
		data-destructive={destructive || undefined}
	>
		{label}
	</button>
);

export const ContentEditable = forwardRef(function ContentEditable(
	{
		value = "",
		name,
		disabled,
		tagName = "div",
		className,
		onChange,
		onPaste,
		onClick: userOnClick,
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
	const imageToolbarRef = useRef<HTMLDivElement>(null);
	const selectionToolbarRef = useRef<HTMLDivElement>(null);
	const selectionLinkInputRef = useRef<HTMLInputElement>(null);
	const tableToolbarRef = useRef<HTMLDivElement>(null);
	const savedSelectionRangeRef = useRef<Range | null>(null);
	const selectedImageRef = useRef<HTMLImageElement | null>(null);
	const selectedTableCellRef = useRef<HTMLTableCellElement | null>(null);
	const [imageToolbar, setImageToolbar] =
		useState<FloatingToolbarPosition | null>(null);
	const [selectionToolbar, setSelectionToolbar] =
		useState<FloatingToolbarPosition | null>(null);
	const [selectionLinkOpen, setSelectionLinkOpen] = useState(false);
	const [selectionLinkUrl, setSelectionLinkUrl] = useState("https://");
	const [tableToolbar, setTableToolbar] =
		useState<FloatingToolbarPosition | null>(null);
	const { dictionary, selectionTick, setEl, getCommandAPI, getOnImportImage } =
		useEditorContext();

	const clearSelectedImage = () => {
		selectedImageRef.current?.removeAttribute(IMAGE_SELECTED_ATTR);
		selectedImageRef.current = null;
		setImageToolbar(null);
	};

	const updateImageToolbar = (img: HTMLImageElement) => {
		setImageToolbar(getImageToolbarPosition(img, imageToolbarRef.current));
	};

	const clearSelectionToolbar = () => {
		savedSelectionRangeRef.current = null;
		setSelectionToolbar(null);
		setSelectionLinkOpen(false);
	};

	const updateSelectionToolbar = (range: Range) => {
		savedSelectionRangeRef.current = range.cloneRange();
		setSelectionToolbar(
			getRangeToolbarPosition(range, selectionToolbarRef.current),
		);
	};

	const clearSelectedTableCell = () => {
		selectedTableCellRef.current?.removeAttribute(TABLE_CELL_SELECTED_ATTR);
		selectedTableCellRef.current = null;
		setTableToolbar(null);
	};

	const updateTableToolbar = (cell: HTMLTableCellElement) => {
		setTableToolbar(getTableToolbarPosition(cell, tableToolbarRef.current));
	};

	const selectTableCell = (cell: HTMLTableCellElement) => {
		if (selectedTableCellRef.current !== cell) {
			selectedTableCellRef.current?.removeAttribute(TABLE_CELL_SELECTED_ATTR);
			selectedTableCellRef.current = cell;
			cell.setAttribute(TABLE_CELL_SELECTED_ATTR, "true");
		}

		updateTableToolbar(cell);
	};

	const restoreSavedSelection = () => {
		const selection = window.getSelection();
		if (!selection || !savedSelectionRangeRef.current) return false;

		selection.removeAllRanges();
		selection.addRange(savedSelectionRangeRef.current);
		return true;
	};

	const syncFloatingToolbars = () => {
		if (selectionLinkOpen) return;

		const el = elRef.current;
		const selection = window.getSelection();
		if (!el || !selection?.rangeCount) {
			clearSelectionToolbar();
			clearSelectedTableCell();
			return;
		}

		const range = selection.getRangeAt(0);
		if (!el.contains(range.commonAncestorContainer)) {
			clearSelectionToolbar();
			clearSelectedTableCell();
			return;
		}

		const selectedText = selection.toString().trim();
		if (!range.collapsed && selectedText.length > 0) {
			clearSelectedImage();
			clearSelectedTableCell();
			updateSelectionToolbar(range);
			return;
		}

		clearSelectionToolbar();

		const tableCell = getClosestElement<HTMLTableCellElement>(
			range.commonAncestorContainer,
			"td,th",
		);
		if (tableCell) {
			clearSelectedImage();
			selectTableCell(tableCell);
			return;
		}

		clearSelectedTableCell();
	};

	const selectImage = (img: HTMLImageElement) => {
		if (selectedImageRef.current !== img) {
			selectedImageRef.current?.removeAttribute(IMAGE_SELECTED_ATTR);
			selectedImageRef.current = img;
			img.setAttribute(IMAGE_SELECTED_ATTR, "true");
		}

		updateImageToolbar(img);
	};

	const applyToSelectedImage =
		(action: (img: HTMLImageElement) => void) =>
		(event: ReactMouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			const img = selectedImageRef.current;
			if (!img || !elRef.current?.contains(img)) {
				clearSelectedImage();
				return;
			}

			action(img);
			updateImageToolbar(img);
			elRef.current?.focus();
		};

	const applyToSelection =
		(action: (api: NonNullable<ReturnType<typeof getCommandAPI>>) => void) =>
		(event: ReactMouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			const api = getCommandAPI();
			if (!api || !restoreSavedSelection()) return;

			api.focus();
			action(api);
			setSelectionLinkOpen(false);
			requestAnimationFrame(() => {
				syncFloatingToolbars();
			});
		};

	const applyToSelectedTableCell =
		(action: (cell: HTMLTableCellElement) => HTMLTableCellElement | null) =>
		(event: ReactMouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			const cell = selectedTableCellRef.current;
			if (!cell || !elRef.current?.contains(cell)) {
				clearSelectedTableCell();
				return;
			}

			const nextCell = action(cell);
			if (nextCell && elRef.current.contains(nextCell)) {
				selectTableCell(nextCell);
				const range = document.createRange();
				range.selectNodeContents(nextCell);
				range.collapse(true);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);
			} else {
				clearSelectedTableCell();
			}

			elRef.current?.focus();
		};

	const toggleSelectionLinkEditor = (
		event: ReactMouseEvent<HTMLButtonElement>,
	) => {
		event.preventDefault();
		const api = getCommandAPI();
		if (!api || !savedSelectionRangeRef.current) return;

		const anchor = getClosestElement<HTMLAnchorElement>(
			savedSelectionRangeRef.current.commonAncestorContainer,
			"a",
		);
		if (anchor) {
			api.focus();
			restoreSavedSelection();
			api.exec("unlink");
			requestAnimationFrame(() => {
				syncFloatingToolbars();
			});
			return;
		}

		setSelectionLinkUrl(dictionary.link.placeholder);
		setSelectionLinkOpen(true);
		requestAnimationFrame(() => {
			selectionLinkInputRef.current?.focus();
			selectionLinkInputRef.current?.select();
		});
	};

	const applySelectionLink = () => {
		const api = getCommandAPI();
		const safeUrl = sanitizeLinkURL(selectionLinkUrl);
		if (!api || !safeUrl || !restoreSavedSelection()) return;

		api.focus();
		api.exec("createLink", safeUrl);
		setSelectionLinkOpen(false);
		requestAnimationFrame(() => {
			syncFloatingToolbars();
		});
	};

	useEffect(() => {
		onChangeRef.current = onChange;
		nameRef.current = name;
	});

	useEffect(
		() => () => {
			selectedImageRef.current?.removeAttribute(IMAGE_SELECTED_ATTR);
			selectedTableCellRef.current?.removeAttribute(TABLE_CELL_SELECTED_ATTR);
		},
		[],
	);

	// Register element in context + forward ref
	useEffect(() => {
		syncFloatingToolbars();
	}, [selectionTick, selectionLinkOpen]);

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
		const sanitizedValue = sanitizeEditorHTML(value);
		el.innerHTML = sanitizedValue;
		htmlRef.current = sanitizedValue;
	}, []);

	// Sync value prop → DOM without losing caret position
	useEffect(() => {
		const el = elRef.current;
		if (!el) return;
		const sanitizedValue = sanitizeEditorHTML(value);
		if (normalizeHTML(htmlRef.current) === normalizeHTML(sanitizedValue)) {
			return;
		}

		clearSelectedImage();
		htmlRef.current = sanitizedValue;
		const caret = saveCaretPosition(el);
		el.innerHTML = sanitizedValue;
		if (caret) restoreCaretPosition(el, caret);
	}, [value]);

	// MutationObserver — stable, not re-connected on re-renders
	useEffect(() => {
		const el = elRef.current;
		if (!el) return;

		const observer = new MutationObserver(() => {
			if (selectedImageRef.current && !el.contains(selectedImageRef.current)) {
				clearSelectedImage();
			}

			let html = el.innerHTML;
			const sanitizedHTML = sanitizeEditorHTML(html);
			if (normalizeHTML(html) !== normalizeHTML(sanitizedHTML)) {
				const caret = saveCaretPosition(el);
				el.innerHTML = sanitizedHTML;
				if (caret) restoreCaretPosition(el, caret);
				html = sanitizedHTML;
			}

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
			attributeFilter: ["style", "class", "href", "src", "colspan", "rowspan"],
		});

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!imageToolbar) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (imageToolbarRef.current?.contains(target)) return;
			if (
				target instanceof HTMLImageElement &&
				selectedImageRef.current === target
			) {
				return;
			}

			clearSelectedImage();
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				clearSelectedImage();
			}
		};

		const handleResize = () => {
			const img = selectedImageRef.current;
			if (!img) return;
			updateImageToolbar(img);
		};

		const handleScroll = () => {
			clearSelectedImage();
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		window.addEventListener("resize", handleResize);
		elRef.current?.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("resize", handleResize);
			elRef.current?.removeEventListener("scroll", handleScroll);
		};
	}, [imageToolbar]);

	useEffect(() => {
		if (!selectionToolbar) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (selectionToolbarRef.current?.contains(target)) return;
			clearSelectionToolbar();
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				clearSelectionToolbar();
			}
		};

		const handleResize = () => {
			if (!savedSelectionRangeRef.current) return;
			setSelectionToolbar(
				getRangeToolbarPosition(
					savedSelectionRangeRef.current,
					selectionToolbarRef.current,
				),
			);
		};

		const handleScroll = () => {
			clearSelectionToolbar();
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		window.addEventListener("resize", handleResize);
		elRef.current?.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("resize", handleResize);
			elRef.current?.removeEventListener("scroll", handleScroll);
		};
	}, [selectionToolbar]);

	useEffect(() => {
		if (!tableToolbar) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (tableToolbarRef.current?.contains(target)) return;
			if (selectedTableCellRef.current?.closest("table")?.contains(target))
				return;
			clearSelectedTableCell();
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				clearSelectedTableCell();
			}
		};

		const handleResize = () => {
			const cell = selectedTableCellRef.current;
			if (!cell) return;
			updateTableToolbar(cell);
		};

		const handleScroll = () => {
			clearSelectedTableCell();
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		window.addEventListener("resize", handleResize);
		elRef.current?.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("resize", handleResize);
			elRef.current?.removeEventListener("scroll", handleScroll);
		};
	}, [tableToolbar]);

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
			insertHTML(escapeHTML(text).replace(/\n/g, "<br>"));
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
				let image: {
					src: string;
					alt: string;
					width?: number;
					height?: number;
				};

				if (onImport) {
					try {
						const result = await onImport(file);
						if (typeof result === "string") {
							image = { src: result, alt: file.name };
						} else {
							image = {
								src: result.url,
								alt: result.alt ?? file.name,
								...(result.width !== undefined ? { width: result.width } : {}),
								...(result.height !== undefined
									? { height: result.height }
									: {}),
							};
						}
					} catch {
						continue;
					}
				} else {
					try {
						image = { src: await fileToDataUrl(file), alt: file.name };
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
				const imageHTML = buildImageHTML(image);
				if (imageHTML) {
					api?.insertHTML(imageHTML);
				}
			}
		})();
	};

	const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
		const target = event.target;
		if (target instanceof HTMLImageElement) {
			clearSelectionToolbar();
			clearSelectedTableCell();
			selectImage(target);
		} else if (target instanceof Node) {
			const tableCell = getClosestElement<HTMLTableCellElement>(
				target,
				"td,th",
			);
			if (tableCell) {
				clearSelectionToolbar();
				clearSelectedImage();
				selectTableCell(tableCell);
			} else {
				clearSelectedImage();
				clearSelectedTableCell();
			}
		} else {
			clearSelectedImage();
		}

		userOnClick?.(event);
	};

	return (
		<>
			{createElement(tagName, {
				...rest,
				ref: elRef,
				className: ["rsw-ce", className].filter(Boolean).join(" "),
				contentEditable: !disabled,
				suppressContentEditableWarning: true,
				"data-placeholder": placeholder,
				onPaste: handlePaste,
				onDragOver: handleDragOver,
				onDrop: handleDrop,
				onClick: handleClick,
			})}
			{selectionToolbar ? (
				<div
					ref={selectionToolbarRef}
					className="rsw-selection-toolbar"
					style={{
						position: "fixed",
						top: selectionToolbar.top,
						left: selectionToolbar.left,
					}}
				>
					<div className="rsw-selection-toolbar-group">
						<FloatingToolbarButton
							label="H1"
							title={dictionary.toolbar.heading1}
							onMouseDown={applyToSelection((api) =>
								api.exec("formatBlock", "<h1>"),
							)}
						/>
						<FloatingToolbarButton
							label="H2"
							title={dictionary.toolbar.heading2}
							onMouseDown={applyToSelection((api) =>
								api.exec("formatBlock", "<h2>"),
							)}
						/>
						<FloatingToolbarButton
							label="H3"
							title={dictionary.toolbar.heading3}
							onMouseDown={applyToSelection((api) =>
								api.exec("formatBlock", "<h3>"),
							)}
						/>
					</div>
					<div className="rsw-separator" aria-hidden />
					<div className="rsw-selection-toolbar-group">
						<FloatingToolbarButton
							label="B"
							title={dictionary.toolbar.bold}
							onMouseDown={applyToSelection((api) => api.exec("bold"))}
						/>
						<FloatingToolbarButton
							label="I"
							title={dictionary.toolbar.italic}
							onMouseDown={applyToSelection((api) => api.exec("italic"))}
						/>
						<FloatingToolbarButton
							label="U"
							title={dictionary.toolbar.underline}
							onMouseDown={applyToSelection((api) => api.exec("underline"))}
						/>
						<FloatingToolbarButton
							label="Tx"
							title={dictionary.toolbar.clearFormatting}
							onMouseDown={applyToSelection((api) => api.exec("removeFormat"))}
						/>
					</div>
					<div className="rsw-separator" aria-hidden />
					<div className="rsw-selection-toolbar-group">
						<FloatingToolbarButton
							label="UL"
							title={dictionary.toolbar.bulletList}
							onMouseDown={applyToSelection((api) =>
								api.exec("insertUnorderedList"),
							)}
						/>
						<FloatingToolbarButton
							label="OL"
							title={dictionary.toolbar.numberedList}
							onMouseDown={applyToSelection((api) =>
								api.exec("insertOrderedList"),
							)}
						/>
						<FloatingToolbarButton
							label="Ln"
							title={dictionary.toolbar.link}
							onMouseDown={toggleSelectionLinkEditor}
						/>
					</div>
					{selectionLinkOpen ? (
						<>
							<div className="rsw-separator" aria-hidden />
							<input
								ref={selectionLinkInputRef}
								type="url"
								value={selectionLinkUrl}
								onChange={(event: ReactChangeEvent<HTMLInputElement>) =>
									setSelectionLinkUrl(event.target.value)
								}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										applySelectionLink();
									}
								}}
								placeholder={dictionary.link.placeholder}
								className="rsw-link-input rsw-selection-link-input"
							/>
							<button
								type="button"
								className="rsw-link-apply"
								onMouseDown={(event) => {
									event.preventDefault();
									applySelectionLink();
								}}
							>
								{dictionary.link.apply}
							</button>
							<button
								type="button"
								className="rsw-link-cancel"
								onMouseDown={(event) => {
									event.preventDefault();
									setSelectionLinkOpen(false);
								}}
								title={dictionary.link.close}
								aria-label={dictionary.link.close}
							>
								X
							</button>
						</>
					) : null}
				</div>
			) : null}
			{imageToolbar ? (
				<div
					ref={imageToolbarRef}
					className="rsw-image-toolbar"
					style={{
						position: "fixed",
						top: imageToolbar.top,
						left: imageToolbar.left,
					}}
				>
					<div className="rsw-image-toolbar-group">
						<FloatingToolbarButton
							label="33"
							title={dictionary.imageToolbar.small}
							onMouseDown={applyToSelectedImage((img) =>
								setImageSize(img, "33%"),
							)}
						/>
						<FloatingToolbarButton
							label="50"
							title={dictionary.imageToolbar.medium}
							onMouseDown={applyToSelectedImage((img) =>
								setImageSize(img, "50%"),
							)}
						/>
						<FloatingToolbarButton
							label="100"
							title={dictionary.imageToolbar.large}
							onMouseDown={applyToSelectedImage((img) =>
								setImageSize(img, "100%"),
							)}
						/>
					</div>
					<div className="rsw-separator" aria-hidden />
					<div className="rsw-image-toolbar-group">
						<FloatingToolbarButton
							label="L"
							title={dictionary.imageToolbar.alignLeft}
							onMouseDown={applyToSelectedImage((img) =>
								setImageBlockAlignment(img, "left"),
							)}
						/>
						<FloatingToolbarButton
							label="C"
							title={dictionary.imageToolbar.alignCenter}
							onMouseDown={applyToSelectedImage((img) =>
								setImageBlockAlignment(img, "center"),
							)}
						/>
						<FloatingToolbarButton
							label="R"
							title={dictionary.imageToolbar.alignRight}
							onMouseDown={applyToSelectedImage((img) =>
								setImageBlockAlignment(img, "right"),
							)}
						/>
					</div>
					<div className="rsw-separator" aria-hidden />
					<div className="rsw-image-toolbar-group">
						<FloatingToolbarButton
							label="WL"
							title={dictionary.imageToolbar.wrapLeft}
							onMouseDown={applyToSelectedImage((img) =>
								setImageWrapAlignment(img, "left"),
							)}
						/>
						<FloatingToolbarButton
							label="WR"
							title={dictionary.imageToolbar.wrapRight}
							onMouseDown={applyToSelectedImage((img) =>
								setImageWrapAlignment(img, "right"),
							)}
						/>
					</div>
					<div className="rsw-separator" aria-hidden />
					<FloatingToolbarButton
						label="×"
						title={dictionary.imageToolbar.remove}
						destructive
						onMouseDown={(event) => {
							event.preventDefault();
							selectedImageRef.current?.remove();
							clearSelectedImage();
							elRef.current?.focus();
						}}
					/>
				</div>
			) : null}
			{tableToolbar ? (
				<div
					ref={tableToolbarRef}
					className="rsw-table-toolbar"
					style={{
						position: "fixed",
						top: tableToolbar.top,
						left: tableToolbar.left,
					}}
				>
					<div className="rsw-table-toolbar-group">
						<FloatingToolbarButton
							label="Hdr"
							title={dictionary.tableToolbar.toggleHeaderRow}
							onMouseDown={applyToSelectedTableCell(toggleTableHeaderRow)}
						/>
						<FloatingToolbarButton
							label="L"
							title={dictionary.tableToolbar.alignCellLeft}
							onMouseDown={applyToSelectedTableCell((cell) =>
								setTableCellAlignment(cell, "left"),
							)}
						/>
						<FloatingToolbarButton
							label="C"
							title={dictionary.tableToolbar.alignCellCenter}
							onMouseDown={applyToSelectedTableCell((cell) =>
								setTableCellAlignment(cell, "center"),
							)}
						/>
						<FloatingToolbarButton
							label="R"
							title={dictionary.tableToolbar.alignCellRight}
							onMouseDown={applyToSelectedTableCell((cell) =>
								setTableCellAlignment(cell, "right"),
							)}
						/>
					</div>
					<div className="rsw-separator" aria-hidden />
					<div className="rsw-table-toolbar-group">
						<FloatingToolbarButton
							label="R^"
							title={dictionary.tableToolbar.addRowAbove}
							onMouseDown={applyToSelectedTableCell((cell) =>
								insertTableRow(cell, false, dictionary.table.cellPlaceholder),
							)}
						/>
						<FloatingToolbarButton
							label="Rv"
							title={dictionary.tableToolbar.addRowBelow}
							onMouseDown={applyToSelectedTableCell((cell) =>
								insertTableRow(cell, true, dictionary.table.cellPlaceholder),
							)}
						/>
						<FloatingToolbarButton
							label="C<"
							title={dictionary.tableToolbar.addColumnLeft}
							onMouseDown={applyToSelectedTableCell((cell) =>
								insertTableColumn(
									cell,
									false,
									dictionary.table.cellPlaceholder,
								),
							)}
						/>
						<FloatingToolbarButton
							label="C>"
							title={dictionary.tableToolbar.addColumnRight}
							onMouseDown={applyToSelectedTableCell((cell) =>
								insertTableColumn(cell, true, dictionary.table.cellPlaceholder),
							)}
						/>
					</div>
					<div className="rsw-separator" aria-hidden />
					<div className="rsw-table-toolbar-group">
						<FloatingToolbarButton
							label="-R"
							title={dictionary.tableToolbar.deleteRow}
							onMouseDown={applyToSelectedTableCell(deleteTableRow)}
							destructive
						/>
						<FloatingToolbarButton
							label="-C"
							title={dictionary.tableToolbar.deleteColumn}
							onMouseDown={applyToSelectedTableCell(deleteTableColumn)}
							destructive
						/>
						<FloatingToolbarButton
							label="X"
							title={dictionary.tableToolbar.deleteTable}
							onMouseDown={applyToSelectedTableCell((cell) => {
								cell.closest("table")?.remove();
								return null;
							})}
							destructive
						/>
					</div>
				</div>
			) : null}
		</>
	);
});
