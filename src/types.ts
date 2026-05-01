import type { HTMLAttributes, ReactNode, SyntheticEvent } from "react";

export type EditorDictionary = {
	toolbar: {
		bold: string;
		heading1: string;
		heading2: string;
		heading3: string;
		heading4: string;
		heading5: string;
		italic: string;
		underline: string;
		strikethrough: string;
		bulletList: string;
		numberedList: string;
		alignLeft: string;
		alignCenter: string;
		alignRight: string;
		link: string;
		insertImage: string;
		table: string;
		twoColumns: string;
		mediaLeft: string;
		mediaRight: string;
		heroMedia: string;
		undo: string;
		redo: string;
		clearFormatting: string;
		subscript: string;
		superscript: string;
		indent: string;
		outdent: string;
	};
	link: {
		placeholder: string;
		apply: string;
		close: string;
	};
	imageToolbar: {
		small: string;
		medium: string;
		large: string;
		alignLeft: string;
		alignCenter: string;
		alignRight: string;
		wrapLeft: string;
		wrapRight: string;
		remove: string;
	};
	tableToolbar: {
		toggleHeaderRow: string;
		alignCellLeft: string;
		alignCellCenter: string;
		alignCellRight: string;
		addRowAbove: string;
		addRowBelow: string;
		addColumnLeft: string;
		addColumnRight: string;
		deleteRow: string;
		deleteColumn: string;
		deleteTable: string;
	};
	blockPresets: {
		firstColumnPlaceholder: string;
		secondColumnPlaceholder: string;
		mediaPlaceholder: string;
		textPlaceholder: string;
		heroEyebrowPlaceholder: string;
		heroTitlePlaceholder: string;
		heroBodyPlaceholder: string;
	};
	table: {
		cellPlaceholder: string;
	};
};

export type EditorDictionaryInput = {
	toolbar?: Partial<EditorDictionary["toolbar"]>;
	link?: Partial<EditorDictionary["link"]>;
	imageToolbar?: Partial<EditorDictionary["imageToolbar"]>;
	tableToolbar?: Partial<EditorDictionary["tableToolbar"]>;
	blockPresets?: Partial<EditorDictionary["blockPresets"]>;
	table?: Partial<EditorDictionary["table"]>;
};

export type EditorTheme = {
	colors: {
		editorBackground: string;
		editorBorder: string;
		toolbarBackground: string;
		buttonText: string;
		buttonHoverBackground: string;
		buttonActiveBackground: string;
		buttonActiveText: string;
		linkApplyBackground: string;
		linkApplyText: string;
		linkApplyHoverBackground: string;
		selectionBackground: string;
		selectionText: string;
	};
};

export type EditorThemeInput = {
	colors?: Partial<EditorTheme["colors"]>;
};

export type ChangeEvent = SyntheticEvent & {
	target: { value: string; name?: string };
};

export type CommandAPI = {
	el: HTMLElement;
	exec: (command: string, value?: string) => void;
	isActive: (command: string) => boolean;
	getRange: () => Range | null;
	getSelection: () => Selection | null;
	wrapSelection: (tag: string, attrs?: Record<string, string>) => void;
	insertHTML: (html: string) => void;
	focus: () => void;
};

export type Command = string | ((api: CommandAPI) => void);

export type ImageResult = {
	url: string;
	alt?: string;
	width?: number;
	height?: number;
};
export type OnImportImage = (file: File) => Promise<string | ImageResult>;

export type EditorContextValue = {
	el: HTMLElement | null;
	htmlMode: boolean;
	selectionTick: number;
	dictionary: EditorDictionary;
	setEl: (el: HTMLElement | null) => void;
	setHtmlMode: (v: boolean) => void;
	getCommandAPI: () => CommandAPI | null;
	getOnImportImage: () => OnImportImage | null;
};

export type ContentEditableProps = Omit<
	HTMLAttributes<HTMLElement>,
	"onChange"
> & {
	value?: string;
	name?: string;
	disabled?: boolean;
	tagName?: string;
	placeholder?: string;
	onChange?: (event: ChangeEvent) => void;
};

export type EditorProps = ContentEditableProps & {
	containerProps?: HTMLAttributes<HTMLDivElement>;
	onImportImage?: OnImportImage;
	dictionary?: EditorDictionaryInput;
	theme?: EditorThemeInput;
};

export type ButtonProps = HTMLAttributes<HTMLButtonElement>;

export type CreateButtonOptions = {
	alwaysActive?: boolean;
	dictionaryKey?: keyof EditorDictionary["toolbar"];
};
