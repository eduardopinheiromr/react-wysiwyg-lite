---
name: react-wysiwyg-lite
description: Use when integrating or working with react-wysiwyg-lite — a lightweight, extensible WYSIWYG editor for React. Triggers on: WYSIWYG editor integration, rich-text editing, contenteditable with React, react-wysiwyg-lite API usage, cursor/selection handling with this library, customizing editor toolbar, theming the editor, i18n/dictionary setup, or any task involving @react-wysiwyg-lite imports.
---

# react-wysiwyg-lite

Lightweight, extensible WYSIWYG editor for React. `useState`-first API, zero dependencies.

## Installation

```bash
npm install react-wysiwyg-lite
```

Peer dependencies: `react >= 18.0.0`, `react-dom >= 18.0.0`.

## Quick start

```tsx
import { useState } from "react";
import { DefaultEditor } from "react-wysiwyg-lite";
import "react-wysiwyg-lite/styles.css";

function App() {
  const [html, setHtml] = useState("<p>Hello world!</p>");
  return <DefaultEditor value={html} onChange={(e) => setHtml(e.target.value)} />;
}
```

## Exports

### Components

| Export | Description |
|---|---|
| `Editor` | Core editor with configurable children (toolbar, etc.). Wrap toolbar buttons inside. |
| `DefaultEditor` | Pre-assembled editor with all built-in buttons in a default layout. |
| `Toolbar` | `<div>` wrapper for toolbar buttons. Applies `rsw-toolbar` class. |
| `Separator` | Vertical divider between toolbar button groups. `aria-hidden`. |

### Button factories & built-in buttons

| Function | Returns |
|---|---|
| `createButton(title, content, command, options?)` | A React component for a toolbar button. |

`command` can be:
- A **string** — a `document.execCommand` command name (e.g. `"bold"`, `"italic"`)
- A **function** `(api: CommandAPI) => void` — for custom logic with full editor API access

Built-in buttons (all exported):

| Export | Command | Description |
|---|---|---|
| `BtnBold` | `"bold"` | Bold |
| `BtnItalic` | `"italic"` | Italic |
| `BtnUnderline` | `"underline"` | Underline |
| `BtnStrikeThrough` | `"strikeThrough"` | Strikethrough |
| `BtnH1`–`BtnH5` | `formatBlock` `<h1>`–`<h5>` | Headings |
| `BtnBulletList` | `"insertUnorderedList"` | Bullet list |
| `BtnOrderedList` | `"insertOrderedList"` | Numbered list |
| `BtnAlignLeft` | `"justifyLeft"` | Align left |
| `BtnAlignCenter` | `"justifyCenter"` | Align center |
| `BtnAlignRight` | `"justifyRight"` | Align right |
| `BtnUndo` | `"undo"` | Undo |
| `BtnRedo` | `"redo"` | Redo |
| `BtnClearFormatting` | `"removeFormat"` | Clear formatting |
| `BtnSubscript` | `"subscript"` | Subscript |
| `BtnSuperscript` | `"superscript"` | Superscript |
| `BtnIndent` | `"indent"` | Indent |
| `BtnOutdent` | `"outdent"` | Outdent |
| `BtnLink` | custom | Insert/edit link |
| `BtnImage` | custom | Insert image |
| `BtnTable` | custom | Insert table |
| `BtnTwoColumns` | custom | Two-column layout block |
| `BtnMediaLeft` | custom | Media-left block |
| `BtnMediaRight` | custom | Media-right block |
| `BtnHeroMedia` | custom | Hero media block |

### Dictionary (i18n)

| Export | Description |
|---|---|
| `enUS` | English dictionary (default) |
| `ptBR` | Brazilian Portuguese dictionary |

### HTML utilities

