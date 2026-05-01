# react-wysiwyg-lite

Lightweight, extensible WYSIWYG editor for React with zero runtime dependencies, full TypeScript types, tree-shakeable exports, localized labels, floating contextual toolbars, and built-in HTML hardening.

## Highlights

- Zero runtime dependencies.
- React 18+ compatible.
- Uncontrolled or controlled usage.
- Tree-shakeable button and locale exports.
- Headings `H1` to `H5`, lists, alignment, links, images, tables, undo/redo.
- Block presets for two columns, media left, media right, and hero + media.
- Floating image, selection, and table cell toolbars.
- Built-in `enUS` and `ptBR` dictionaries with partial overrides.
- Theme tokens via props.
- Internal sanitization for initial HTML, controlled updates, pasted HTML, plain-text paste, links, images, and mutation output.

## Install

```bash
npm install react-wysiwyg-lite
```

```tsx
import 'react-wysiwyg-lite/styles.css';
```

## Quick Start

### Uncontrolled

This is the recommended default when you only need the HTML at submit, autosave, or explicit checkpoints.

```tsx
import { useRef } from 'react';
import { DefaultEditor } from 'react-wysiwyg-lite';
import 'react-wysiwyg-lite/styles.css';

export function PostEditor() {
  const htmlRef = useRef('<p>Start here</p>');

  return (
    <>
      <DefaultEditor
        value={htmlRef.current}
        onChange={(event) => {
          htmlRef.current = event.target.value;
        }}
        placeholder="Write something"
      />

      <button
        type="button"
        onClick={() => {
          console.log(htmlRef.current);
        }}
      >
        Save
      </button>
    </>
  );
}
```

### Controlled

Use controlled mode when the UI must react immediately to the current HTML.

```tsx
import { useState } from 'react';
import { DefaultEditor } from 'react-wysiwyg-lite';
import 'react-wysiwyg-lite/styles.css';

export function ControlledEditor() {
  const [html, setHtml] = useState('<p>Hello</p>');

  return (
    <DefaultEditor
      value={html}
      onChange={(event) => setHtml(event.target.value)}
    />
  );
}
```

## Composable API

Use `Editor` + `Toolbar` when you want a custom toolbar layout.

```tsx
import {
  BtnBold,
  BtnBulletList,
  BtnH2,
  BtnHeroMedia,
  BtnImage,
  BtnItalic,
  BtnLink,
  BtnTable,
  BtnTwoColumns,
  Editor,
  Separator,
  Toolbar,
} from 'react-wysiwyg-lite';
import 'react-wysiwyg-lite/styles.css';

export function LandingEditor({ value, onChange }) {
  return (
    <Editor value={value} onChange={onChange}>
      <Toolbar>
        <BtnBold />
        <BtnItalic />
        <BtnH2 />
        <Separator />
        <BtnBulletList />
        <BtnLink />
        <BtnImage />
        <BtnTable />
        <Separator />
        <BtnTwoColumns />
        <BtnHeroMedia />
      </Toolbar>
    </Editor>
  );
}
```

## Built-In UX

The editor includes contextual controls that appear automatically:

- Select text to open a floating selection toolbar with headings, inline formatting, lists, clear formatting, and link actions.
- Click an image to open a floating image toolbar with sizing, alignment, wrap, and remove actions.
- Click a table cell to open a floating table toolbar with row/column insertion, deletion, header-row toggle, cell alignment, and table removal.

## Localization

Built-in locales are exported as named values and can be partially overridden.

```tsx
import { DefaultEditor, ptBR } from 'react-wysiwyg-lite';

export function LocalizedEditor() {
  return (
    <DefaultEditor
      dictionary={{
        ...ptBR,
        toolbar: {
          ...ptBR.toolbar,
          table: 'Tabela',
        },
        tableToolbar: {
          ...ptBR.tableToolbar,
          toggleHeaderRow: 'Cabeçalho',
        },
      }}
    />
  );
}
```

## Theme Tokens

Theme values are passed through props and mapped to CSS variables.

```tsx
import { DefaultEditor } from 'react-wysiwyg-lite';

export function ThemedEditor() {
  return (
    <DefaultEditor
      theme={{
        colors: {
          border: '#cbd5e1',
          toolbarBackground: '#f8fafc',
          toolbarButtonHover: '#e2e8f0',
          toolbarButtonActive: '#dcfce7',
          toolbarButtonActiveText: '#166534',
          linkApplyBackground: '#111827',
          linkApplyText: '#ffffff',
          selectionBackground: '#fde68a',
          selectionText: '#111827',
        },
      }}
    />
  );
}
```

