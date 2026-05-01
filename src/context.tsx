import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CommandAPI, EditorContextValue, OnImportImage } from './types';
import * as sel from './selection';

const EditorContext = createContext<EditorContextValue | null>(null);

export const EditorProvider = ({
  children,
  onImportImage,
}: {
  children: ReactNode;
  onImportImage?: OnImportImage;
}) => {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [selectionTick, setSelectionTick] = useState(0);
  const elRef = useRef(el);
  const onImportImageRef = useRef<OnImportImage | null>(null);
  // Always up-to-date without triggering re-renders
  onImportImageRef.current = onImportImage ?? null;

  useEffect(() => {
    elRef.current = el;
  }, [el]);

  useEffect(() => {
    const onSelectionChange = () => {
      if (!elRef.current) return;
      const s = window.getSelection();
      if (!s?.rangeCount) return;
      if (elRef.current.contains(s.getRangeAt(0).commonAncestorContainer)) {
        setSelectionTick((t) => t + 1);
      }
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  const getCommandAPI = (): CommandAPI | null => {
    const current = elRef.current;
    if (!current) return null;

    return {
      el: current,
      focus: () => current.focus(),
      exec: (command, value) => {
        current.focus();
        document.execCommand(command, false, value);
      },
      isActive: (command) => {
        try {
          return document.queryCommandState(command);
        } catch {
          return false;
        }
      },
      getRange: sel.getRange,
      getSelection: sel.getSelection,
      wrapSelection: sel.wrapSelection,
      insertHTML: sel.insertHTML,
    };
  };

  const getOnImportImage = (): OnImportImage | null => onImportImageRef.current;

  return (
    <EditorContext.Provider
      value={{ el, htmlMode, selectionTick, setEl, setHtmlMode, getCommandAPI, getOnImportImage }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = (): EditorContextValue => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditorContext must be used within EditorProvider');
  return ctx;
};