| Export | Description |
|---|---|
| `sanitizeEditorHTML(value: string)` | Sanitizes HTML for safe editor content |
| `sanitizeImageURL(value: string)` | Validates image URLs (http, https, blob, data:) |
| `sanitizeLinkURL(value: string)` | Validates link URLs (http, https, mailto, tel) |
| `serializeTokens(html: string)` | Serializes token spans to plain text markers |
| `parseTokens(html: string)` | Parses token markers back to HTML spans |

### Hooks

| Export | Description |
|---|---|
| `useEditorContext()` | Returns `EditorContextValue`. Must be used inside `<Editor>`. |

### Types

All exported types: `EditorProps`, `ContentEditableProps`, `CommandAPI`, `Command`, `ChangeEvent`, `ButtonProps`, `CreateButtonOptions`, `EditorDictionary`, `EditorDictionaryInput`, `EditorTheme`, `EditorThemeInput`, `ImageResult`, `OnImportImage`, `EditorContextValue`, `CaretPos`.

---

## EditorProps

The `<Editor>` component accepts all `ContentEditableProps` plus:

| Prop | Type | Description |
|---|---|---|
| `value` | `string` | Controlled HTML content |
| `name` | `string` | Form field name |
| `disabled` | `boolean` | Disable editing |
| `tagName` | `string` | Custom root tag (default: `"div"`) |
| `placeholder` | `string` | Placeholder text when empty |
| `onChange` | `(event: ChangeEvent) => void` | Called on content change. `event.target.value` has the HTML string. |
| `containerProps` | `HTMLAttributes<HTMLDivElement>` | Props spread onto the outer container `<div>` |
| `onImportImage` | `(file: File) => Promise<string \| ImageResult>` | Custom image upload handler |
| `dictionary` | `EditorDictionaryInput` | Partial dictionary overrides for i18n |
| `theme` | `EditorThemeInput` | Theme color overrides |

Note: `EditorProps` **extends** `ContentEditableProps`, which **extends** `HTMLAttributes<HTMLElement>` (minus `onChange`, which is overridden). All standard HTML attributes like `id`, `className`, `style`, `onFocus`, `onBlur`, `onKeyDown`, etc. are accepted.

---

## useEditorContext

```tsx
const { el, selectionTick, getCommandAPI, getOnImportImage, ... } = useEditorContext();
```

| Property | Type | Description |
|---|---|---|
| `el` | `HTMLElement \| null` | The contenteditable DOM element |
| `htmlMode` | `boolean` | Whether HTML source view is active |
| `selectionTick` | `number` | Increments on every `selectionchange` within the editor. Use in `useEffect` deps to react to cursor/selection changes. |
| `dictionary` | `EditorDictionary` | Resolved dictionary (defaults merged with overrides) |
| `setEl` | `(el: HTMLElement \| null) => void` | Internal — do not call directly |
| `setHtmlMode` | `(v: boolean) => void` | Toggle HTML source view |
| `getCommandAPI` | `() => CommandAPI \| null` | Returns the full command API (null if editor not mounted) |
| `getOnImportImage` | `() => OnImportImage \| null` | Returns the image import handler |

---

## CommandAPI

Obtained via `useEditorContext().getCommandAPI()`. Returns `null` if called before mount.

```tsx
const { getCommandAPI } = useEditorContext();
const api = getCommandAPI();
```

### Methods

| Method | Signature | Description |
|---|---|---|
| `el` | `HTMLElement` | The contenteditable DOM element |
| `focus()` | `() => void` | Focus the editor |
| `exec(command, value?)` | `(cmd: string, value?: string) => void` | Execute a `document.execCommand` |
| `isActive(command)` | `(cmd: string) => boolean` | Check if a command state is active (bold, italic, etc.) |
| `getRange()` | `() => Range \| null` | Get the current DOM Range (cursor position or selection) |
| `getSelection()` | `() => Selection \| null` | Get the current DOM Selection |
| `saveCaretPosition()` | `() => CaretPos \| null` | Save cursor/selection as `{start, end}` text offsets |
| `restoreCaretPosition(pos)` | `(pos: CaretPos) => void` | Restore cursor/selection from saved offsets |
| `wrapSelection(tag, attrs?)` | `(tag: string, attrs?: Record<string,string>) => void` | Wrap selection in a new element |
| `insertHTML(html)` | `(html: string) => void` | Insert HTML at cursor, replacing selection |
| `insertToken(token, label?)` | `(token: string, label?: string) => void` | Insert a non-editable token span |

