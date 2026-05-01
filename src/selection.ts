type CaretPos = { start: number; end: number };

const getTextOffset = (root: Node, node: Node, offset: number): number => {
	let length = 0;
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

	while (walker.nextNode()) {
		const current = walker.currentNode;
		if (current === node) return length + offset;
		length += current.textContent?.length ?? 0;
	}

	return length;
};

const findNodeAtOffset = (root: Node, target: number): [Node, number] => {
	let remaining = target;
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

	while (walker.nextNode()) {
		const node = walker.currentNode;
		const len = node.textContent?.length ?? 0;
		if (remaining <= len) return [node, remaining];
		remaining -= len;
	}

	return [root, 0];
};

export const saveCaretPosition = (el: HTMLElement): CaretPos | null => {
	const sel = window.getSelection();
	if (!sel?.rangeCount) return null;

	const range = sel.getRangeAt(0);
	if (!el.contains(range.commonAncestorContainer)) return null;

	return {
		start: getTextOffset(el, range.startContainer, range.startOffset),
		end: getTextOffset(el, range.endContainer, range.endOffset),
	};
};

export const restoreCaretPosition = (el: HTMLElement, pos: CaretPos): void => {
	const sel = window.getSelection();
	if (!sel) return;

	try {
		const range = document.createRange();
		const [startNode, startOff] = findNodeAtOffset(el, pos.start);
		const [endNode, endOff] = findNodeAtOffset(el, pos.end);

		range.setStart(startNode, startOff);
		range.setEnd(endNode, endOff);

		sel.removeAllRanges();
		sel.addRange(range);
	} catch {
		// Edge case with complex selections — silently ignore
	}
};

export const getRange = (): Range | null => {
	const sel = window.getSelection();
	return sel?.rangeCount ? sel.getRangeAt(0) : null;
};

export const getSelection = (): Selection | null => window.getSelection();

export const wrapSelection = (
	tag: string,
	attrs?: Record<string, string>,
): void => {
	const sel = window.getSelection();
	if (!sel?.rangeCount) return;

	const range = sel.getRangeAt(0);
	const wrapper = document.createElement(tag);

	if (attrs) {
		for (const [k, v] of Object.entries(attrs)) {
			wrapper.setAttribute(k, v);
		}
	}

	try {
		range.surroundContents(wrapper);
	} catch {
		const fragment = range.extractContents();
		wrapper.appendChild(fragment);
		range.insertNode(wrapper);
	}

	sel.removeAllRanges();
	const newRange = document.createRange();
	newRange.selectNodeContents(wrapper);
	sel.addRange(newRange);
};

export const insertHTML = (html: string): void => {
	const sel = window.getSelection();
	if (!sel?.rangeCount) return;

	const range = sel.getRangeAt(0);
	range.deleteContents();

	const fragment = range.createContextualFragment(html);
	const lastNode = fragment.lastChild;
	range.insertNode(fragment);

	if (lastNode) {
		const newRange = document.createRange();
		newRange.setStartAfter(lastNode);
		newRange.collapse(true);
		sel.removeAllRanges();
		sel.addRange(newRange);
	}
};

export const caretRangeFromPoint = (x: number, y: number): Range | null => {
	// biome-ignore lint/suspicious/noExplicitAny: cross-browser API detection requires any
	const d = document as any;
	if (typeof d.caretRangeFromPoint === "function") {
		return d.caretRangeFromPoint(x, y) as Range | null;
	}
	if (typeof d.caretPositionFromPoint === "function") {
		const pos = d.caretPositionFromPoint(x, y) as {
			offsetNode: Node;
			offset: number;
		} | null;
		if (!pos) return null;
		const r = document.createRange();
		r.setStart(pos.offsetNode, pos.offset);
		r.collapse(true);
		return r;
	}
	return null;
};
