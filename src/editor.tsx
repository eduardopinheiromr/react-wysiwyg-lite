import { forwardRef, type ForwardedRef } from 'react';
import type { EditorProps } from './types';
import { EditorProvider } from './context';
import { ContentEditable } from './contenteditable';

export const Editor = forwardRef(function Editor(
  { children, containerProps, onImportImage, ...rest }: EditorProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { className: containerClass, ...containerRest } = containerProps ?? {};
  // Spread only when defined — required by exactOptionalPropertyTypes
  const providerProps = onImportImage !== undefined ? { onImportImage } : {};

  return (
    <EditorProvider {...providerProps}>
      <div
        {...containerRest}
        className={['rsw-editor', containerClass].filter(Boolean).join(' ')}
      >
        {children}
        <ContentEditable {...rest} ref={ref} />
      </div>
    </EditorProvider>
  );
});