## Image Import Hook

By default the editor uses `FileReader` and inserts a safe `data:image/*;base64,...` URL. You can override this with `onImportImage`.

```tsx
import { DefaultEditor } from 'react-wysiwyg-lite';

export function UploadingEditor() {
  return (
    <DefaultEditor
      onImportImage={async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        return {
          url: data.url,
          alt: data.alt ?? file.name,
          width: data.width,
          height: data.height,
        };
      }}
    />
  );
}
```

Unsafe protocols such as `javascript:` are rejected before insertion.

## Security Model

The library now hardens all major HTML entry points:

| Surface | Protection |
| --- | --- |
| `value` prop on mount and updates | Sanitized before hydration |
| Pasted HTML | Tag, attribute, style, link, and image allowlist sanitization |
| Pasted plain text | Escaped before insertion |
| Link creation | Protocol validation via `sanitizeLinkURL` |
| Image insertion | Source validation via `sanitizeImageURL` |
| DOM mutations before `onChange` | Re-sanitized before emitting HTML |

Public helpers are also exported so you can normalize content before saving or before rendering elsewhere:

```tsx
import {
  sanitizeEditorHTML,
  sanitizeImageURL,
  sanitizeLinkURL,
} from 'react-wysiwyg-lite';

const safeHTML = sanitizeEditorHTML(dirtyHTML);
const safeHref = sanitizeLinkURL(userHref);
const safeImage = sanitizeImageURL(userImageUrl);
```

Important: this protects the editor surface and exported HTML normalization path. If you later render stored HTML outside the editor, you should still apply your normal server-side or rendering-layer safety rules.

## react-hook-form

`Controller` works well because the editor uses the familiar `{ value, onChange }` shape.

```tsx
import { Controller, useForm } from 'react-hook-form';
import { DefaultEditor } from 'react-wysiwyg-lite';
import 'react-wysiwyg-lite/styles.css';

type FormData = {
  body: string;
};

export function PostForm() {
  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: { body: '<p>Hello</p>' },
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <Controller
        name="body"
        control={control}
        render={({ field }) => (
          <DefaultEditor
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
          />
        )}
      />

      <button type="submit">Publish</button>
    </form>
  );
}
```

## Custom Buttons

`createButton` accepts either an `execCommand` string or a callback with `CommandAPI`.

```tsx
import { createButton } from 'react-wysiwyg-lite';

const BtnSubscript = createButton('Subscript', <sub>x</sub>, 'subscript');

const BtnDivider = createButton('Divider', 'HR', (api) => {
  api.insertHTML('<hr>');
});
```

## `CommandAPI`

```ts
type CommandAPI = {
  el: HTMLElement;
  exec: (command: string, value?: string) => void;
  isActive: (command: string) => boolean;
  getRange: () => Range | null;
  getSelection: () => Selection | null;
  wrapSelection: (tag: string, attrs?: Record<string, string>) => void;
  insertHTML: (html: string) => void;
  focus: () => void;
};
```

## Built-In Buttons

| Export | Purpose |
| --- | --- |
| `BtnBold`, `BtnItalic`, `BtnUnderline`, `BtnStrikeThrough` | Inline formatting |
| `BtnH1`, `BtnH2`, `BtnH3`, `BtnH4`, `BtnH5` | Headings |
| `BtnBulletList`, `BtnOrderedList` | Lists |
| `BtnAlignLeft`, `BtnAlignCenter`, `BtnAlignRight` | Alignment |
| `BtnLink` | Link popover |
| `BtnImage` | Image picker/import |
| `BtnTable` | 2x2 table insertion |
| `BtnTwoColumns`, `BtnMediaLeft`, `BtnMediaRight`, `BtnHeroMedia` | Layout presets |
| `BtnUndo`, `BtnRedo` | History |
| `BtnClearFormatting` | Remove inline formatting |
| `BtnSubscript`, `BtnSuperscript` | Sub and superscript |
| `BtnIndent`, `BtnOutdent` | Indentation |

## Architecture Notes

| Decision | Rationale |
| --- | --- |
| `MutationObserver` for change detection | Avoids React re-render churn while editing |
| Imperative `innerHTML` ownership | React does not reconcile editor content |
| Selection save/restore helpers | Preserves caret and floating toolbar behavior |
| Sanitization at every HTML ingress | Reduces DOM-XSS and malformed markup risk |
| No runtime dependencies | Keeps install surface and audit surface small |
