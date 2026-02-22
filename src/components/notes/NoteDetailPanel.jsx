import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Pin,
  FolderInput,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NoteEditor from './NoteEditor';
import { useUpdateNote, useDeleteNote } from '@/api/useNotes';
import { toast } from 'sonner';
import { checkAndHandleEncryptionError } from '@/lib/errorHandlers';

/** @typedef {import('@/types/models').Note} Note */

/**
 * NoteDetailPanel — the right pane in the V2 two-panel desktop layout.
 *
 * Wraps NoteEditor in panel mode with a top header that exposes:
 * - Save status dot indicator (amber = dirty, green = saved)
 * - Overflow menu (⋮): Pin / Move to folder / Delete
 *
 * The header is minimal; heavy editing controls remain inside NoteEditor.
 *
 * @param {Object} props
 * @param {Note} props.note - The note being displayed/edited
 * @param {Function} props.onUpdate - Called after a successful save (triggers refetch)
 * @param {Function} props.onDelete - Called with (noteId) after deletion
 * @param {Function} props.onMoveNote - Called with (note) to open MoveNoteDialog
 * @param {string} [props.saveStatus] - Save status forwarded from NoteEditor: 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
 * @returns {JSX.Element}
 */
export default function NoteDetailPanel({ note, onUpdate, onDelete, onMoveNote }) {
  const [saveStatus, setSaveStatus] = useState('idle');
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

  const handleTogglePin = async () => {
    try {
      await updateNoteMutation.mutateAsync({
        id: note.id,
        data: { pinned: !note.pinned }
      });
      toast.success(note.pinned ? 'Nota desafixada' : 'Nota fixada');
      if (onUpdate) onUpdate();
    } catch (err) {
      if (checkAndHandleEncryptionError(err)) return;
      toast.error(err?.data?.error?.message || err?.message || 'Erro ao atualizar nota');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNoteMutation.mutateAsync(note.id);
      toast.success('Nota deletada');
      if (onDelete) onDelete(note.id);
    } catch (err) {
      if (checkAndHandleEncryptionError(err)) return;
      toast.error(err?.data?.error?.message || err?.message || 'Erro ao deletar nota');
    }
  };

  /** Render the save status dot in the header */
  const renderStatusDot = () => {
    switch (saveStatus) {
      case 'dirty':
        return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Alterações não salvas" aria-label="Alterações não salvas" />;
      case 'saving':
        return <Loader2 className="w-3 h-3 text-blue-500 animate-spin shrink-0" aria-label="Salvando..." />;
      case 'saved':
        return <Check className="w-3 h-3 text-green-500 shrink-0" aria-label="Salvo" />;
      case 'error':
        return <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Erro ao salvar" aria-label="Erro ao salvar" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white min-w-0">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 shrink-0 bg-white">
        {/* Left: type indicator + save status dot */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {note.type}
          </span>
          {renderStatusDot()}
        </div>

        {/* Right: overflow menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Mais ações"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={handleTogglePin}
              disabled={updateNoteMutation.isPending}
            >
              <Pin className={`w-4 h-4 mr-2 ${note.pinned ? 'fill-amber-500 text-amber-500' : ''}`} />
              {note.pinned ? 'Desafixar' : 'Fixar'}
            </DropdownMenuItem>

            {onMoveNote && (
              <DropdownMenuItem onClick={() => onMoveNote(note)}>
                <FolderInput className="w-4 h-4 mr-2" />
                Mover para...
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleDelete}
              disabled={deleteNoteMutation.isPending}
              className="text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteNoteMutation.isPending ? 'Deletando...' : 'Deletar'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* NoteEditor in panel mode — fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <NoteEditor
          key={note.id}
          note={note}
          mode="panel"
          onSave={onUpdate}
          onClose={() => {}}
          onMoveNote={onMoveNote}
          onSaveStatusChange={setSaveStatus}
        />
      </div>
    </div>
  );
}
