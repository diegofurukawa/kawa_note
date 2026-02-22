import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Pin, Loader2, ExternalLink, FolderInput, Edit3, Eye, Check, CheckSquare, ArrowUp, ArrowDown } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeUrlTransform } from '@/lib/constants';
import { format } from "date-fns";
import { toast } from 'sonner';
import { useUpdateNote } from '@/api/useNotes';
import TagManager from './TagManager';
import UrlPreviewCard from './UrlPreviewCard';
import { checkAndHandleEncryptionError } from '@/lib/errorHandlers';
import {
  preprocessContent,
  toggleCheckbox,
  insertCheckboxItem,
  moveLineUp,
  moveLineDown,
  getCheckboxLineIndices,
} from '@/lib/markdownUtils';

const typeColors = {
  text: "bg-slate-100 text-slate-700",
  url: "bg-blue-100 text-blue-700",
  image: "bg-purple-100 text-purple-700",
  word: "bg-amber-100 text-amber-700"
};

/**
 * NoteEditor - Editor de notas com auto-save e suporte a markdown
 * @param {Object} props - Props do componente
 * @param {Object} props.note - Nota a ser editada
 * @param {Function} props.onSave - Callback após salvar
 * @param {Function} [props.onClose] - Callback para fechar editor (apenas mode='standalone')
 * @param {Array} [props.allNotes] - Todas as notas (para autocomplete de tags)
 * @param {Function} [props.onMoveNote] - Callback para mover nota
 * @param {'standalone'|'panel'} [props.mode='standalone'] - Layout mode.
 *   'standalone': preserves V1 behaviour (close button, double-click to edit).
 *   'panel': no close button, single-click activates Edit Mode.
 * @param {Function} [props.onSaveStatusChange] - Called with saveStatus whenever it changes.
 * @returns {JSX.Element} Editor de notas com visualização e edição
 */
