import { describe, it, expect } from 'vitest';
import { normalizeHTML, isEmpty, sanitizePastedHTML, escapeAttr } from './html';

describe('escapeAttr', () => {
  it('escapes double quotes', () => {
    expect(escapeAttr('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('escapes ampersands', () => {
    expect(escapeAttr('A & B')).toBe('A &amp; B');
  });

  it('leaves safe characters alone', () => {
    expect(escapeAttr('hello world')).toBe('hello world');
  });
});

describe('normalizeHTML', () => {
  it('converts &nbsp; to space', () => {
    expect(normalizeHTML('a&nbsp;b')).toBe('a b');
  });

  it('converts unicode non-breaking spaces to space', () => {
    expect(normalizeHTML('a b')).toBe('a b');
    expect(normalizeHTML('a b')).toBe('a b');
  });

  it('normalizes self-closing <br/> to <br>', () => {
    expect(normalizeHTML('<br/>')).toBe('<br>');
    expect(normalizeHTML('<br />')).toBe('<br>');
  });

  it('normalizes <BR> to <br>', () => {
    expect(normalizeHTML('<BR>')).toBe('<br>');
  });

  it('leaves unrelated content unchanged', () => {
    expect(normalizeHTML('<b>hello</b>')).toBe('<b>hello</b>');
  });
});

describe('isEmpty', () => {
  it('returns true for empty string', () => {
    expect(isEmpty('')).toBe(true);
  });

  it('returns true for bare <br>', () => {
    expect(isEmpty('<br>')).toBe(true);
  });

  it('returns true for empty <p><br></p>', () => {
    expect(isEmpty('<p><br></p>')).toBe(true);
  });

  it('returns true for empty <div><br/></div>', () => {
    expect(isEmpty('<div><br/></div>')).toBe(true);
  });

  it('returns true for multiple empty blocks', () => {
    expect(isEmpty('<p><br></p><p><br></p>')).toBe(true);
  });

  it('returns false for text content', () => {
    expect(isEmpty('<p>hello</p>')).toBe(false);
  });

  it('returns false for non-empty html', () => {
    expect(isEmpty('<b>x</b>')).toBe(false);
  });
});

describe('sanitizePastedHTML', () => {
  it('keeps allowed tags', () => {
    const result = sanitizePastedHTML('<b>bold</b><i>italic</i>');
    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<i>italic</i>');
  });

  it('strips disallowed tags but keeps their text content', () => {
    const result = sanitizePastedHTML('<div><span>hello</span></div>');
    expect(result).toContain('hello');
    expect(result).not.toContain('<div>');
  });

  it('keeps <a> with allowed attributes', () => {
    const result = sanitizePastedHTML('<a href="https://example.com" target="_blank">link</a>');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank"');
  });

  it('strips disallowed attributes from <a>', () => {
    const result = sanitizePastedHTML('<a href="x" onclick="evil()">link</a>');
    expect(result).not.toContain('onclick');
    expect(result).toContain('href="x"');
  });

  it('strips <script> tags entirely', () => {
    const result = sanitizePastedHTML('<script>alert(1)</script>hello');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('hello');
  });

  it('strips style attributes from <b>', () => {
    const result = sanitizePastedHTML('<b style="color:red">bold</b>');
    expect(result).not.toContain('style=');
    expect(result).toContain('<b>bold</b>');
  });

  it('keeps <span> with style attribute', () => {
    const result = sanitizePastedHTML('<span style="color:red">text</span>');
    expect(result).toContain('style="color:red"');
  });
});
