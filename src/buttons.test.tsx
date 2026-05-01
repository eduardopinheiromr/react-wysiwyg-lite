import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	BtnAlignCenter,
	BtnAlignLeft,
	BtnAlignRight,
	BtnBold,
	BtnBulletList,
	BtnClearFormatting,
	BtnH1,
	BtnH2,
	BtnH3,
	BtnH4,
	BtnH5,
	BtnHeroMedia,
	BtnImage,
	BtnIndent,
	BtnItalic,
	BtnLink,
	BtnMediaLeft,
	BtnMediaRight,
	BtnOrderedList,
	BtnOutdent,
	BtnRedo,
	BtnStrikeThrough,
	BtnSubscript,
	BtnSuperscript,
	BtnTable,
	BtnTwoColumns,
	BtnUnderline,
	BtnUndo,
} from "./buttons";
import { EditorProvider } from "./context";
import { ptBR } from "./dictionary";
import { Editor } from "./editor";
import { Toolbar } from "./toolbar";

// Wraps with a real Editor so ContentEditable registers in context
const WithEditor = ({ children }: { children: React.ReactNode }) => (
	<Editor>
		<Toolbar>{children}</Toolbar>
	</Editor>
);

// Wraps with just context (no ContentEditable) — use for tests that don't need API
const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<EditorProvider>{children}</EditorProvider>
);

afterEach(() => {
	vi.clearAllMocks();
});

describe("simple command buttons", () => {
	const simpleBtns = [
		{ Btn: BtnBold, title: "Bold" },
		{ Btn: BtnH1, title: "Heading 1" },
		{ Btn: BtnH2, title: "Heading 2" },
		{ Btn: BtnH3, title: "Heading 3" },
		{ Btn: BtnH4, title: "Heading 4" },
		{ Btn: BtnH5, title: "Heading 5" },
		{ Btn: BtnItalic, title: "Italic" },
		{ Btn: BtnUnderline, title: "Underline" },
		{ Btn: BtnStrikeThrough, title: "Strikethrough" },
		{ Btn: BtnBulletList, title: "Bullet list" },
		{ Btn: BtnOrderedList, title: "Numbered list" },
		{ Btn: BtnAlignLeft, title: "Align left" },
		{ Btn: BtnAlignCenter, title: "Align center" },
		{ Btn: BtnAlignRight, title: "Align right" },
		{ Btn: BtnUndo, title: "Undo" },
		{ Btn: BtnRedo, title: "Redo" },
		{ Btn: BtnClearFormatting, title: "Clear formatting" },
		{ Btn: BtnSubscript, title: "Subscript" },
		{ Btn: BtnSuperscript, title: "Superscript" },
		{ Btn: BtnIndent, title: "Indent" },
		{ Btn: BtnOutdent, title: "Outdent" },
	];

	for (const { Btn, title } of simpleBtns) {
		it(`renders ${title} button`, () => {
			render(
				<Wrapper>
					<Btn />
				</Wrapper>,
			);
			expect(screen.getByTitle(title)).not.toBeNull();
		});
	}
});

describe("BtnLink", () => {
	it("renders the link button", () => {
		render(
			<WithEditor>
				<BtnLink />
			</WithEditor>,
		);
		expect(screen.getByTitle("Link")).not.toBeNull();
	});

	it("popover is not visible initially", () => {
		const { container } = render(
			<WithEditor>
				<BtnLink />
			</WithEditor>,
		);
		expect(container.querySelector(".rsw-link-popover")).toBeNull();
	});

	it("shows popover on mousedown", () => {
		const { container } = render(
			<WithEditor>
				<BtnLink />
			</WithEditor>,
		);
		fireEvent.mouseDown(screen.getByTitle("Link"));
		expect(container.querySelector(".rsw-link-popover")).not.toBeNull();
	});

	it("popover contains url input and apply/cancel buttons", () => {
		const { container } = render(
			<WithEditor>
				<BtnLink />
			</WithEditor>,
		);
		fireEvent.mouseDown(screen.getByTitle("Link"));
		const popover = container.querySelector(".rsw-link-popover")!;
		expect(within(popover).getByPlaceholderText("https://")).not.toBeNull();
		expect(container.querySelector(".rsw-link-apply")).not.toBeNull();
		expect(container.querySelector(".rsw-link-cancel")).not.toBeNull();
	});

	it("closes popover when cancel is clicked", () => {
		const { container } = render(
			<WithEditor>
				<BtnLink />
			</WithEditor>,
		);
		fireEvent.mouseDown(screen.getByTitle("Link"));
		expect(container.querySelector(".rsw-link-popover")).not.toBeNull();

		const cancelBtn = container.querySelector(
			".rsw-link-cancel",
		) as HTMLButtonElement;
		fireEvent.click(cancelBtn);
		expect(container.querySelector(".rsw-link-popover")).toBeNull();
	});

	it("updates url input value when typing", async () => {
		const user = userEvent.setup();
		const { container } = render(
			<WithEditor>
				<BtnLink />
			</WithEditor>,
		);
		fireEvent.mouseDown(screen.getByTitle("Link"));

		const input = container.querySelector(
			".rsw-link-input",
		) as HTMLInputElement;
		await user.clear(input);
		await user.type(input, "https://example.com");
		expect(input.value).toBe("https://example.com");
	});

	it("does not create links for unsafe urls", async () => {
		const execCommand = vi.spyOn(document, "execCommand").mockReturnValue(true);
		const user = userEvent.setup();
		const { container } = render(
			<WithEditor>
				<BtnLink />
			</WithEditor>,
		);

		fireEvent.mouseDown(screen.getByTitle("Link"));
		const input = container.querySelector(
			".rsw-link-input",
		) as HTMLInputElement;
		await user.clear(input);
		await user.type(input, "javascript:alert(1)");
		fireEvent.click(
			container.querySelector(".rsw-link-apply") as HTMLButtonElement,
		);

		expect(execCommand).not.toHaveBeenCalledWith(
			"createLink",
			false,
			expect.anything(),
		);
		execCommand.mockRestore();
	});

	it("closes popover when outside is clicked", async () => {
		const { container } = render(
			<div>
				<WithEditor>
					<BtnLink />
				</WithEditor>
				<div data-testid="outside">outside</div>
			</div>,
		);
		fireEvent.mouseDown(screen.getByTitle("Link"));
		expect(container.querySelector(".rsw-link-popover")).not.toBeNull();

		fireEvent.pointerDown(screen.getByTestId("outside"));
		await waitFor(() => {
			expect(container.querySelector(".rsw-link-popover")).toBeNull();
		});
	});
});