export default function NoteEditor({ note, onSave, onClose = () => {}, allNotes = [], onMoveNote, mode = 'standalone', onSaveStatusChange }) {
  const [editedNote, setEditedNote] = useState(note);
  const [isDirty, setIsDirty] = useState(false);
  const [_isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
  const [_error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const updateNoteMutation = useUpdateNote();
  const debounceTimerRef = useRef(null);
  const saveToastShownRef = useRef(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setEditedNote(note);
    setIsDirty(false);
    setSaveStatus('idle');
    setError(null);
    setIsEditMode(false);
    saveToastShownRef.current = false;
  }, [note]);

  // Extract all unique tags from all notes for autocomplete
  const allTags = useMemo(() => {
    const tagSet = new Set();
    allNotes.forEach(n => {
      if (n.tags && Array.isArray(n.tags)) {
        n.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [allNotes]);

  // Generate suggested tags from metadata
  const suggestedTags = useMemo(() => {
    const suggestions = [];
    
    if (editedNote.previewData) {
      try {
        const preview = typeof editedNote.previewData === 'string' 
          ? JSON.parse(editedNote.previewData) 
          : editedNote.previewData;
        
        if (preview.ogSiteName) suggestions.push(preview.ogSiteName);
        if (preview.ogType) suggestions.push(preview.ogType);
        if (preview.domain) suggestions.push(preview.domain);
      } catch {
        // Ignore parse errors
      }
    }
    
    return suggestions;
  }, [editedNote.previewData]);

  // Propagate saveStatus to parent (NoteDetailPanel) via callback
  useEffect(() => {
    if (onSaveStatusChange) onSaveStatusChange(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  // Auto-save effect com debounce
  useEffect(() => {
    if (!isDirty) return;

    setSaveStatus('dirty');

    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Configurar novo timer (1500ms debounce)
    debounceTimerRef.current = setTimeout(() => {
      handleAutoSave();
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isDirty, editedNote]);

  const handleAutoSave = useCallback(async () => {
    if (!isDirty) return;

    // Do not attempt to save if content is empty — API requires at least 1 character.
    // The user may be mid-edit; silently skip and let them continue.
    if (!editedNote.content?.trim()) {
      setSaveStatus('idle');
      return;
    }

    try {
      setSaveStatus('saving');
      setIsSaving(true);
      setError(null);

      await updateNoteMutation.mutateAsync({
        id: note.id,
        data: {
          title: editedNote.title?.trim() || 'Sem título',
          content: editedNote.content,
          pinned: editedNote.pinned,
          tags: editedNote.tags
        }
      });

      setSaveStatus('saved');
      setIsDirty(false);

      // Mostrar indicador "Salvo" por 3 segundos
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);

      if (onSave) onSave();
    } catch (err) {
      // Check if it's an encryption error and handle logout
      if (checkAndHandleEncryptionError(err)) {
        return;
      }

      const errorMessage = err?.data?.error?.message || err?.message || 'Erro ao salvar nota';
      setError(errorMessage);
      setSaveStatus('error');
      
      // Mostrar toast de erro apenas uma vez
      if (!saveToastShownRef.current) {
        saveToastShownRef.current = true;
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  }, [editedNote, note.id, updateNoteMutation, isDirty, onSave]);

  // Força save imediato com Ctrl+S
  const handleForceSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await handleAutoSave();
  }, [handleAutoSave]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleForceSave();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleForceSave, onClose]);

  // F1 — Preprocessed content for view mode (preserves newlines)
  const processedContent = useMemo(
    () => preprocessContent(editedNote.content),
    [editedNote.content]
  );

  // F2 — Checkbox line indices for mapping rendered checkboxes to content lines
  const checkboxLines = useMemo(
    () => getCheckboxLineIndices(editedNote.content),
    [editedNote.content]
  );

  // F2 — Stable counter ref for checkboxComponents: reset before each ReactMarkdown render
  // Using a ref avoids stale closure issues caused by React re-rendering component functions
  // multiple times (e.g., concurrent mode / strict mode).
  const checkboxCounterRef = useRef(0);

  // F2 — Custom ReactMarkdown components for interactive checkboxes
  const checkboxComponents = useMemo(() => ({
    input: ({ checked, type, node: _node, disabled: _disabled, ...props }) => {
      if (type !== 'checkbox') return <input type={type} {...props} />;
      // Each checkbox gets the next slot in the ordered list of checkbox-lines.
      // The counter is reset to 0 in the JSX just before ReactMarkdown renders,
      // so it always maps correctly regardless of how many times React calls this.
      const currentIndex = checkboxCounterRef.current;
      checkboxCounterRef.current += 1;
      const contentLineIndex = checkboxLines[currentIndex];
      return (
        <input
          type="checkbox"
          checked={checked}
          // Remove `disabled` so the checkbox is interactive (remark-gfm adds disabled by default)
          onChange={(e) => {
            e.stopPropagation();
            if (contentLineIndex !== undefined) {
              const newContent = toggleCheckbox(editedNote.content, contentLineIndex);
              handleChange('content', newContent);
            }
          }}
          className="mr-2 cursor-pointer accent-indigo-600"
        />
      );
    },
    li: ({ children, className, ...props }) => {
      // Detect if this is a completed task-list-item by inspecting React children
      let isCheckedItem = false;
      if (className === 'task-list-item') {
        React.Children.forEach(children, (child) => {
          if (React.isValidElement(child) && child.props?.checked === true) {
            isCheckedItem = true;
          }
        });
      }
      return (
        <li
          className={`${className || ''} ${isCheckedItem ? 'line-through text-slate-400 transition-all duration-200' : ''}`}
          {...props}
        >
          {children}
        </li>
      );
    },
  }), [checkboxLines, editedNote.content]);

  // F2 — Insert a new To-Do item
  const handleInsertTodo = useCallback(() => {
    if (!isEditMode) {
      // Switch to edit mode and append
      setIsEditMode(true);
      const newContent = insertCheckboxItem(editedNote.content, null);
      handleChange('content', newContent);
    } else {
      // In edit mode: insert at cursor position or at end
      const textarea = textareaRef.current;
      let cursorLineIndex = null;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = editedNote.content.substring(0, cursorPos);
        cursorLineIndex = textBeforeCursor.split('\n').length - 1;
      }
      const newContent = insertCheckboxItem(editedNote.content, cursorLineIndex);
      handleChange('content', newContent);
      // Focus textarea after insert
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 50);
    }
  }, [isEditMode, editedNote.content]);

  // F3 — Get current cursor line index from textarea
  const getCursorLineIndex = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return 0;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    return textBeforeCursor.split('\n').length - 1;
  }, []);

  // F3 — Set cursor to a specific line in the textarea
  const setCursorToLine = useCallback((lineIndex) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const lines = textarea.value.split('\n');
    let pos = 0;
    for (let i = 0; i < lineIndex && i < lines.length; i++) {
      pos += lines[i].length + 1; // +1 for \n
    }
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(pos, pos);
    }, 0);
  }, []);

  // F3 — Handle move line up
  const handleMoveLineUp = useCallback(() => {
    const lineIndex = getCursorLineIndex();
    const result = moveLineUp(editedNote.content, lineIndex);
    if (result.content !== editedNote.content) {
      handleChange('content', result.content);
      setCursorToLine(result.newLineIndex);
    }
  }, [editedNote.content, getCursorLineIndex, setCursorToLine]);

  // F3 — Handle move line down
  const handleMoveLineDown = useCallback(() => {
    const lineIndex = getCursorLineIndex();
    const result = moveLineDown(editedNote.content, lineIndex);
    if (result.content !== editedNote.content) {
      handleChange('content', result.content);
      setCursorToLine(result.newLineIndex);
    }
  }, [editedNote.content, getCursorLineIndex, setCursorToLine]);

  // F3 — Keyboard shortcut handler for Alt+Up / Alt+Down in textarea
  const handleTextareaKeyDown = useCallback((e) => {
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      handleMoveLineUp();
    } else if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      handleMoveLineDown();
    }
  }, [handleMoveLineUp, handleMoveLineDown]);

  const handleChange = (field, value) => {
    setEditedNote(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    saveToastShownRef.current = false;
  };

  const handleTogglePin = async () => {
    const newPinned = !editedNote.pinned;
    setEditedNote(prev => ({ ...prev, pinned: newPinned }));
    try {
      setError(null);
      await updateNoteMutation.mutateAsync({
        id: note.id,
        data: { pinned: newPinned }
      });
      toast.success('Nota atualizada');
      if (onSave) onSave();
    } catch (err) {
      // Check if it's an encryption error and handle logout
      if (checkAndHandleEncryptionError(err)) {
        return;
      }
      
      const errorMessage = err?.data?.error?.message || err?.message || 'Erro ao atualizar nota';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Parse preview data
  const previewData = useMemo(() => {
    if (!editedNote.previewData) return null;
    try {
      return typeof editedNote.previewData === 'string' 
        ? JSON.parse(editedNote.previewData) 
        : editedNote.previewData;
    } catch {
      return null;
    }
  }, [editedNote.previewData]);

  // Render save status indicator
  const renderSaveIndicator = () => {
    switch (saveStatus) {
      case 'dirty':
        return <span className="text-xs text-amber-600 font-medium">• Não salvo</span>;
      case 'saving':
        return (
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Salvando...
          </span>
        );
      case 'saved':
        return (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <Check className="w-3 h-3" />
            Salvo
          </span>
        );
      case 'error':
        return <span className="text-xs text-red-600 font-medium">• Erro ao salvar</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Badge className={`${typeColors[editedNote.type]} border-0 text-xs`}>
            {editedNote.type}
          </Badge>
          <span className="text-xs text-slate-400">
            {format(new Date(editedNote.createdAt), 'dd/MM/yyyy HH:mm')}
          </span>
          {renderSaveIndicator()}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTogglePin}
            className={`h-7 w-7 ${editedNote.pinned ? "text-amber-500" : ""}`}
          >
            <Pin className={`w-3.5 h-3.5 ${editedNote.pinned ? 'fill-amber-500' : ''}`} />
          </Button>

          {onMoveNote && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onMoveNote(editedNote)}
              title="Mover para outra pasta"
            >
              <FolderInput className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* F2 — To-Do button */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleInsertTodo}
            title="Adicionar item To-Do"
            aria-label="Adicionar item To-Do"
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1" />
            To-Do
          </Button>

          {/* F3 — Line move buttons (visible only in Edit Mode) */}
          {isEditMode && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handleMoveLineUp}
                title="Mover linha para cima (Alt+↑)"
                aria-label="Mover linha para cima"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handleMoveLineDown}
                title="Mover linha para baixo (Alt+↓)"
                aria-label="Mover linha para baixo"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          <Button
            variant={isEditMode ? "secondary" : "outline"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? <Eye className="w-3.5 h-3.5 mr-1" /> : <Edit3 className="w-3.5 h-3.5 mr-1" />}
            {isEditMode ? 'Visualizar' : 'Editar'}
          </Button>

          {/* Close button — standalone mode only */}
          {mode === 'standalone' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
              aria-label="Fechar editor"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          <Input
            value={editedNote.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="text-2xl font-bold border-0 px-0 focus-visible:ring-0"
            placeholder="Título da nota..."
          />

          {/* Tags */}
          <div className="pt-2">
            <TagManager
              tags={editedNote.tags || []}
              onChange={(newTags) => handleChange('tags', newTags)}
              allTags={allTags}
              suggestedTags={suggestedTags}
            />
          </div>

          {editedNote.type === 'url' && editedNote.url && (
            <a
              href={editedNote.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-4 h-4" />
              {editedNote.url}
            </a>
          )}

          {editedNote.type === 'image' && editedNote.url && (
            <div className="rounded-lg overflow-hidden border border-slate-200">
              <img
                src={editedNote.url}
                alt={editedNote.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* ── Content area ── */}
          {isEditMode ? (
            // EDIT MODE (both panel and standalone): plain textarea, no distractions
            <Textarea
              ref={textareaRef}
              value={editedNote.content}
              onChange={(e) => handleChange('content', e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              className="min-h-[300px] md:min-h-[400px] border-0 px-0 text-base leading-relaxed resize-none focus-visible:ring-0 font-mono text-slate-700"
              placeholder="Escreva em Markdown... (- [ ] para criar to-do)"
              autoFocus
            />
          ) : (
            // VIEW MODE: rendered markdown, checkboxes always interactive.
            // Counter reset just before render so each checkbox maps to the correct line.
            <div
              className="min-h-[200px] md:min-h-[400px] prose prose-sm max-w-none cursor-text"
              onClick={mode === 'panel' ? (e) => {
                // Don't enter edit mode when clicking a checkbox — let onChange toggle it.
                if (e.target.tagName?.toLowerCase() === 'input' && e.target.type === 'checkbox') return;
                setIsEditMode(true);
              } : undefined}
              onDoubleClick={mode === 'standalone' ? () => setIsEditMode(true) : undefined}
              title={mode === 'panel' ? 'Clique para editar' : 'Clique duplo para editar'}
            >
              {editedNote.content ? (
                <>
                  {(checkboxCounterRef.current = 0) >= 0 && (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      urlTransform={safeUrlTransform}
                      components={checkboxComponents}
                    >
                      {processedContent}
                    </ReactMarkdown>
                  )}
                </>
              ) : (
                <p className="text-slate-400">
                  {mode === 'panel' ? 'Clique em Editar para começar...' : 'Clique duplo para editar...'}
                </p>
              )}
            </div>
          )}

          {/* URL Preview Card */}
          {previewData && editedNote.url && (
            <div className="mt-4">
              <UrlPreviewCard previewData={previewData} url={editedNote.url} />
            </div>
          )}

          {editedNote.context && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-900 mb-2 flex items-center gap-2">
                💡 Contexto da Internet
              </h4>
              <p className="text-sm text-indigo-700 leading-relaxed">
                {editedNote.context}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer hint - Desktop only */}
      <div className="hidden md:block px-6 py-2 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500">
          ⌘/Ctrl + S para salvar • ESC para fechar{isEditMode ? ' • Alt+↑/↓ para mover linha' : ''}
        </p>
      </div>
    </div>
  );
}
