import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Pin, Loader2, ExternalLink, FolderInput, Edit3, Eye, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeUrlTransform } from '@/lib/constants';
import { format } from "date-fns";
import { toast } from 'sonner';
import { useUpdateNote } from '@/api/useNotes';
import TagManager from './TagManager';
import UrlPreviewCard from './UrlPreviewCard';
import { checkAndHandleEncryptionError } from '@/lib/errorHandlers';

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
 * @param {Function} props.onClose - Callback para fechar editor
 * @param {Array} props.allNotes - Todas as notas (para autocomplete de tags)
 * @param {Function} props.onMoveNote - Callback para mover nota
 * @returns {JSX.Element} Editor de notas com visualização e edição
 */
export default function NoteEditor({ note, onSave, onClose, allNotes = [], onMoveNote }) {
  const [editedNote, setEditedNote] = useState(note);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const updateNoteMutation = useUpdateNote();
  const debounceTimerRef = useRef(null);
  const saveToastShownRef = useRef(false);

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

    try {
      setSaveStatus('saving');
      setIsSaving(true);
      setError(null);

      await updateNoteMutation.mutateAsync({
        id: note.id,
        data: {
          title: editedNote.title,
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

          <Button
            variant={isEditMode ? "secondary" : "outline"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? <Eye className="w-3.5 h-3.5 mr-1" /> : <Edit3 className="w-3.5 h-3.5 mr-1" />}
            {isEditMode ? 'Visualizar' : 'Editar'}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
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

          {isEditMode ? (
            <Textarea
              value={editedNote.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className="min-h-[400px] border-0 px-0 text-base leading-relaxed resize-none focus-visible:ring-0"
              placeholder="Comece a escrever em Markdown..."
              autoFocus
            />
          ) : (
            <div
              className="min-h-[400px] prose prose-sm max-w-none cursor-text"
              onDoubleClick={() => setIsEditMode(true)}
              title="Clique duplo para editar"
            >
              {editedNote.content
                ? <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={safeUrlTransform}>{editedNote.content}</ReactMarkdown>
                : <p className="text-slate-400">Comece a escrever...</p>
              }
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

      {/* Footer hint */}
      <div className="px-6 py-2 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500">
          ⌘/Ctrl + S para salvar • ESC para fechar
        </p>
      </div>
    </div>
  );
}
