import NoteEditor from './NoteEditor';

/** @typedef {import('@/types/models').Note} Note */

/**
 * NoteDetailPanel — the right pane in the V2 two-panel desktop layout.
 *
 * Wraps NoteEditor in panel mode, filling the available height.
 *
 * @param {Object} props
 * @param {Note} props.note - The note being displayed/edited
 * @param {Function} props.onUpdate - Called after a successful save (triggers refetch)
 * @param {Function} props.onDelete - Called with (noteId) after deletion
 * @param {Function} props.onMoveNote - Called with (note) to open MoveNoteDialog
 * @returns {JSX.Element}
 */
export default function NoteDetailPanel({ note, onUpdate, onDelete, onMoveNote }) {
  return (
    <div className="flex flex-col h-full bg-white min-w-0">
      <div className="flex-1 overflow-hidden">
        <NoteEditor
          key={note.id}
          note={note}
          mode="panel"
          onSave={onUpdate}
          onClose={() => {}}
          onMoveNote={onMoveNote}
        />
      </div>
    </div>
  );
}
