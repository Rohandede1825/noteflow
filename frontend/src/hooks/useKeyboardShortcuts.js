import { useEffect } from 'react';
import { useToolStore } from '../store/useToolStore';
import { useNotebookStore } from '../store/useNotebookStore';
import { useUIStore } from '../store/useUIStore';

export function useKeyboardShortcuts({ onTriggerImageUpload } = {}) {
  const { setActiveTool, closePopup } = useToolStore();
  const { undo, redo, saveCurrentPageNow, currentPageIndex, setCurrentPageIndex, pages } = useNotebookStore();
  const { isTeachingMode, setTeachingMode, closeModal, activeModal, zoomIn, zoomOut } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing inside an input or textarea
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCurrentPageNow();
        useUIStore.getState().addToast('Notebook saved ✓', 'success', 2000);
        return;
      }

      // Print
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        closePopup();
        if (activeModal) closeModal();
        if (isTeachingMode) setTeachingMode(false);
        return;
      }

      // Single key tool shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase();
        switch (key) {
          case 'p':
            setActiveTool('pen');
            break;
          case 'e':
            setActiveTool('eraser');
            break;
          case 'h':
            setActiveTool('highlighter');
            break;
          case 's':
            setActiveTool('select');
            break;
          case 't':
            setActiveTool('text');
            break;
          case 'l':
            setActiveTool('line');
            break;
          case 'r':
            setActiveTool('shapes');
            break;
          case 'i':
            if (onTriggerImageUpload) onTriggerImageUpload();
            break;
          case 'z':
            zoomIn();
            break;
          case 'x':
            zoomOut();
            break;
          case 'arrowleft':
            if (currentPageIndex > 0) {
              setCurrentPageIndex(currentPageIndex - 1);
            }
            break;
          case 'arrowright':
            if (currentPageIndex < pages.length - 1) {
              setCurrentPageIndex(currentPageIndex + 1);
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setActiveTool,
    closePopup,
    undo,
    redo,
    saveCurrentPageNow,
    isTeachingMode,
    setTeachingMode,
    activeModal,
    closeModal,
    zoomIn,
    zoomOut,
    currentPageIndex,
    setCurrentPageIndex,
    pages,
    onTriggerImageUpload
  ]);
}
