import { act, fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentEditable } from "./contenteditable";
import { EditorProvider } from "./context";

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<EditorProvider>{children}</EditorProvider>
);

describe("ContentEditable", () => {
	it("renders with rsw-ce class", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable />
			</Wrapper>,
		);
		expect(container.querySelector(".rsw-ce")).not.toBeNull();
	});

	it("renders as contenteditable by default", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable />
			</Wrapper>,
		);
		expect(container.querySelector('[contenteditable="true"]')).not.toBeNull();
	});

	it("renders as non-editable when disabled", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable disabled />
			</Wrapper>,
		);
		expect(container.querySelector('[contenteditable="false"]')).not.toBeNull();
	});

	it("sets initial value as innerHTML", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable value="<b>bold</b>" />
			</Wrapper>,
		);
		expect(container.querySelector(".rsw-ce")?.innerHTML).toBe("<b>bold</b>");
	});

	it("sets data-placeholder attribute", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable placeholder="Start typing" />
			</Wrapper>,
		);
		expect(
			container.querySelector(".rsw-ce")?.getAttribute("data-placeholder"),
		).toBe("Start typing");
	});

	it("merges custom className", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable className="custom" />
			</Wrapper>,
		);
		const el = container.querySelector(".rsw-ce");
		expect(el?.classList.contains("custom")).toBe(true);
	});

	it("renders as a custom tagName", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable tagName="article" />
			</Wrapper>,
		);
		expect(container.querySelector("article.rsw-ce")).not.toBeNull();
	});

	it("handles paste via testing-library", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable />
			</Wrapper>,
		);
		const ce = container.querySelector(".rsw-ce")!;
		// Should not throw when pasting plain text
		act(() => {
			fireEvent.paste(ce, {
				clipboardData: {
					getData: (type: string) =>
						type === "text/plain" ? "pasted text" : "",
				},
			});
		});
	});

	it("sanitizes unsafe html from the value prop", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable
					value={
						'<p>safe</p><img src="https://cdn.example.com/a.png" onerror="alert(1)" style="width:50%;position:fixed"><a href="javascript:alert(1)">bad</a>'
					}
				/>
			</Wrapper>,
		);

		const html = container.querySelector(".rsw-ce")?.innerHTML ?? "";
		expect(html).not.toContain("onerror");
		expect(html).not.toContain("javascript:");
		expect(html).toContain('style="width:50%"');
		expect(html).not.toContain("position:fixed");
	});

	it("shows the selection toolbar when text is selected", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable value="<p>Hello world</p>" />
			</Wrapper>,
		);

		const textNode = container.querySelector("p")?.firstChild;
		const range = document.createRange();
		range.setStart(textNode as Text, 0);
		range.setEnd(textNode as Text, 5);

		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);

		act(() => {
			document.dispatchEvent(new Event("selectionchange"));
		});

		expect(container.querySelector(".rsw-selection-toolbar")).not.toBeNull();
	});

	it("applies bold from the selection toolbar", () => {
		const execCommand = vi.spyOn(document, "execCommand").mockReturnValue(true);
		const { container } = render(
			<Wrapper>
				<ContentEditable value="<p>Hello world</p>" />
			</Wrapper>,
		);

		const textNode = container.querySelector("p")?.firstChild;
		const range = document.createRange();
		range.setStart(textNode as Text, 0);
		range.setEnd(textNode as Text, 5);

		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);

		act(() => {
			document.dispatchEvent(new Event("selectionchange"));
		});

		const toolbar = container.querySelector(
			".rsw-selection-toolbar",
		) as HTMLDivElement;
		fireEvent.mouseDown(within(toolbar).getByTitle("Bold"));

		expect(execCommand).toHaveBeenCalledWith("bold", false, undefined);
		execCommand.mockRestore();
	});

	it("applies heading 3 from the selection toolbar", () => {
		const execCommand = vi.spyOn(document, "execCommand").mockReturnValue(true);
		const { container } = render(
			<Wrapper>
				<ContentEditable value="<p>Hello world</p>" />
			</Wrapper>,
		);

		const textNode = container.querySelector("p")?.firstChild;
		const range = document.createRange();
		range.setStart(textNode as Text, 0);
		range.setEnd(textNode as Text, 5);

		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);

		act(() => {
			document.dispatchEvent(new Event("selectionchange"));
		});

		const toolbar = container.querySelector(
			".rsw-selection-toolbar",
		) as HTMLDivElement;
		fireEvent.mouseDown(within(toolbar).getByTitle("Heading 3"));

		expect(execCommand).toHaveBeenCalledWith("formatBlock", false, "<h3>");
		execCommand.mockRestore();
	});

	it("calls custom onPaste handler when provided", () => {
		const onPaste = vi.fn();
		const { container } = render(
			<Wrapper>
				<ContentEditable onPaste={onPaste} />
			</Wrapper>,
		);
		const ce = container.querySelector(".rsw-ce")!;
		act(() => {
			fireEvent.paste(ce);
		});
		expect(onPaste).toHaveBeenCalledTimes(1);
	});

	it("accepts drag events without throwing", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable />
			</Wrapper>,
		);
		const ce = container.querySelector(".rsw-ce")!;
		act(() => {
			fireEvent.dragOver(ce, {
				dataTransfer: { items: [{ type: "image/png" }], dropEffect: "" },
			});
		});
	});

	it("shows the image toolbar when an image is clicked", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable
					value={'<p>hello</p><img src="/photo.png" alt="Photo">'}
				/>
			</Wrapper>,
		);

		const img = container.querySelector("img") as HTMLImageElement;
		fireEvent.click(img);

		expect(container.querySelector(".rsw-image-toolbar")).not.toBeNull();
	});

	it("applies wrap-right layout to a selected image", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable
					value={'<p>hello world</p><img src="/photo.png" alt="Photo">'}
				/>
			</Wrapper>,
		);

		const img = container.querySelector("img") as HTMLImageElement;
		act(() => {
			fireEvent.click(img);
		});

		const wrapRightBtn = container.querySelector(
			'[title="Wrap text right"]',
		) as HTMLButtonElement;
		act(() => {
			fireEvent.mouseDown(wrapRightBtn);
		});

		expect(img.style.float).toBe("right");
		expect(img.style.width).toBe("40%");
	});

	it("removes the selected image from the editor", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable
					value={'<p>hello world</p><img src="/photo.png" alt="Photo">'}
				/>
			</Wrapper>,
		);

		const img = container.querySelector("img") as HTMLImageElement;
		fireEvent.click(img);

		const removeBtn = container.querySelector(
			'[title="Remove image"]',
		) as HTMLButtonElement;
		fireEvent.mouseDown(removeBtn);

		expect(container.querySelector("img")).toBeNull();
	});

	it("shows the table toolbar when a cell is clicked", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable
					value={
						'<table class="rsw-table"><tbody><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>C</p></td><td><p>D</p></td></tr></tbody></table>'
					}
				/>
			</Wrapper>,
		);

		const cell = container.querySelector("td") as HTMLTableCellElement;
		fireEvent.click(cell);

		expect(container.querySelector(".rsw-table-toolbar")).not.toBeNull();
	});

	it("adds a row below from the table toolbar", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable
					value={
						'<table class="rsw-table"><tbody><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>C</p></td><td><p>D</p></td></tr></tbody></table>'
					}
				/>
			</Wrapper>,
		);

		fireEvent.click(container.querySelector("td") as HTMLTableCellElement);
		fireEvent.mouseDown(
			container.querySelector('[title="Add row below"]') as HTMLButtonElement,
		);

		expect(container.querySelectorAll("tr")).toHaveLength(3);
	});

	it("toggles the selected row into header cells", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable
					value={
						'<table class="rsw-table"><tbody><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>C</p></td><td><p>D</p></td></tr></tbody></table>'
					}
				/>
			</Wrapper>,
		);

		fireEvent.click(container.querySelector("td") as HTMLTableCellElement);
		fireEvent.mouseDown(
			container.querySelector(
				'[title="Toggle header row"]',
			) as HTMLButtonElement,
		);

		expect(
			container.querySelectorAll("tr")[0]?.querySelectorAll("th"),
		).toHaveLength(2);
	});

	it("aligns the selected cell to the center", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable
					value={
						'<table class="rsw-table"><tbody><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>C</p></td><td><p>D</p></td></tr></tbody></table>'
					}
				/>
			</Wrapper>,
		);

		const cell = container.querySelector("td") as HTMLTableCellElement;
		fireEvent.click(cell);
		fireEvent.mouseDown(
			container.querySelector(
				'[title="Align cell center"]',
			) as HTMLButtonElement,
		);

		expect(cell.style.textAlign).toBe("center");
	});

	it("adds a column right from the table toolbar", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable
					value={
						'<table class="rsw-table"><tbody><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>C</p></td><td><p>D</p></td></tr></tbody></table>'
					}
				/>
			</Wrapper>,
		);

		fireEvent.click(container.querySelector("td") as HTMLTableCellElement);
		fireEvent.mouseDown(
			container.querySelector(
				'[title="Add column right"]',
			) as HTMLButtonElement,
		);

		expect(
			container.querySelectorAll("tr")[0]?.querySelectorAll("td"),
		).toHaveLength(3);
	});

	it("removes the table from the table toolbar", () => {
		const { container } = render(
			<Wrapper>
				<ContentEditable
					value={
						'<table class="rsw-table"><tbody><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>C</p></td><td><p>D</p></td></tr></tbody></table>'
					}
				/>
			</Wrapper>,
		);

		fireEvent.click(container.querySelector("td") as HTMLTableCellElement);
		fireEvent.mouseDown(
			container.querySelector('[title="Delete table"]') as HTMLButtonElement,
		);

		expect(container.querySelector("table")).toBeNull();
	});
});
