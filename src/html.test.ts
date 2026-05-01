import { describe, expect, it } from "vitest";
import { enUS } from "./dictionary";
import {
	buildBlockPresetHTML,
	buildImageHTML,
	buildTableHTML,
	escapeAttr,
	escapeHTML,
	isEmpty,
	normalizeHTML,
	sanitizeEditorHTML,
	sanitizeImageURL,
	sanitizeLinkURL,
	sanitizePastedHTML,
} from "./html";

describe("escapeAttr", () => {
	it("escapes double quotes", () => {
		expect(escapeAttr('say "hello"')).toBe("say &quot;hello&quot;");
	});

	it("escapes ampersands", () => {
		expect(escapeAttr("A & B")).toBe("A &amp; B");
	});

	it("leaves safe characters alone", () => {
		expect(escapeAttr("hello world")).toBe("hello world");
	});
});

describe("escapeHTML", () => {
	it("escapes tag delimiters", () => {
		expect(escapeHTML("<script>alert(1)</script>")).toBe(
			"&lt;script&gt;alert(1)&lt;/script&gt;",
		);
	});
});

describe("buildImageHTML", () => {
	it("builds a safe img tag with base styles", () => {
		expect(
			buildImageHTML({ src: "https://cdn.example.com/a.png", alt: "Preview" }),
		).toBe(
			'<img src="https://cdn.example.com/a.png" alt="Preview" style="max-width:100%;height:auto;display:block;margin:4px 0;">',
		);
	});

	it("includes width and height attributes when provided", () => {
		expect(
			buildImageHTML({
				src: "https://cdn.example.com/a.png",
				alt: "Preview",
				width: 640,
				height: 480,
			}),
		).toContain('width="640" height="480"');
	});

	it("escapes alt text", () => {
		expect(
			buildImageHTML({
				src: "https://cdn.example.com/a.png",
				alt: 'say "hello" & more',
			}),
		).toContain('alt="say &quot;hello&quot; &amp; more"');
	});

	it("returns empty markup for unsafe image sources", () => {
		expect(buildImageHTML({ src: "javascript:alert(1)", alt: "bad" })).toBe("");
	});
});

