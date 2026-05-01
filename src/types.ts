import type { HTMLAttributes, ReactNode, SyntheticEvent } from 'react';

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

export type ImageResult = { url: string; alt?: string; width?: number; height?: number };
export type OnImportImage = (file: File) => Promise<string | ImageResult>;

export type EditorContextValue = {
  el: HTMLElement | null;
  htmlMode: boolean;
  selectionTick: number;
  setEl: (el: HTMLElement | null) => void;
  setHtmlMode: (v: boolean) => void;
  getCommandAPI: () => CommandAPI | null;
  getOnImportImage: () => OnImportImage | null;
};

export type ContentEditableProps = Omit<HTMLAttributes<HTMLElement>, 'onChange'> & {
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
};

export type ButtonProps = HTMLAttributes<HTMLButtonElement>;

export type CreateButtonOptions = {
  alwaysActive?: boolean;
};
