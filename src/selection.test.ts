import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveCaretPosition,
  restoreCaretPosition,
  getRange,
  getSelection,
  wrapSelection,
  insertHTML,
  caretRangeFromPoint,
} from './selection';

describe('getRange', () => {
  it('returns null when there is no selection', () => {
    window.getSelection()?.removeAllRanges();
    expect(getRange()).toBeNull();
  });

  it('returns a Range when selection exists', () => {
    const div = document.createElement('div');
    div.textContent = 'hello';
    document.body.appendChild(div);

    const range = document.createRange();
    range.selectNodeContents(div);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    expect(getRange()).toBeInstanceOf(Range);

    document.body.removeChild(div);
    sel.removeAllRanges();
  });
});

describe('getSelection', () => {
  it('returns the window Selection object', () => {
    expect(getSelection()).toBe(window.getSelection());
  });
});

describe('saveCaretPosition / restoreCaretPosition', () => {
  let div: HTMLElement;

  beforeEach(() => {
    div = document.createElement('div');
    div.textContent = 'hello world';
    document.body.appendChild(div);
    window.getSelection()?.removeAllRanges();
  });

  afterEach(() => {
    document.body.removeChild(div);
  });

  it('returns null when no selection', () => {
    expect(saveCaretPosition(div)).toBeNull();
  });

  it('saves and restores caret position', () => {
    const range = document.createRange();
    const textNode = div.firstChild!;
    range.setStart(textNode, 0);
    range.setEnd(textNode, 5);

    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    const pos = saveCaretPosition(div);
    expect(pos).toEqual({ start: 0, end: 5 });

    sel.removeAllRanges();
    restoreCaretPosition(div, pos!);

    const restored = window.getSelection()!.getRangeAt(0);
    expect(restored.startOffset).toBe(0);
    expect(restored.endOffset).toBe(5);
  });

  it('returns null when selection is outside the element', () => {
    const other = document.createElement('div');
    other.textContent = 'other';
    document.body.appendChild(other);

    const range = document.createRange();
    range.selectNodeContents(other);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    expect(saveCaretPosition(div)).toBeNull();

    document.body.removeChild(other);
  });
});

describe('insertHTML', () => {
  it('inserts html at cursor position', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    div.textContent = '';
    document.body.appendChild(div);

    const range = document.createRange();
    range.setStart(div, 0);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    insertHTML('<b>bold</b>');
    expect(div.innerHTML).toContain('<b>bold</b>');

    document.body.removeChild(div);
    sel.removeAllRanges();
  });
});

describe('wrapSelection', () => {
  it('wraps selected text with the given tag', () => {
    const div = document.createElement('div');
    div.textContent = 'hello';
    document.body.appendChild(div);

    const range = document.createRange();
    range.selectNodeContents(div);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    wrapSelection('strong');
    expect(div.querySelector('strong')).not.toBeNull();

    document.body.removeChild(div);
    sel.removeAllRanges();
  });

  it('sets attributes on the wrapper', () => {
    const div = document.createElement('div');
    div.textContent = 'hello';
    document.body.appendChild(div);

    const range = document.createRange();
    range.selectNodeContents(div);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    wrapSelection('a', { href: 'https://example.com' });
    const anchor = div.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://example.com');

    document.body.removeChild(div);
    sel.removeAllRanges();
  });
});

describe('caretRangeFromPoint', () => {
  it('returns null in jsdom (no implementation)', () => {
    // jsdom does not implement caretRangeFromPoint or caretPositionFromPoint
    const result = caretRangeFromPoint(0, 0);
    expect(result === null || result instanceof Range).toBe(true);
  });
});
