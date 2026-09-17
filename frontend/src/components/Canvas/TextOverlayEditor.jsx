import React, { useRef, useEffect } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { useNotebookStore } from '../../store/useNotebookStore';

export function TextOverlayEditor({ textState, onComplete, onCancel }) {
  const { textSettings } = useToolStore();
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Auto adjust height
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    // Enter without Shift commits
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      onComplete(textareaRef.current.value);
    }
  };

  const handleBlur = () => {
    if (textareaRef.current) {
      onComplete(textareaRef.current.value);
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div
      className="relative z-40 bg-[#1e2024]/95 backdrop-blur-md border-2 border-[#2F6BFF] rounded-xl shadow-floating p-2.5 animate-in fade-in zoom-in-95 duration-100"
      style={{
        minWidth: '260px',
        maxWidth: '650px'
      }}
    >
      <textarea
        ref={textareaRef}
        defaultValue={textState.initialText || ''}
        placeholder="Type your notes here... (Ctrl+Enter to save)"
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onInput={handleInput}
        rows={1}
        className="w-full bg-transparent resize-none border-none outline-none overflow-hidden text-neutral-100 leading-snug p-1"
        style={{
          fontSize: `${textSettings.fontSize || 18}px`,
          fontFamily: textSettings.fontFamily || 'Inter',
          fontWeight: textSettings.fontWeight || 'normal',
          fontStyle: textSettings.fontStyle || 'normal',
          color: textSettings.color || '#ffffff',
          textAlign: textSettings.textAlign || 'left'
        }}
      />
      <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-[10px] text-neutral-400">
        <span>Press <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-300">Ctrl+Enter</kbd> to save</span>
        <button
          onMouseDown={() => onComplete(textareaRef.current.value)}
          className="text-blue-400 hover:text-blue-300 font-semibold"
        >
          Done
        </button>
      </div>
    </div>
  );
}
