import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Link as LinkIcon, Image as ImageIcon, Type, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'sonner';
import { useCreateNote } from '@/api/useNotes';
import { checkAndHandleEncryptionError } from '@/lib/errorHandlers';

export default function QuickEditor({ onNoteSaved, folderId = null, fullHeight = false }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  // Auto-expand when rendered in full-height panel mode
  const [isExpanded, setIsExpanded] = useState(fullHeight);
  const [error, setError] = useState(null);
  const createNoteMutation = useCreateNote();

  const detectType = (text) => {
    const urlRegex = /^https?:\/\/.+/i;
    const imageRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
    
    if (urlRegex.test(text.trim())) {
      if (imageRegex.test(text.trim())) {
        return 'image';
      }
      return 'url';
    }
    if (text.trim().split(/\s+/).length === 1 && text.trim().length < 30) {
      return 'word';
    }
    return 'text';
  };

  const extractTitle = (text, detectedType) => {
    if (detectedType === 'word') return text.trim();
    if (detectedType === 'url' || detectedType === 'image') return text.trim();
    
    const firstLine = text.split('\n')[0];
    return firstLine.substring(0, 100) || 'Nova nota';
  };

  const extractMetadata = (noteContent, noteType) => {
    if (noteType !== 'url' && noteType !== 'image') return '';

    try {
      const url = new URL(noteContent.trim());
      const today = new Date().toLocaleDateString('pt-BR');
      return `Fonte: ${url.hostname} · Capturado em ${today}`;
    } catch {
      return '';
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    
    try {
      setError(null);
      const detectedType = detectType(content);
      const title = extractTitle(content, detectedType);
      
      // Extrair contexto da URL
      const context = extractMetadata(content.trim(), detectedType);
      
      const noteData = {
        title,
        content: content.trim(),
        type: detectedType,
        context: context,
        tags: [],
        pinned: false,
        ...(folderId && { folderId })
      };

      if (detectedType === 'url' || detectedType === 'image') {
        noteData.url = content.trim();
      }

      const result = await createNoteMutation.mutateAsync(noteData);
      
      setContent('');
      if (!fullHeight) setIsExpanded(false);
      toast.success('Nota criada com sucesso');
      if (onNoteSaved) onNoteSaved(result?.data || result);
    } catch (err) {
      // Check if it's an encryption error and handle logout
      if (checkAndHandleEncryptionError(err)) {
        return;
      }
      
      const errorMessage = err?.data?.error?.message || err?.message || 'Erro ao salvar nota';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  return (
    <motion.div
      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
      initial={false}
      animate={{ height: (isExpanded || fullHeight) ? 'auto' : '56px' }}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva, cole um link, ou adicione uma ideia..."
            className="min-h-[32px] resize-none border-0 focus-visible:ring-0 text-base placeholder:text-slate-400 leading-relaxed"
            style={{ minHeight: isExpanded && fullHeight ? '420px' : undefined }}
            rows={isExpanded ? (fullHeight ? 18 : 5) : 1}
          />
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100"
            >
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-slate-500 hover:text-slate-700"
                  onClick={() => setType('text')}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-slate-500 hover:text-slate-700"
                  onClick={() => setType('url')}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-slate-500 hover:text-slate-700"
                  onClick={() => setType('image')}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContent('');
                    setIsExpanded(false);
                  }}
                  disabled={createNoteMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!content.trim() || createNoteMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {createNoteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-3 text-xs text-slate-400">
          {error ? (
            <span className="text-red-600">Erro: {error}</span>
          ) : (
            <>⌘/Ctrl + Enter para salvar rapidamente</>
          )}
        </div>
      )}
    </motion.div>
  );
}