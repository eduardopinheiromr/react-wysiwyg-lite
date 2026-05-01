export const escapeAttr = (s: string): string =>
	s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const NBSP = /&nbsp;|\u202F|\u00A0/g;
const BR = /<br\s*\/?>/gi;
const EMPTY_BLOCK = /^(<(p|div|h[1-6]|li)><br\s*\/?><\/(p|div|h[1-6]|li)>)+$/i;

export const normalizeHTML = (html: string): string =>
	html.replace(NBSP, " ").replace(BR, "<br>");

export const isEmpty = (html: string): boolean =>
	!html || html === "<br>" || EMPTY_BLOCK.test(html.trim());

export const sanitizePastedHTML = (html: string): string => {
	const doc = new DOMParser().parseFromString(html, "text/html");

	const ALLOWED_TAGS = new Set([
		"A",
		"B",
		"STRONG",
		"I",
		"EM",
		"U",
		"S",
		"STRIKE",
		"P",
		"BR",
		"H1",
		"H2",
		"H3",
		"H4",
		"H5",
		"H6",
		"UL",
		"OL",
		"LI",
		"BLOCKQUOTE",
		"CODE",
		"PRE",
		"SPAN",
	]);

	const ALLOWED_ATTRS: Record<string, string[]> = {
		A: ["href", "target", "rel"],
		SPAN: ["style"],
		CODE: ["class"],
	};

	const walk = (node: Element) => {
		const children = Array.from(node.childNodes);

		for (const child of children) {
			if (child.nodeType === Node.TEXT_NODE) continue;

			if (child.nodeType === Node.ELEMENT_NODE) {
				const el = child as Element;
				const tag = el.tagName;

				if (!ALLOWED_TAGS.has(tag)) {
					el.replaceWith(...Array.from(el.childNodes));
					continue;
				}

				const allowed = ALLOWED_ATTRS[tag] ?? [];

				for (const attr of Array.from(el.attributes)) {
					if (!allowed.includes(attr.name)) el.removeAttribute(attr.name);
				}

				walk(el);
			} else {
				child.parentNode?.removeChild(child);
			}
		}
	};

	walk(doc.body);
	return doc.body.innerHTML;
};
