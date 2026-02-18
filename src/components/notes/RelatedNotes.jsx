import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRelatedNotes } from '@/api/useRelations';

export default function RelatedNotes({ currentNote, allNotes }) {
  const [relatedNotes, setRelatedNotes] = useState([]);
  const { data: relationsResponse = { data: [] } } = useRelatedNotes(currentNote?.id);
  const relations = relationsResponse?.data || [];

  useEffect(() => {
    if (!currentNote || !relations.length) {
      setRelatedNotes([]);
      return;
    }

    // Encontrar relações onde a nota atual é origem ou destino
    const relevantRelations = relations.filter(
      r => r.noteFromId === currentNote.id || r.noteToId === currentNote.id
    );
    
    // Buscar notas relacionadas
    const relatedNoteIds = relevantRelations.map(r => 
      r.noteFromId === currentNote.id ? r.noteToId : r.noteFromId
    );
    
    const related = allNotes.filter(n => relatedNoteIds.includes(n.id));
    setRelatedNotes(related);
  }, [currentNote, relations, allNotes]);

  // Encontrar notas semanticamente relacionadas (mesmo sem relação explícita)
  const findSemanticMatches = () => {
    if (!currentNote || !allNotes.length) return [];
    
    const currentWords = new Set(
      currentNote.content.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );
    
    return allNotes
      .filter(n => n.id !== currentNote.id && !relatedNotes.find(rn => rn.id === n.id))
      .map(note => {
        const noteWords = new Set(
          note.content.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        );
        const intersection = new Set([...currentWords].filter(x => noteWords.has(x)));
        const similarity = intersection.size / Math.max(currentWords.size, noteWords.size);
        
        return { note, similarity };
      })
      .filter(({ similarity }) => similarity > 0.2)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
  };

  const semanticMatches = findSemanticMatches();

  if (!currentNote || (relatedNotes.length === 0 && semanticMatches.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {relatedNotes.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
            <Network className="w-4 h-4 text-indigo-600" />
            <h3 className="font-medium text-sm text-slate-900">Notas Relacionadas</h3>
            <Badge variant="secondary" className="ml-auto">
              {relatedNotes.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <AnimatePresence>
              {relatedNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-2 bg-white rounded-lg border border-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
                >
                  <p className="text-sm font-medium text-slate-900 line-clamp-1">
                    {note.title}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {note.content}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}
      
      {semanticMatches.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <h3 className="font-medium text-sm text-slate-900">Pode ter relação</h3>
          </div>
          
          <div className="space-y-2">
            {semanticMatches.map(({ note, similarity }) => (
              <div
                key={note.id}
                className="p-2 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 line-clamp-1">
                      {note.title}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {note.content}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {Math.round(similarity * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}