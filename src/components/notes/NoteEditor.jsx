import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, X, Pin, Loader2, ExternalLink, FolderInput, Edit3, Eye } from "lucide-react";
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

export default function NoteEditor({ note, onSave, onClose, allNotes = [], onMoveNote }) {
  const [editedNote, setEditedNote] = useState(note);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const updateNoteMutation = useUpdateNote();
  const hasChangesRef = useRef(false);

  useEffect(() => {
    setEditedNote(note);
    setHasChanges(false);
    hasChangesRef.current = false;
    setError(null);
    setIsEditMode(false);
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

  const handleSave = useCallback(async () => {
    if (!hasChangesRef.current) return;
    
    try {
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
      setHasChanges(false);
      hasChangesRef.current = false;
      toast.success('Nota salva com sucesso');
      setIsEditMode(false);
      if (onSave) onSave();
    } catch (err) {
      // Check if it's an encryption error and handle logout
      if (checkAndHandleEncryptionError(err)) {
        return;
      }
      
      const errorMessage = err?.data?.error?.message || err?.message || 'Erro ao salvar nota';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [editedNote, note.id, updateNoteMutation, onSave]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onClose]);

  const handleChange = (field, value) => {
    setEditedNote(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    hasChangesRef.current = true;
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Badge className={`${typeColors[editedNote.type]} border-0`}>
            {editedNote.type}
          </Badge>
          <span className="text-xs text-slate-400">
            {format(new Date(editedNote.createdAt), 'dd/MM/yyyy HH:mm')}
          </span>
          {hasChanges && (
            <span className="text-xs text-amber-600 font-medium">• Não salvo</span>
          )}
          {error && (
            <span className="text-xs text-red-600 font-medium">• Erro: {error}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTogglePin}
            className={editedNote.pinned ? "text-amber-500" : ""}
          >
            <Pin className={`w-4 h-4 ${editedNote.pinned ? 'fill-amber-500' : ''}`} />
          </Button>
          
          {onMoveNote && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveNote(editedNote)}
              title="Mover para outra pasta"
            >
              <FolderInput className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant={isEditMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? <Eye className="w-4 h-4 mr-1" /> : <Edit3 className="w-4 h-4 mr-1" />}
            {isEditMode ? 'Visualizar' : 'Editar'}
          </Button>
          
          {hasChanges && (
            <Button
              onClick={handleSave}
              disabled={updateNoteMutation.isPending}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {updateNoteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
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
