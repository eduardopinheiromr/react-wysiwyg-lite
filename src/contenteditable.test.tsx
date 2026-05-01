import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { ContentEditable } from './contenteditable';
import { EditorProvider } from './context';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <EditorProvider>{children}</EditorProvider>
);

describe('ContentEditable', () => {
  it('renders with rsw-ce class', () => {
    const { container } = render(
      <Wrapper>
        <ContentEditable />
      </Wrapper>,
    );
    expect(container.querySelector('.rsw-ce')).not.toBeNull();
  });

  it('renders as contenteditable by default', () => {
    const { container } = render(
      <Wrapper>
        <ContentEditable />
      </Wrapper>,
    );
    expect(container.querySelector('[contenteditable="true"]')).not.toBeNull();
  });

  it('renders as non-editable when disabled', () => {
    const { container } = render(
      <Wrapper>
        <ContentEditable disabled />
      </Wrapper>,
    );
    expect(container.querySelector('[contenteditable="false"]')).not.toBeNull();
  });

  it('sets initial value as innerHTML', () => {
    const { container } = render(
      <Wrapper>
        <ContentEditable value="<b>bold</b>" />
      </Wrapper>,
    );
    expect(container.querySelector('.rsw-ce')?.innerHTML).toBe('<b>bold</b>');
  });

  it('sets data-placeholder attribute', () => {
    const { container } = render(
      <Wrapper>
        <ContentEditable placeholder="Start typing" />
      </Wrapper>,
    );
    expect(container.querySelector('.rsw-ce')?.getAttribute('data-placeholder')).toBe('Start typing');
  });

  it('merges custom className', () => {
    const { container } = render(
      <Wrapper>
        <ContentEditable className="custom" />
      </Wrapper>,
    );
    const el = container.querySelector('.rsw-ce');
    expect(el?.classList.contains('custom')).toBe(true);
  });

  it('renders as a custom tagName', () => {
    const { container } = render(
      <Wrapper>
        <ContentEditable tagName="article" />
      </Wrapper>,
    );
    expect(container.querySelector('article.rsw-ce')).not.toBeNull();
  });

  it('handles paste via testing-library', () => {
    const { container } = render(
      <Wrapper>
        <ContentEditable />
      </Wrapper>,
    );
    const ce = container.querySelector('.rsw-ce')!;
    // Should not throw when pasting plain text
    act(() => {
      fireEvent.paste(ce, {
        clipboardData: {
          getData: (type: string) => (type === 'text/plain' ? 'pasted text' : ''),
        },
      });
    });
  });

  it('calls custom onPaste handler when provided', () => {
    const onPaste = vi.fn();
    const { container } = render(
      <Wrapper>
        <ContentEditable onPaste={onPaste} />
      </Wrapper>,
    );
    const ce = container.querySelector('.rsw-ce')!;
    act(() => {
      fireEvent.paste(ce);
    });
    expect(onPaste).toHaveBeenCalledTimes(1);
  });

  it('accepts drag events without throwing', () => {
    const { container } = render(
      <Wrapper>
        <ContentEditable />
      </Wrapper>,
    );
    const ce = container.querySelector('.rsw-ce')!;
    act(() => {
      fireEvent.dragOver(ce, {
        dataTransfer: { items: [{ type: 'image/png' }], dropEffect: '' },
      });
    });
  });
});
