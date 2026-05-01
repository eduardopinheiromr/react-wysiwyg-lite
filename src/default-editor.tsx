import { Separator } from "./button";
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
	BtnTable,
	BtnTwoColumns,
	BtnUnderline,
	BtnUndo,
} from "./buttons";
import { Editor } from "./editor";
import { Toolbar } from "./toolbar";
import type { EditorProps } from "./types";

export const DefaultEditor = (props: EditorProps) => (
	<Editor {...props}>
		<Toolbar>
			<BtnH1 />
			<BtnH2 />
			<BtnH3 />
			<BtnH4 />
			<BtnH5 />
			<Separator />
			<BtnBold />
			<BtnItalic />
			<BtnUnderline />
			<BtnStrikeThrough />
			<Separator />
			<BtnBulletList />
			<BtnOrderedList />
			<BtnIndent />
			<BtnOutdent />
			<Separator />
			<BtnLink />
			<BtnImage />
			<BtnTable />
			<Separator />
			<BtnTwoColumns />
			<BtnMediaLeft />
			<BtnMediaRight />
			<BtnHeroMedia />
			<Separator />
			<BtnAlignLeft />
			<BtnAlignCenter />
			<BtnAlignRight />
			<Separator />
			<BtnUndo />
			<BtnRedo />
			<Separator />
			<BtnClearFormatting />
		</Toolbar>
	</Editor>
);