describe("URL sanitizers", () => {
	it("allows safe link urls", () => {
		expect(sanitizeLinkURL("https://example.com/docs")).toBe(
			"https://example.com/docs",
		);
		expect(sanitizeLinkURL("/docs/getting-started")).toBe(
			"/docs/getting-started",
		);
	});

	it("rejects unsafe link protocols", () => {
		expect(sanitizeLinkURL("javascript:alert(1)")).toBeNull();
		expect(sanitizeLinkURL("vbscript:evil()")).toBeNull();
	});

	it("allows safe image urls", () => {
		expect(sanitizeImageURL("https://cdn.example.com/a.png")).toBe(
			"https://cdn.example.com/a.png",
		);
		expect(
			sanitizeImageURL("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA"),
		).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA");
	});

	it("rejects unsafe image urls", () => {
		expect(sanitizeImageURL("javascript:alert(1)")).toBeNull();
		expect(sanitizeImageURL("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
	});
});

describe("buildTableHTML", () => {
	it("builds a 2x2 table with placeholder cells", () => {
		const result = buildTableHTML(2, 2, enUS);
		expect(result).toContain('<table class="rsw-table">');
		expect(result.match(/<td>/g)?.length).toBe(4);
		expect(result).toContain("Cell");
	});
});

describe("buildBlockPresetHTML", () => {
	it("builds a two-column preset with placeholders", () => {
		const result = buildBlockPresetHTML("twoColumns", enUS);
		expect(result).toContain("rsw-layout-2col");
		expect(result).toContain("Left column");
		expect(result).toContain("Right column");
	});

	it("builds a media-right preset with placeholders", () => {
		const result = buildBlockPresetHTML("mediaRight", enUS);
		expect(result).toContain("rsw-layout-media-right");
		expect(result).toContain("Add an image here");
		expect(result).toContain("Write your text here");
	});

	it("builds a hero-media preset with hero placeholders", () => {
		const result = buildBlockPresetHTML("heroMedia", enUS);
		expect(result).toContain("rsw-layout-hero");
		expect(result).toContain("Featured section");
		expect(result).toContain("Add a strong heading here");
	});
});

describe("normalizeHTML", () => {
	it("converts &nbsp; to space", () => {
		expect(normalizeHTML("a&nbsp;b")).toBe("a b");
	});

	it("converts unicode non-breaking spaces to space", () => {
		expect(normalizeHTML("a b")).toBe("a b");
		expect(normalizeHTML("a b")).toBe("a b");
	});

	it("normalizes self-closing <br/> to <br>", () => {
		expect(normalizeHTML("<br/>")).toBe("<br>");
		expect(normalizeHTML("<br />")).toBe("<br>");
	});

	it("normalizes <BR> to <br>", () => {
		expect(normalizeHTML("<BR>")).toBe("<br>");
	});

	it("leaves unrelated content unchanged", () => {
		expect(normalizeHTML("<b>hello</b>")).toBe("<b>hello</b>");
	});
});

describe("isEmpty", () => {
	it("returns true for empty string", () => {
		expect(isEmpty("")).toBe(true);
	});

	it("returns true for bare <br>", () => {
		expect(isEmpty("<br>")).toBe(true);
	});

	it("returns true for empty <p><br></p>", () => {
		expect(isEmpty("<p><br></p>")).toBe(true);
	});

	it("returns true for empty <div><br/></div>", () => {
		expect(isEmpty("<div><br/></div>")).toBe(true);
	});

	it("returns true for multiple empty blocks", () => {
		expect(isEmpty("<p><br></p><p><br></p>")).toBe(true);
	});

	it("returns false for text content", () => {
		expect(isEmpty("<p>hello</p>")).toBe(false);
	});

	it("returns false for non-empty html", () => {
		expect(isEmpty("<b>x</b>")).toBe(false);
	});
});

describe("sanitizePastedHTML", () => {
	it("preserves safe editor structural html", () => {
		const result = sanitizeEditorHTML(
			'<div class="rsw-layout"><span class="custom-token" style="color:#ff0000">hello</span></div>',
		);
		expect(result).toContain('class="rsw-layout"');
		expect(result).toContain('class="custom-token"');
		expect(result).toContain('style="color:#ff0000"');
	});

	it("keeps allowed tags", () => {
		const result = sanitizePastedHTML("<b>bold</b><i>italic</i>");
		expect(result).toContain("<b>bold</b>");
		expect(result).toContain("<i>italic</i>");
	});

	it("keeps safe div containers", () => {
		const result = sanitizePastedHTML("<div><span>hello</span></div>");
		expect(result).toContain("hello");
		expect(result).toContain("<div>");
	});

	it("keeps <a> with allowed attributes", () => {
		const result = sanitizePastedHTML(
			'<a href="https://example.com" target="_blank">link</a>',
		);
		expect(result).toContain('href="https://example.com"');
		expect(result).toContain('target="_blank"');
		expect(result).toContain('rel="noopener noreferrer nofollow"');
	});

	it("strips javascript urls from anchors", () => {
		const result = sanitizePastedHTML('<a href="javascript:alert(1)">bad</a>');
		expect(result).not.toContain("javascript:");
	});

	it("strips disallowed attributes from <a>", () => {
		const result = sanitizePastedHTML('<a href="x" onclick="evil()">link</a>');
		expect(result).not.toContain("onclick");
		expect(result).toContain('href="x"');
	});

	it("strips <script> tags entirely", () => {
		const result = sanitizePastedHTML("<script>alert(1)</script>hello");
		expect(result).not.toContain("<script>");
		expect(result).not.toContain("alert");
		expect(result).toContain("hello");
	});

	it("strips style attributes from <b>", () => {
		const result = sanitizePastedHTML('<b style="color:red">bold</b>');
		expect(result).not.toContain("style=");
		expect(result).toContain("<b>bold</b>");
	});

	it("keeps <span> with style attribute", () => {
		const result = sanitizePastedHTML('<span style="color:red">text</span>');
		expect(result).toContain('style="color:red"');
	});

	it("sanitizes unsafe style values", () => {
		const result = sanitizePastedHTML(
			'<span style="background-image:url(javascript:alert(1));color:#f00">text</span>',
		);
		expect(result).not.toContain("background-image");
		expect(result).toContain('style="color:#f00"');
	});

	it("strips dangerous image attributes", () => {
		const result = sanitizePastedHTML(
			'<img src="https://cdn.example.com/photo.png" onerror="alert(1)" style="width:50%;position:fixed" alt="photo">',
		);
		expect(result).toContain("<img ");
		expect(result).not.toContain("onerror");
		expect(result).toContain('style="width:50%"');
		expect(result).not.toContain("position:fixed");
	});

	it("keeps table markup", () => {
		const result = sanitizePastedHTML(
			"<table><tbody><tr><td>one</td><td>two</td></tr></tbody></table>",
		);
		expect(result).toContain("<table>");
		expect(result).toContain("<td>one</td>");
	});
});