### CaretPos

```ts
type CaretPos = { start: number; end: number };
```

Text-level offsets relative to the editor root. `start === end` means collapsed cursor (no selection).

---

## Selection & cursor patterns

### Reacting to selection changes

```tsx
import { useEffect } from "react";
import { useEditorContext } from "react-wysiwyg-lite";

function SelectionMonitor() {
  const { getCommandAPI, selectionTick } = useEditorContext();

  useEffect(() => {
    const api = getCommandAPI();
    const range = api?.getRange();
    if (!range) return;

    const isCollapsed = range.collapsed;
    const selectedText = range.toString();
    const cursorOffset = api?.saveCaretPosition();

    console.log({ isCollapsed, selectedText, cursorOffset });
  }, [selectionTick]);

  return null;
}

// Usage:
<Editor value={html} onChange={setHtml}>
  <Toolbar>...</Toolbar>
  <SelectionMonitor />
</Editor>
```

### Getting selected text

```tsx
const api = getCommandAPI();

// Via Selection.toString()
const selectedText = api?.getSelection()?.toString();

// Via Range.toString()
const selectedText2 = api?.getRange()?.toString();
```

### Getting exact cursor position (DOM)

```tsx
const range = api?.getRange();
if (range?.collapsed) {
  // Cursor is blinking, no text selected
  const container = range.startContainer;   // DOM Node
  const offset = range.startOffset;          // character index within that node
}
```

### Saving and restoring cursor position (text offsets)

```tsx
const api = getCommandAPI();

// Save
const saved = api?.saveCaretPosition();
// → { start: 42, end: 42 } (collapsed cursor at char 42)
// → { start: 10, end: 25 } (text selected from char 10 to 25)

// Restore later (e.g. after DOM mutation)
if (saved) api?.restoreCaretPosition(saved);
```

This is useful when you need to modify editor content programmatically and return the cursor to where it was. Offsets are computed by walking text nodes in the editor root.

---

## Image handling

```tsx
<Editor
  value={html}
  onChange={setHtml}
  onImportImage={async (file: File) => {
    // Upload to your server/CDN
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const { url } = await res.json();
    return url; // or return { url, alt: "description", width: 800, height: 600 }
  }}
>
  <Toolbar>
    <BtnImage />
    {/* ... */}
  </Toolbar>
</Editor>
```

`onImportImage` receives a `File` and must return a `Promise` resolving to:
- `string` — image URL
- `{ url: string; alt?: string; width?: number; height?: number }`

Without `onImportImage`, `BtnImage` prompts for a URL directly.

---

## Custom buttons

```tsx
import { createButton, useEditorContext } from "react-wysiwyg-lite";

// Simple execCommand button
const BtnCustom = createButton("Custom", "🔥", "bold", {
  dictionaryKey: "bold",
});

// Custom logic with CommandAPI
const BtnInsertDate = createButton(
  "Insert Date",
  "📅",
  (api) => {
    api.insertHTML(new Date().toLocaleDateString());
  },
  { alwaysActive: true },
);
```

`CreateButtonOptions`:

| Option | Type | Default | Description |
|---|---|---|---|
| `alwaysActive` | `boolean` | `false` | If `true`, button never shows active state |
| `dictionaryKey` | `keyof EditorDictionary["toolbar"]` | — | Key for i18n label |

---

## i18n / Dictionary

