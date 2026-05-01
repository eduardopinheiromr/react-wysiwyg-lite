# react-wysiwyg-lite

Lightweight, extensible WYSIWYG editor for React. Zero dependencies, 100% TypeScript.

## Install

```bash
npm install react-wysiwyg-lite
```

## Usage

### Uncontrolled — recomendado

Sem re-renders. Lê o valor só quando precisa (submit, autosave, etc).

```tsx
import { useRef } from 'react';
import { DefaultEditor } from 'react-wysiwyg-lite';
import 'react-wysiwyg-lite/styles.css';

const App = () => {
  const htmlRef = useRef('<p>Initial content</p>');

  const handleSave = () => {
    console.log(htmlRef.current); // HTML limpo, sem re-renders
  };

  return (
    <>
      <DefaultEditor
        value={htmlRef.current}
        onChange={(e) => { htmlRef.current = e.target.value; }}
        placeholder="Start writing..."
      />
      <button onClick={handleSave}>Save</button>
    </>
  );
};
```

### Controlled — quando precisar reagir ao conteúdo em tempo real

```tsx
import { useState } from 'react';
import { DefaultEditor } from 'react-wysiwyg-lite';
import 'react-wysiwyg-lite/styles.css';

const App = () => {
  const [html, setHtml] = useState('');

  return (
    <DefaultEditor
      value={html}
      onChange={(e) => setHtml(e.target.value)}
    />
  );
};
```

## Integração com react-hook-form

O padrão mais simples é usar `Controller`, que adapta a API `{ value, onChange }` do editor ao `field` do RHF:

```tsx
import { useForm, Controller } from 'react-hook-form';
import { DefaultEditor } from 'react-wysiwyg-lite';
import 'react-wysiwyg-lite/styles.css';

type FormData = {
  title: string;
  body: string;
};

const PostForm = () => {
  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { title: '', body: '' },
  });

  const onSubmit = (data: FormData) => {
    console.log(data.body); // HTML string pronto pra salvar
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title', { required: 'Required' })} placeholder="Title" />

      <Controller
        name="body"
        control={control}
        rules={{ required: 'Content is required' }}
        render={({ field }) => (
          <DefaultEditor
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            placeholder="Write something..."
          />
        )}
      />
      {errors.body && <span>{errors.body.message}</span>}

      <button type="submit">Publish</button>
    </form>
  );
};
```

`Controller` internamente usa `useRef` para o valor e só dispara re-renders quando o campo muda de estado de validação — então performance é equivalente ao padrão uncontrolled manual acima.

## Composable API

```tsx
import { Editor, Toolbar, BtnBold, BtnItalic, BtnLink, BtnImage, Separator } from 'react-wysiwyg-lite';

const MyEditor = ({ value, onChange }) => (
  <Editor value={value} onChange={onChange}>
    <Toolbar>
      <BtnBold />
      <BtnItalic />
      <Separator />
      <BtnLink />
      <BtnImage />
    </Toolbar>
  </Editor>
);
```

## Custom buttons

`createButton` aceita uma string de `execCommand` ou uma função com acesso à `CommandAPI`:

```tsx
import { createButton } from 'react-wysiwyg-lite';

// execCommand direto
const BtnSubscript = createButton('Subscript', <sub>x</sub>, 'subscript');

// Selection API customizada
const BtnHighlight = createButton('Highlight', '🖊', (api) => {
  api.wrapSelection('mark', { style: 'background: #fef08a' });
});

// Inserir HTML no cursor
const BtnHR = createButton('Divider', '—', (api) => {
  api.insertHTML('<hr>');
});
```

## CommandAPI

```ts
type CommandAPI = {
  el: HTMLElement;
  exec: (command: string, value?: string) => void;  // execCommand wrapper
  isActive: (command: string) => boolean;            // queryCommandState wrapper
  getRange: () => Range | null;                      // Selection API
  getSelection: () => Selection | null;
  wrapSelection: (tag: string, attrs?: Record<string, string>) => void;
  insertHTML: (html: string) => void;
  focus: () => void;
};
```

## Theming

```css
.rsw-editor {
  --rsw-color-border: #cbd5e1;
  --rsw-color-btn-active: #dcfce7;
  --rsw-color-btn-active-text: #16a34a;
  --rsw-radius: 4px;
  --rsw-min-height: 300px;
}
```

## Built-in buttons

| Export | Ação |
|---|---|
| `BtnBold` | Negrito |
| `BtnItalic` | Itálico |
| `BtnUnderline` | Sublinhado |
| `BtnStrikeThrough` | Tachado |
| `BtnBulletList` | Lista não ordenada |
| `BtnOrderedList` | Lista ordenada |
| `BtnLink` | Link (popover nativo) |
| `BtnImage` | Imagem (file picker) |
| `BtnAlignLeft/Center/Right` | Alinhamento |
| `BtnUndo` / `BtnRedo` | Histórico |
| `BtnClearFormatting` | Limpar formatação |
| `BtnSubscript` / `BtnSuperscript` | Sub/Superscript |
| `BtnIndent` / `BtnOutdent` | Indentação |

## Architecture

| Decisão | Implementação |
|---|---|
| Detecção de mudanças | `MutationObserver` — não re-renderiza no onChange |
| innerHTML | Imperativo via `useEffect` — React nunca toca no DOM do editor |
| Preservação de caret | Selection API com TreeWalker (text offsets) |
| Paste | Sanitização com allowlist — sem surpresas do browser |
| Link popover | Popover API nativa — salva/restaura Range antes/depois |
| Imagem | FileReader → base64 → insertHTML |
