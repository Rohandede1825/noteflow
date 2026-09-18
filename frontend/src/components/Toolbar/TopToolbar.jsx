import React from 'react';
import { useNotebookStore } from '../../store/useNotebookStore';
import { ColorPalettePopup } from './ColorPalettePopup';
import { PenStylePopup } from './PenStylePopup';
import { ShapeSettingsPopup } from './ShapeSettingsPopup';
import { TextSettingsPopup } from './TextSettingsPopup';
import { EraserSettingsPopup } from './EraserSettingsPopup';
import { LaserSettingsPopup } from './LaserSettingsPopup';
import { EmojiPickerPopup } from './EmojiPickerPopup';
import { HighlighterSettingsPopup } from './HighlighterSettingsPopup';
import {
  Undo2,
  Redo2
} from 'lucide-react';

export function TopToolbar() {
  const {
    undo,
    redo,
    undoStack,
    redoStack
  } = useNotebookStore();

  const canUndo = (undoStack || []).length > 0;
  const canRedo = (redoStack || []).length > 0;

  return (
    <>
      {/* 1. Floating Top-Left Undo / Redo Pill */}
      <div className="absolute top-20 left-4 z-30 flex items-center bg-[#1b1c20]/80 dark:bg-[#1b1c20]/80 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-floating">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded-lg transition-all ${
            canUndo
              ? 'text-white hover:bg-white/15 active:scale-95'
              : 'text-white/30 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded-lg transition-all ${
            canRedo
              ? 'text-white hover:bg-white/15 active:scale-95'
              : 'text-white/30 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Popups & Dialogs */}
      <ColorPalettePopup />
      <PenStylePopup />
      <EraserSettingsPopup />
      <ShapeSettingsPopup />
      <TextSettingsPopup />
      <LaserSettingsPopup />
      <EmojiPickerPopup />
      <HighlighterSettingsPopup />
    </>
  );
}
