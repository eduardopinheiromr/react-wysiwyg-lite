import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BtnBold } from "./buttons";
import { ptBR } from "./dictionary";
import { Editor } from "./editor";
import { Toolbar } from "./toolbar";

describe("Editor", () => {
	it("renders without crashing", () => {
		const { container } = render(<Editor />);
		expect(container.querySelector(".rsw-editor")).not.toBeNull();
	});

	it("renders a contenteditable div inside", () => {
		const { container } = render(<Editor />);
		const ce = container.querySelector(".rsw-ce");
		expect(ce).not.toBeNull();
		expect(ce?.getAttribute("contenteditable")).toBe("true");
	});

	it("renders children (toolbar etc.) inside the container", () => {
		const { container } = render(
			<Editor>
				<div data-testid="toolbar-slot">toolbar</div>
			</Editor>,
		);
		expect(
			container.querySelector('[data-testid="toolbar-slot"]'),
		).not.toBeNull();
	});

	it("merges containerProps className", () => {
		const { container } = render(
			<Editor containerProps={{ className: "my-editor" }} />,
		);
		const wrapper = container.querySelector(".rsw-editor");
		expect(wrapper?.classList.contains("my-editor")).toBe(true);
	});

	it("passes placeholder to contenteditable", () => {
		const { container } = render(<Editor placeholder="Write here..." />);
		const ce = container.querySelector(".rsw-ce");
		expect(ce?.getAttribute("data-placeholder")).toBe("Write here...");
	});

	it("renders as disabled when disabled prop is set", () => {
		const { container } = render(<Editor disabled />);
		const ce = container.querySelector(".rsw-ce");
		expect(ce?.getAttribute("contenteditable")).toBe("false");
	});

	it("sets initial value as innerHTML", () => {
		const { container } = render(<Editor value="<p>Hello</p>" />);
		const ce = container.querySelector(".rsw-ce");
		expect(ce?.innerHTML).toBe("<p>Hello</p>");
	});

	it("passes dictionary overrides to descendants", () => {
		render(
			<Editor dictionary={ptBR}>
				<Toolbar>
					<BtnBold />
				</Toolbar>
			</Editor>,
		);

		expect(screen.getByTitle("Negrito")).not.toBeNull();
	});

	it("applies theme colors as CSS variables on the editor wrapper", () => {
		const { container } = render(
			<Editor
				theme={{
					colors: {
						linkApplyBackground: "#0f766e",
						linkApplyText: "#ecfeff",
						selectionBackground: "#fde68a",
						selectionText: "#111827",
					},
				}}
			/>,
		);

		const wrapper = container.querySelector(".rsw-editor") as HTMLElement;
		expect(wrapper.style.getPropertyValue("--rsw-color-link-apply-bg")).toBe(
			"#0f766e",
		);
		expect(wrapper.style.getPropertyValue("--rsw-color-link-apply-text")).toBe(
			"#ecfeff",
		);
		expect(wrapper.style.getPropertyValue("--rsw-selection-bg")).toBe(
			"#fde68a",
		);
		expect(wrapper.style.getPropertyValue("--rsw-selection-text")).toBe(
			"#111827",
		);
	});
});