```tsx
import { Editor, Toolbar, BtnBold, enUS, ptBR } from "react-wysiwyg-lite";

// Full locale
<Editor dictionary={ptBR}>...</Editor>

// Partial overrides
<Editor dictionary={{ toolbar: { bold: "Negrito" } }}>...</Editor>
```

`EditorDictionaryInput` accepts partial overrides for: `toolbar`, `link`, `imageToolbar`, `tableToolbar`, `blockPresets`, `table`.

---

## Theme

```tsx
<Editor
  theme={{
    colors: {
      editorBackground: "#1e1e2e",
      editorBorder: "#313244",
      toolbarBackground: "#181825",
      buttonText: "#cdd6f4",
      buttonHoverBackground: "#313244",
      buttonActiveBackground: "#45475a",
      buttonActiveText: "#cba6f7",
      linkApplyBackground: "#cba6f7",
      linkApplyText: "#1e1e2e",
      linkApplyHoverBackground: "#b4befe",
      selectionBackground: "#cba6f7",
      selectionText: "#1e1e2e",
    },
  }}
>
  ...
</Editor>
```

All color keys are optional — unspecified ones keep their defaults (light theme).

---

## HTML sanitization

The library exports standalone sanitization utilities:

```tsx
import { sanitizeEditorHTML, sanitizeLinkURL, sanitizeImageURL } from "react-wysiwyg-lite";

// Sanitize full editor HTML
const clean = sanitizeEditorHTML(dirtyHTML);

// Validate URLs
const safeLink = sanitizeLinkURL(userInput);   // null if invalid
const safeImg = sanitizeImageURL(userInput);    // null if invalid
```

---

## CSS custom properties

The editor uses these CSS variables for theming (set automatically via the `theme` prop, but can also be set manually):

| Variable | Default |
|---|---|
| `--rsw-color-bg` | `#ffffff` |
| `--rsw-color-border` | `#e2e8f0` |
| `--rsw-color-toolbar-bg` | `#f8fafc` |
| `--rsw-color-btn` | `#374151` |
| `--rsw-color-btn-hover` | `#f1f5f9` |
| `--rsw-color-btn-active` | `#e0e7ff` |
| `--rsw-color-btn-active-text` | `#4f46e5` |
| `--rsw-color-link-apply-bg` | `#4f46e5` |
| `--rsw-color-link-apply-text` | `#ffffff` |
| `--rsw-color-link-apply-hover` | `#4338ca` |
| `--rsw-selection-bg` | `#c7d2fe` |
| `--rsw-selection-text` | `#1e1b4b` |

---

## Complete examples

### Custom toolbar layout

```tsx
import { Editor, Toolbar, Separator, BtnBold, BtnItalic, BtnUndo, BtnRedo } from "react-wysiwyg-lite";

<Editor value={html} onChange={(e) => setHtml(e.target.value)}>
  <Toolbar>
    <BtnBold />
    <BtnItalic />
    <Separator />
    <BtnUndo />
    <BtnRedo />
  </Toolbar>
</Editor>
```

### Reactive selection tracking

```tsx
function useEditorSelection() {
  const { getCommandAPI, selectionTick } = useEditorContext();
  const [info, setInfo] = useState({ selectedText: "", cursorPos: null as CaretPos | null });

  useEffect(() => {
    const api = getCommandAPI();
    setInfo({
      selectedText: api?.getSelection()?.toString() ?? "",
      cursorPos: api?.saveCaretPosition(),
    });
  }, [selectionTick]);

  return info;
}
```

### Programmatic content manipulation

```tsx
const { getCommandAPI } = useEditorContext();

function insertHello() {
  const api = getCommandAPI();
  api?.focus();
  api?.insertHTML("<strong>Hello!</strong> ");
}

function wrapInSpan() {
  const api = getCommandAPI();
  api?.wrapSelection("span", { class: "highlight" });
}

function checkIfBold() {
  const api = getCommandAPI();
  return api?.isActive("bold") ?? false;
}
```