describe("BtnImage", () => {
	it("renders the image button", () => {
		render(
			<Wrapper>
				<BtnImage />
			</Wrapper>,
		);
		expect(screen.getByTitle("Insert image")).not.toBeNull();
	});

	it("has a hidden file input", () => {
		const { container } = render(
			<Wrapper>
				<BtnImage />
			</Wrapper>,
		);
		const input = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		expect(input).not.toBeNull();
		expect(input.style.display).toBe("none");
		expect(input.accept).toBe("image/*");
	});

	it("calls onImportImage when file is selected", async () => {
		const onImportImage = vi
			.fn()
			.mockResolvedValue("https://cdn.example.com/img.png");
		const { container } = render(
			<EditorProvider onImportImage={onImportImage}>
				<BtnImage />
			</EditorProvider>,
		);

		const fileInput = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const file = new File(["(img)"], "photo.png", { type: "image/png" });
		fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			expect(onImportImage).toHaveBeenCalledWith(file);
		});
	});

	it("ignores unsafe image urls returned by onImportImage", async () => {
		const onImportImage = vi.fn().mockResolvedValue("javascript:alert(1)");
		const { container } = render(
			<Editor onImportImage={onImportImage}>
				<Toolbar>
					<BtnImage />
				</Toolbar>
			</Editor>,
		);

		const fileInput = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const file = new File(["(img)"], "photo.png", { type: "image/png" });
		fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			expect(onImportImage).toHaveBeenCalledWith(file);
		});
		expect(container.querySelector("img")).toBeNull();
	});
});

describe("BtnTable", () => {
	it("renders the table button", () => {
		render(
			<Wrapper>
				<BtnTable />
			</Wrapper>,
		);
		expect(screen.getByTitle("Table")).not.toBeNull();
	});

	it("inserts a 2x2 table into the editor", () => {
		const { container } = render(
			<WithEditor>
				<BtnTable />
			</WithEditor>,
		);

		fireEvent.mouseDown(screen.getByTitle("Table"));
		expect(container.querySelector("table")).not.toBeNull();
		expect(container.querySelectorAll("td")).toHaveLength(4);
	});
});

describe("block preset buttons", () => {
	it("renders the block preset buttons", () => {
		render(
			<WithEditor>
				<BtnTwoColumns />
				<BtnMediaLeft />
				<BtnMediaRight />
				<BtnHeroMedia />
			</WithEditor>,
		);

		expect(screen.getByTitle("Two columns")).not.toBeNull();
		expect(screen.getByTitle("Media left")).not.toBeNull();
		expect(screen.getByTitle("Media right")).not.toBeNull();
		expect(screen.getByTitle("Hero media")).not.toBeNull();
	});

	it("inserts a two-column layout into the editor", () => {
		const { container } = render(
			<WithEditor>
				<BtnTwoColumns />
			</WithEditor>,
		);

		fireEvent.mouseDown(screen.getByTitle("Two columns"));
		expect(container.querySelector(".rsw-layout-2col")).not.toBeNull();
	});

	it("uses the provided dictionary for block preset titles", () => {
		render(
			<Editor dictionary={ptBR}>
				<Toolbar>
					<BtnTwoColumns />
				</Toolbar>
			</Editor>,
		);

		expect(screen.getByTitle("Duas colunas")).not.toBeNull();
	});

	it("inserts a hero-media layout into the editor", () => {
		const { container } = render(
			<WithEditor>
				<BtnHeroMedia />
			</WithEditor>,
		);

		fireEvent.mouseDown(screen.getByTitle("Hero media"));
		expect(container.querySelector(".rsw-layout-hero")).not.toBeNull();
	});
});

describe("heading buttons", () => {
	it("uses formatBlock when a heading button is pressed", () => {
		const execCommand = vi.spyOn(document, "execCommand").mockReturnValue(true);

		const { container } = render(
			<Editor value="<p>Hello</p>">
				<Toolbar>
					<BtnH2 />
				</Toolbar>
			</Editor>,
		);

		const editable = container.querySelector(".rsw-ce") as HTMLElement;
		editable.focus();
		fireEvent.mouseDown(screen.getByTitle("Heading 2"));

		expect(execCommand).toHaveBeenCalledWith("formatBlock", false, "<h2>");
		execCommand.mockRestore();
	});
});
