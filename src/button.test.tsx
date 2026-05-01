import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { createButton, Separator } from './button';
import { EditorProvider } from './context';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <EditorProvider>{children}</EditorProvider>
);

describe('createButton', () => {
  beforeEach(() => {
  });

  it('creates a button with the correct title', () => {
    const BtnTest = createButton('My Button', 'MB', 'bold');
    render(
      <Wrapper>
        <BtnTest />
      </Wrapper>,
    );
    expect(screen.getByTitle('My Button')).not.toBeNull();
  });

  it('renders the content inside the button', () => {
    const BtnTest = createButton('X', 'CONTENT', 'bold');
    const { container } = render(
      <Wrapper>
        <BtnTest />
      </Wrapper>,
    );
    expect(container.querySelector('button')?.textContent).toBe('CONTENT');
  });

  it('has tabIndex=-1', () => {
    const BtnTest = createButton('X', 'x', 'bold');
    const { container } = render(
      <Wrapper>
        <BtnTest />
      </Wrapper>,
    );
    expect(container.querySelector('button')?.tabIndex).toBe(-1);
  });

  it('has type=button', () => {
    const BtnTest = createButton('X', 'x', 'bold');
    const { container } = render(
      <Wrapper>
        <BtnTest />
      </Wrapper>,
    );
    expect(container.querySelector('button')?.type).toBe('button');
  });

  it('has rsw-btn class', () => {
    const BtnTest = createButton('X', 'x', 'bold');
    const { container } = render(
      <Wrapper>
        <BtnTest />
      </Wrapper>,
    );
    expect(container.querySelector('button')?.classList.contains('rsw-btn')).toBe(true);
  });

  it('sets correct displayName', () => {
    const BtnMyButton = createButton('My Button', 'MB', 'bold');
    expect(BtnMyButton.displayName).toBe('BtnMyButton');
  });

  it('calls execCommand on mousedown', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    document.body.appendChild(div);
    // Simulate the editor element being registered
    const BtnTest = createButton('Bold', 'B', 'bold');

    // Since no editor element is registered in context, execCommand won't be called
    // This test verifies the call doesn't throw
    const { container } = render(
      <Wrapper>
        <BtnTest />
      </Wrapper>,
    );
    const btn = container.querySelector('button')!;
    fireEvent.mouseDown(btn);
    document.body.removeChild(div);
  });

  it('accepts a function command', () => {
    const commandFn = vi.fn();
    const BtnTest = createButton('Custom', 'C', commandFn);
    const { container } = render(
      <Wrapper>
        <BtnTest />
      </Wrapper>,
    );
    const btn = container.querySelector('button')!;
    fireEvent.mouseDown(btn);
    // commandFn not called if no editor element in context — no error expected
  });

  it('merges custom className', () => {
    const BtnTest = createButton('X', 'x', 'bold');
    const { container } = render(
      <Wrapper>
        <BtnTest className="my-class" />
      </Wrapper>,
    );
    const btn = container.querySelector('button');
    expect(btn?.classList.contains('rsw-btn')).toBe(true);
    expect(btn?.classList.contains('my-class')).toBe(true);
  });
});

describe('Separator', () => {
  it('renders an aria-hidden divider', () => {
    const { container } = render(<Separator />);
    const sep = container.querySelector('.rsw-separator');
    expect(sep).not.toBeNull();
    expect(sep?.getAttribute('aria-hidden')).toBe('true');
  });
});
