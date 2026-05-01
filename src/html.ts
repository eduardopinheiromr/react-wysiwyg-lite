import type { EditorDictionary } from "./types";

export const escapeAttr = (s: string): string =>
	s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

export const escapeHTML = (s: string): string =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const SAFE_LINK_PROTOCOLS = new Set(["http", "https", "mailto", "tel"]);
const SAFE_IMAGE_PROTOCOLS = new Set(["http", "https", "blob"]);
const DROP_CONTENT_TAGS = new Set([
	"SCRIPT",
	"STYLE",
	"IFRAME",
	"OBJECT",
	"EMBED",
	"META",
	"LINK",
	"BASE",
]);
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
	"DIV",
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
	"SUB",
	"SUP",
	"MARK",
	"HR",
	"IMG",
	"TABLE",
	"THEAD",
	"TBODY",
	"TFOOT",
	"TR",
	"TH",
	"TD",
]);
const ALLOWED_ATTRS: Record<string, string[]> = {
	A: ["href", "target", "rel", "class"],
	DIV: ["class"],
	P: ["class"],
	H1: ["class"],
	H2: ["class"],
	H3: ["class"],
	H4: ["class"],
	H5: ["class"],
	H6: ["class"],
	SPAN: ["style", "class"],
	MARK: ["class"],
	IMG: ["src", "alt", "width", "height", "style", "class"],
	TABLE: ["class"],
	THEAD: ["class"],
	TBODY: ["class"],
	TFOOT: ["class"],
	TR: ["class"],
	TH: ["colspan", "rowspan", "style", "class"],
	TD: ["colspan", "rowspan", "style", "class"],
	CODE: ["class"],
};
const SAFE_TARGETS = new Set(["_blank", "_self", "_parent", "_top"]);
const SAFE_REL_TOKENS = new Set(["noopener", "noreferrer", "nofollow"]);
const SAFE_CLASS_TOKEN = /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/;
const SAFE_DATA_IMAGE =
	/^data:image\/(?:png|jpeg|jpg|gif|webp|bmp|avif);base64,[a-z0-9+/=\s]+$/i;
const ALLOWED_STYLE_PROPERTIES = new Set([
	"color",
	"background-color",
	"font-weight",
	"font-style",
	"text-decoration",
	"text-align",
	"width",
	"height",
	"max-width",
	"margin",
	"margin-top",
	"margin-right",
	"margin-bottom",
	"margin-left",
	"display",
	"float",
]);

const sanitizeClassName = (value: string): string | null => {
	const tokens = value
		.split(/\s+/)
		.map((token) => token.trim())
		.filter((token) => SAFE_CLASS_TOKEN.test(token));

	return tokens.length ? tokens.join(" ") : null;
};

