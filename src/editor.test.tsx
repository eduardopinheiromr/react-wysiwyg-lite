import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Editor } from './editor';

describe('Editor', () => {
  it('renders without crashing', () => {
    const { container } = render(<Editor />);
    expect(container.querySelector('.rsw-editor')).not.toBeNull();
  });

  it('renders a contenteditable div inside', () => {
    const { container } = render(<Editor />);
    const ce = container.querySelector('.rsw-ce');
    expect(ce).not.toBeNull();
    expect(ce?.getAttribute('contenteditable')).toBe('true');
  });

  it('renders children (toolbar etc.) inside the container', () => {
    const { container } = render(
      <Editor>
        <div data-testid="toolbar-slot">toolbar</div>
      </Editor>,
    );
    expect(container.querySelector('[data-testid="toolbar-slot"]')).not.toBeNull();
  });

  it('merges containerProps className', () => {
    const { container } = render(<Editor containerProps={{ className: 'my-editor' }} />);
    const wrapper = container.querySelector('.rsw-editor');
    expect(wrapper?.classList.contains('my-editor')).toBe(true);
  });

  it('passes placeholder to contenteditable', () => {
    const { container } = render(<Editor placeholder="Write here..." />);
    const ce = container.querySelector('.rsw-ce');
    expect(ce?.getAttribute('data-placeholder')).toBe('Write here...');
  });

  it('renders as disabled when disabled prop is set', () => {
    const { container } = render(<Editor disabled />);
    const ce = container.querySelector('.rsw-ce');
    expect(ce?.getAttribute('contenteditable')).toBe('false');
  });

  it('sets initial value as innerHTML', () => {
    const { container } = render(<Editor value="<p>Hello</p>" />);
    const ce = container.querySelector('.rsw-ce');
    expect(ce?.innerHTML).toBe('<p>Hello</p>');
  });
});
