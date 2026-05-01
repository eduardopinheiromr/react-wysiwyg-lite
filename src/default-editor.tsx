import { Editor } from './editor';
import { Toolbar } from './toolbar';
import { Separator } from './button';
import {
  BtnAlignCenter,
  BtnAlignLeft,
  BtnAlignRight,
  BtnBold,
  BtnBulletList,
  BtnClearFormatting,
  BtnIndent,
  BtnItalic,
  BtnLink,
  BtnOrderedList,
  BtnOutdent,
  BtnRedo,
  BtnStrikeThrough,
  BtnUnderline,
  BtnUndo,
} from './buttons';
import type { EditorProps } from './types';

export const DefaultEditor = (props: EditorProps) => (
  <Editor {...props}>
    <Toolbar>
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