const sanitizeStyleValue = (value: string): string | null => {
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (
		/(expression\s*\(|url\s*\(|@import|javascript:|vbscript:|data:|<|>|\\)/i.test(
			trimmed,
		)
	) {
		return null;
	}
	if (!/^[#(),.%\w\s+\-/:]*$/i.test(trimmed)) {
		return null;
	}

	return trimmed;
};

const sanitizeStyleAttribute = (style: string): string | null => {
	const declarations: string[] = [];

	for (const declaration of style.split(";")) {
		const separatorIndex = declaration.indexOf(":");
		if (separatorIndex <= 0) continue;

		const property = declaration.slice(0, separatorIndex).trim().toLowerCase();
		const rawValue = declaration.slice(separatorIndex + 1);
		if (!ALLOWED_STYLE_PROPERTIES.has(property)) continue;

		const safeValue = sanitizeStyleValue(rawValue);
		if (!safeValue) continue;

		declarations.push(`${property}:${safeValue}`);
	}

	return declarations.length ? declarations.join(";") : null;
};

const sanitizePositiveInteger = (value: string, max = 8192): string | null => {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed < 1) return null;
	return String(Math.min(parsed, max));
};

const stripControlCharacters = (value: string): string =>
	Array.from(value)
		.filter((char) => {
			const code = char.charCodeAt(0);
			return code >= 32 && code !== 127;
		})
		.join("");

const sanitizeTextAttribute = (
	value: string,
	maxLength = 512,
): string | null => {
	const sanitized = stripControlCharacters(value).trim();
	return sanitized ? sanitized.slice(0, maxLength) : null;
};

const getScheme = (value: string): string | null => {
	const compact = stripControlCharacters(value).replace(/\s+/g, "").trim();
	const match = compact.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
	return match?.[1]?.toLowerCase() ?? null;
};

export const sanitizeLinkURL = (value: string): string | null => {
	const trimmed = value.trim();
	if (!trimmed) return null;

	const scheme = getScheme(trimmed);
	if (!scheme) return trimmed;

	return SAFE_LINK_PROTOCOLS.has(scheme) ? trimmed : null;
};

export const sanitizeImageURL = (value: string): string | null => {
	const trimmed = value.trim();
	if (!trimmed) return null;

	const scheme = getScheme(trimmed);
	if (!scheme) return trimmed;

	if (scheme === "data") {
		return SAFE_DATA_IMAGE.test(trimmed) ? trimmed : null;
	}

	return SAFE_IMAGE_PROTOCOLS.has(scheme) ? trimmed : null;
};

const sanitizeElementAttributes = (el: Element) => {
	const tag = el.tagName;
	const allowed = new Set(ALLOWED_ATTRS[tag] ?? []);

	for (const attr of Array.from(el.attributes)) {
		const name = attr.name.toLowerCase();
		const value = attr.value;

		if (!allowed.has(attr.name)) {
			el.removeAttribute(attr.name);
			continue;
		}

		if (name === "href") {
			const safeHref = sanitizeLinkURL(value);
			if (!safeHref) el.removeAttribute(attr.name);
			else el.setAttribute("href", safeHref);
			continue;
		}

		if (name === "src") {
			const safeSrc = sanitizeImageURL(value);
			if (!safeSrc) el.removeAttribute(attr.name);
			else el.setAttribute("src", safeSrc);
			continue;
		}

		if (name === "target") {
			if (!SAFE_TARGETS.has(value)) el.removeAttribute(attr.name);
			continue;
		}

		if (name === "rel") {
			const relTokens = value
				.split(/\s+/)
				.map((token) => token.trim().toLowerCase())
				.filter((token) => SAFE_REL_TOKENS.has(token));
			if (!relTokens.length) el.removeAttribute("rel");
			else el.setAttribute("rel", Array.from(new Set(relTokens)).join(" "));
			continue;
		}

		if (name === "class") {
			const safeClassName = sanitizeClassName(value);
			if (!safeClassName) el.removeAttribute("class");
			else el.setAttribute("class", safeClassName);
			continue;
		}

		if (name === "style") {
			const safeStyle = sanitizeStyleAttribute(value);
			if (!safeStyle) el.removeAttribute("style");
			else el.setAttribute("style", safeStyle);
			continue;
		}

		if (name === "alt") {
			const safeAlt = sanitizeTextAttribute(value);
			if (!safeAlt) el.removeAttribute("alt");
			else el.setAttribute("alt", safeAlt);
			continue;
		}

		if (name === "width" || name === "height") {
			const safeDimension = sanitizePositiveInteger(value);
			if (!safeDimension) el.removeAttribute(attr.name);
			else el.setAttribute(attr.name, safeDimension);
			continue;
		}

		if (name === "colspan" || name === "rowspan") {
			const safeSpan = sanitizePositiveInteger(value, 32);
			if (!safeSpan) el.removeAttribute(attr.name);
			else el.setAttribute(attr.name, safeSpan);
		}
	}

	if (tag === "A" && el.getAttribute("target") === "_blank") {
		el.setAttribute("rel", "noopener noreferrer nofollow");
	}
};

export const sanitizeEditorHTML = (html: string): string => {
	const doc = new DOMParser().parseFromString(html, "text/html");

	const walk = (node: Element) => {
		const children = Array.from(node.childNodes);

		for (const child of children) {
			if (child.nodeType === Node.TEXT_NODE) continue;

			if (child.nodeType === Node.ELEMENT_NODE) {
				const el = child as Element;
				const tag = el.tagName;

				if (!ALLOWED_TAGS.has(tag)) {
					if (DROP_CONTENT_TAGS.has(tag)) {
						el.remove();
						continue;
					}

					el.replaceWith(...Array.from(el.childNodes));
					continue;
				}

				sanitizeElementAttributes(el);
				walk(el);
			} else {
				child.parentNode?.removeChild(child);
			}
		}
	};

	walk(doc.body);
	return doc.body.innerHTML;
};

export const buildImageHTML = ({
	src,
	alt,
	width,
	height,
}: {
	src: string;
	alt: string;
	width?: number;
	height?: number;
}): string => {
	const safeSrc = sanitizeImageURL(src);
	if (!safeSrc) return "";

	const attrs = [`src="${escapeAttr(safeSrc)}"`, `alt="${escapeAttr(alt)}"`];

	if (Number.isFinite(width) && width && width > 0) {
		attrs.push(`width="${Math.round(width)}"`);
	}

	if (Number.isFinite(height) && height && height > 0) {
		attrs.push(`height="${Math.round(height)}"`);
	}

	return `<img ${attrs.join(" ")} style="max-width:100%;height:auto;display:block;margin:4px 0;">`;
};

export const buildTableHTML = (
	rows: number,
	columns: number,
	dictionary: EditorDictionary,
): string => {
	const safeRows = Math.max(1, Math.floor(rows));
	const safeColumns = Math.max(1, Math.floor(columns));
	const cellHTML = `<p>${escapeHTML(dictionary.table.cellPlaceholder)}</p>`;
	const rowHTML = `<tr>${Array.from({ length: safeColumns }, () => `<td>${cellHTML}</td>`).join("")}</tr>`;

	return [
		'<table class="rsw-table"><tbody>',
		...Array.from({ length: safeRows }, () => rowHTML),
		"</tbody></table>",
		"<p><br></p>",
	].join("");
};

export const buildBlockPresetHTML = (
	preset: "twoColumns" | "mediaLeft" | "mediaRight" | "heroMedia",
	dictionary: EditorDictionary,
): string => {
	if (preset === "twoColumns") {
		return [
			'<div class="rsw-layout rsw-layout-2col">',
			`<div class="rsw-layout-col"><p>${escapeHTML(dictionary.blockPresets.firstColumnPlaceholder)}</p></div>`,
			`<div class="rsw-layout-col"><p>${escapeHTML(dictionary.blockPresets.secondColumnPlaceholder)}</p></div>`,
			"</div>",
			"<p><br></p>",
		].join("");
	}

	if (preset === "mediaLeft") {
		return [
			'<div class="rsw-layout rsw-layout-media rsw-layout-media-left">',
			`<div class="rsw-layout-media-slot"><p>${escapeHTML(dictionary.blockPresets.mediaPlaceholder)}</p></div>`,
			`<div class="rsw-layout-text-slot"><p>${escapeHTML(dictionary.blockPresets.textPlaceholder)}</p></div>`,
			"</div>",
			"<p><br></p>",
		].join("");
	}

	if (preset === "heroMedia") {
		return [
			'<div class="rsw-layout rsw-layout-hero">',
			'<div class="rsw-layout-hero-copy">',
			`<p class="rsw-layout-eyebrow">${escapeHTML(dictionary.blockPresets.heroEyebrowPlaceholder)}</p>`,
			`<h2>${escapeHTML(dictionary.blockPresets.heroTitlePlaceholder)}</h2>`,
			`<p>${escapeHTML(dictionary.blockPresets.heroBodyPlaceholder)}</p>`,
			"</div>",
			`<div class="rsw-layout-media-slot"><p>${escapeHTML(dictionary.blockPresets.mediaPlaceholder)}</p></div>`,
			"</div>",
			"<p><br></p>",
		].join("");
	}

	return [
		'<div class="rsw-layout rsw-layout-media rsw-layout-media-right">',
		`<div class="rsw-layout-text-slot"><p>${escapeHTML(dictionary.blockPresets.textPlaceholder)}</p></div>`,
		`<div class="rsw-layout-media-slot"><p>${escapeHTML(dictionary.blockPresets.mediaPlaceholder)}</p></div>`,
		"</div>",
		"<p><br></p>",
	].join("");
};

const NBSP = /&nbsp;|\u202F|\u00A0/g;
const BR = /<br\s*\/?>/gi;
const EMPTY_BLOCK = /^(<(p|div|h[1-6]|li)><br\s*\/?>\<\/(p|div|h[1-6]|li)>)+$/i;

export const normalizeHTML = (html: string): string =>
	html.replace(NBSP, " ").replace(BR, "<br>");

export const isEmpty = (html: string): boolean =>
	!html || html === "<br>" || EMPTY_BLOCK.test(html.trim());

export const sanitizePastedHTML = (html: string): string =>
	sanitizeEditorHTML(html);
