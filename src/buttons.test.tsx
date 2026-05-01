import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  BtnBold, BtnItalic, BtnUnderline, BtnStrikeThrough,
  BtnBulletList, BtnOrderedList,
  BtnAlignLeft, BtnAlignCenter, BtnAlignRight,
  BtnUndo, BtnRedo, BtnClearFormatting,
  BtnLink, BtnImage,
  BtnSubscript, BtnSuperscript,
  BtnIndent, BtnOutdent,
} from './buttons';
import { Editor } from './editor';
import { Toolbar } from './toolbar';
import { EditorProvider } from './context';

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

describe('simple command buttons', () => {
  const simpleBtns = [
    { Btn: BtnBold, title: 'Bold' },
    { Btn: BtnItalic, title: 'Italic' },
    { Btn: BtnUnderline, title: 'Underline' },
    { Btn: BtnStrikeThrough, title: 'Strikethrough' },
    { Btn: BtnBulletList, title: 'Bullet list' },
    { Btn: BtnOrderedList, title: 'Numbered list' },
    { Btn: BtnAlignLeft, title: 'Align left' },
    { Btn: BtnAlignCenter, title: 'Align center' },
    { Btn: BtnAlignRight, title: 'Align right' },
    { Btn: BtnUndo, title: 'Undo' },
    { Btn: BtnRedo, title: 'Redo' },
    { Btn: BtnClearFormatting, title: 'Clear formatting' },
    { Btn: BtnSubscript, title: 'Subscript' },
    { Btn: BtnSuperscript, title: 'Superscript' },
    { Btn: BtnIndent, title: 'Indent' },
    { Btn: BtnOutdent, title: 'Outdent' },
  ];

  for (const { Btn, title } of simpleBtns) {
    it(`renders ${title} button`, () => {
      render(<Wrapper><Btn /></Wrapper>);
      expect(screen.getByTitle(title)).not.toBeNull();
    });
  }
});

describe('BtnLink', () => {
  it('renders the link button', () => {
    render(<WithEditor><BtnLink /></WithEditor>);
    expect(screen.getByTitle('Link')).not.toBeNull();
  });

  it('popover is not visible initially', () => {
    const { container } = render(<WithEditor><BtnLink /></WithEditor>);
    expect(container.querySelector('.rsw-link-popover')).toBeNull();
  });

  it('shows popover on mousedown', () => {
    const { container } = render(<WithEditor><BtnLink /></WithEditor>);
    fireEvent.mouseDown(screen.getByTitle('Link'));
    expect(container.querySelector('.rsw-link-popover')).not.toBeNull();
  });

  it('popover contains url input and apply/cancel buttons', () => {
    const { container } = render(<WithEditor><BtnLink /></WithEditor>);
    fireEvent.mouseDown(screen.getByTitle('Link'));
    const popover = container.querySelector('.rsw-link-popover')!;
    expect(within(popover).getByPlaceholderText('https://')).not.toBeNull();
    expect(container.querySelector('.rsw-link-apply')).not.toBeNull();
    expect(container.querySelector('.rsw-link-cancel')).not.toBeNull();
  });

  it('closes popover when cancel is clicked', () => {
    const { container } = render(<WithEditor><BtnLink /></WithEditor>);
    fireEvent.mouseDown(screen.getByTitle('Link'));
    expect(container.querySelector('.rsw-link-popover')).not.toBeNull();

    const cancelBtn = container.querySelector('.rsw-link-cancel') as HTMLButtonElement;
    fireEvent.click(cancelBtn);
    expect(container.querySelector('.rsw-link-popover')).toBeNull();
  });

  it('updates url input value when typing', async () => {
    const user = userEvent.setup();
    const { container } = render(<WithEditor><BtnLink /></WithEditor>);
    fireEvent.mouseDown(screen.getByTitle('Link'));

    const input = container.querySelector('.rsw-link-input') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'https://example.com');
    expect(input.value).toBe('https://example.com');
  });

  it('closes popover when outside is clicked', async () => {
    const { container } = render(
      <div>
        <WithEditor><BtnLink /></WithEditor>
        <div data-testid="outside">outside</div>
      </div>,
    );
    fireEvent.mouseDown(screen.getByTitle('Link'));
    expect(container.querySelector('.rsw-link-popover')).not.toBeNull();

    fireEvent.pointerDown(screen.getByTestId('outside'));
    await waitFor(() => {
      expect(container.querySelector('.rsw-link-popover')).toBeNull();
    });
  });
});

describe('BtnImage', () => {
  it('renders the image button', () => {
    render(<Wrapper><BtnImage /></Wrapper>);
    expect(screen.getByTitle('Insert image')).not.toBeNull();
  });

  it('has a hidden file input', () => {
    const { container } = render(<Wrapper><BtnImage /></Wrapper>);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.style.display).toBe('none');
    expect(input.accept).toBe('image/*');
  });

  it('calls onImportImage when file is selected', async () => {
    const onImportImage = vi.fn().mockResolvedValue('https://cdn.example.com/img.png');
    const { container } = render(
      <EditorProvider onImportImage={onImportImage}>
        <BtnImage />
      </EditorProvider>,
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['(img)'], 'photo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImportImage).toHaveBeenCalledWith(file);
    });
  });
});
