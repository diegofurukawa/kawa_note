import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TabBar from '../components/layout/TabBar';
import QuickEditor from '../components/notes/QuickEditor';
import NoteCard from '../components/notes/NoteCard';
import NoteEditor from '../components/notes/NoteEditor';
import SearchBar from '../components/notes/SearchBar';
import MoveNoteDialog from '../components/notes/MoveNoteDialog';
import { useNotes } from '@/api/useNotes';
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence } from "framer-motion";
import { Brain, Sparkles, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { useFolders } from '@/api/useFolders';
import { Button } from "@/components/ui/button";
import { needsMigration, migrateAllNotes, getMigrationStatusMessage } from '@/lib/noteMigration';
import { isKeyAvailable } from '@/lib/keyManager';
import { NO_FOLDER_SENTINEL } from '@/lib/constants';
import { useSidebarState } from '@/hooks/useSidebarState';
import { toast } from 'sonner';

/** @typedef {import('@/types/models').Note} Note */
/** @typedef {import('@/types/models').Folder} Folder */

/**
 * Home page component - displays notes with filtering, search, and editing capabilities
 * @returns {JSX.Element}
 */
export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    text: true,
    url: true,
    image: true,
    word: true,
    pinnedOnly: false
  });
  const [selectedFolder, setSelectedFolder] = useState(/** @type {Folder | null} */ (null));
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [searchScope, setSearchScope] = useState(/** @type {'folder' | 'global'} */ ('global'));
  const [noteToMove, setNoteToMove] = useState(/** @type {Note | null} */ (null));
  const [migrationStatus, setMigrationStatus] = useState(/** @type {'idle' | 'running' | 'completed' | 'error'} */ ('idle'));
  const [migrationProgress, setMigrationProgress] = useState({ current: 0, total: 0 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useSidebarState();
  const encryptionToastShown = useRef(false);

  const { data: notesResponse = { data: [] }, isLoading, refetch } = useNotes();
  const notes = notesResponse?.data || [];

  // Auto-migration on mount
  useEffect(() => {
    async function checkAndMigrate() {
      if (notes.length === 0 || migrationStatus !== 'idle') return;
      
      const keyAvailable = await isKeyAvailable();
      if (!keyAvailable) return;
      
      if (needsMigration(notes)) {
        setMigrationStatus('running');
        
        try {
          const result = await migrateAllNotes(notes, (current, total) => {
            setMigrationProgress({ current, total });
          });
          
          console.log('Migration completed:', result);
          if (result.errors.length > 0) {
            console.error('Migration errors:', result.errors);
          }
          
          setMigrationStatus('completed');
          
          // Refetch notes to get updated data
          await refetch();
          
          // Show encryption toast after migration completes
          if (!encryptionToastShown.current) {
            encryptionToastShown.current = true;
            toast.success('🔒 Suas notas são encriptadas end-to-end. Apenas você pode lê-las.', {
              duration: 5000
            });
          }
          
          // Show status message
          const message = getMigrationStatusMessage(result);
          console.log(message);
        } catch (error) {
          console.error('Migration failed:', error);
          setMigrationStatus('error');
        }
      } else if (notes.length > 0 && !encryptionToastShown.current) {
        // No migration needed, but show encryption toast once
        encryptionToastShown.current = true;
        toast.success('🔒 Suas notas são encriptadas end-to-end. Apenas você pode lê-las.', {
          duration: 5000
        });
      }
    }
    
    checkAndMigrate();
  }, [notes.length, migrationStatus, refetch]);

  // Folders para navegação < >
  const { data: foldersResponse = { data: [] } } = useFolders();
  const folders = foldersResponse?.data || [];
  const rootFolders = folders.filter((/** @type {Folder} */ f) => !f.parentFolderId);

  // Lista navegável: [null (Todas), NO_FOLDER_SENTINEL (Sem Pasta), ...pastas ordenadas]
  const navList = [null, NO_FOLDER_SENTINEL, ...rootFolders.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name))];
  const currentNavIndex = navList.findIndex(item =>
    item === null ? selectedFolder === null : (item?.virtual ? selectedFolder?.virtual : item?.id === selectedFolder?.id)
  );

  const navigatePrev = () => {
    const prevIndex = currentNavIndex <= 0 ? navList.length - 1 : currentNavIndex - 1;
    setSelectedFolder(navList[prevIndex]);
  };

  const navigateNext = () => {
    const nextIndex = currentNavIndex >= navList.length - 1 ? 0 : currentNavIndex + 1;
    setSelectedFolder(navList[nextIndex]);
  };

  // Populate tabs with filtered notes when folder changes or notes load
  useEffect(() => {
    // Recalculate filtered notes for tabs
    const isGlobalSearch = searchScope === 'global' && searchTerm;
    const tabNotes = notes.filter((note) => {
      // Filtro de pasta (ignorado em pesquisa global com termo ativo)
      if (!isGlobalSearch) {
        if (selectedFolder) {
          if (selectedFolder.virtual) {
            // "Sem Pasta" mode: only notes without a folderId
            if (note.folderId) return false;
          } else {
            // Normal folder: only notes in this specific folder
            if (note.folderId !== selectedFolder.id) return false;
          }
        } else {
          // "Todas as Notas": no folder filtering
        }
      }

      // Filtro de tipo
      if (!filters[note.type]) return false;

      // Filtro de fixada
      if (filters.pinnedOnly && !note.pinned) return false;

      // Busca textual
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          note.title?.toLowerCase().includes(search) ||
          note.content?.toLowerCase().includes(search) ||
          note.tags?.some(tag => tag.toLowerCase().includes(search)) ||
          note.context?.toLowerCase().includes(search)
        );
      }

      return true;
    });

    if (tabNotes.length === 0) {
      setOpenTabs([]);
      setActiveTab(null);
      return;
    }

    // Create tabs for all filtered notes
    const noteTabs = tabNotes.map(note => ({
      id: note.id,
      title: note.title || 'Sem título',
      type: 'note',
      note
    }));

    setOpenTabs(noteTabs);
    
    // Set first note as active if no active tab or active tab is not in the new list
    if (!activeTab || !noteTabs.find(t => t.id === activeTab.id)) {
      setActiveTab(noteTabs[0]);
    }
  }, [selectedFolder, notes, filters, searchTerm, searchScope]);

  // Abrir nota em tab (single-click) - just activate existing tab
  const openNoteInTab = (/** @type {Note} */ note) => {
    const existingTab = openTabs.find(t => t.id === note.id && t.type === 'note');
    if (existingTab) {
      setActiveTab(existingTab);
    }
  };

  // Nova aba com QuickEditor
  const openNewTab = () => {
    const quickEditorTab = {
      id: `quick-${Date.now()}`,
      title: 'Nova nota',
      type: 'quickEditor'
    };
    setOpenTabs(prev => [...prev, quickEditorTab]);
    setActiveTab(quickEditorTab);
  };

  // Fechar aba (apenas QuickEditor tabs podem ser fechadas)
  const closeTab = (/** @type {string} */ tabId) => {
    const tabToClose = openTabs.find(t => t.id === tabId);
    
    // Não permitir fechar tabs de notas (apenas QuickEditor)
    if (tabToClose?.type === 'note') {
      return;
    }

    setOpenTabs(prev => {
      const currentIndex = prev.findIndex(t => t.id === tabId);
      const newTabs = prev.filter(t => t.id !== tabId);
      
      if (activeTab?.id === tabId) {
        if (newTabs.length > 0) {
          // Ativar aba anterior ou próxima
          const newActiveIndex = currentIndex > 0 ? currentIndex - 1 : 0;
          setActiveTab(newTabs[newActiveIndex]);
        } else {
          setActiveTab(null);
        }
      }
      return newTabs;
    });
  };

  // Navegar entre abas
  const navigateTabPrev = () => {
    if (openTabs.length === 0) return;
    const currentIndex = openTabs.findIndex(t => t.id === activeTab?.id);
    const prevIndex = currentIndex <= 0 ? openTabs.length - 1 : currentIndex - 1;
    setActiveTab(openTabs[prevIndex]);
  };

  const navigateTabNext = () => {
    if (openTabs.length === 0) return;
    const currentIndex = openTabs.findIndex(t => t.id === activeTab?.id);
    const nextIndex = currentIndex >= openTabs.length - 1 ? 0 : currentIndex + 1;
    setActiveTab(openTabs[nextIndex]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Tab / Ctrl+Shift+Tab - Navigate tabs
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          navigateTabPrev();
        } else {
          navigateTabNext();
        }
      }
      // Ctrl+N - New tab
      if (e.ctrlKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        openNewTab();
      }
      // Ctrl+W - Close active tab
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        if (activeTab) {
          closeTab(activeTab.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, openTabs]);

  // Callback quando nota é criada no QuickEditor
  const handleNoteSaved = async (newNote) => {
    await refetch();
    
    // Substituir aba quickEditor pela nova nota
    if (activeTab?.type === 'quickEditor') {
      // Aguardar refetch completar e pegar a nota atualizada
      setTimeout(() => {
        const createdNote = notes.find(n => n.id === newNote?.id);
        if (createdNote) {
          const newTab = {
            id: createdNote.id,
            title: createdNote.title || 'Sem título',
            type: 'note',
            note: createdNote
          };
          setOpenTabs(prev => prev.map(t => t.id === activeTab.id ? newTab : t));
          setActiveTab(newTab);
        }
      }, 100);
    }
  };

  // Filtrar notas
  const isGlobalSearch = searchScope === 'global' && searchTerm;
  const filteredNotes = notes.filter((/** @type {Note} */ note) => {
    // Filtro de pasta (ignorado em pesquisa global com termo ativo)
    if (!isGlobalSearch) {
      if (selectedFolder) {
        if (selectedFolder.virtual) {
          // "Sem Pasta" mode: only notes without a folderId
          if (note.folderId) return false;
        } else {
          // Normal folder: only notes in this specific folder
          if (note.folderId !== selectedFolder.id) return false;
        }
      } else {
        // "Todas as Notas": no folder filtering
      }
    }

    // Filtro de tipo
    if (!filters[note.type]) return false;

    // Filtro de fixada
    if (filters.pinnedOnly && !note.pinned) return false;

    // Busca textual
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        note.title?.toLowerCase().includes(search) ||
        note.content?.toLowerCase().includes(search) ||
        note.tags?.some(tag => tag.toLowerCase().includes(search)) ||
        note.context?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Folder-scoped note count (unfiltered by type/pin/search)
  const folderNoteCount = selectedFolder
    ? selectedFolder.virtual
      ? notes.filter(n => !n.folderId).length
      : notes.filter(n => n.folderId === selectedFolder.id).length
    : notes.length;

  // Separar notas fixadas
  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const regularNotes = filteredNotes.filter(n => !n.pinned);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        notesCount={notes.length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Always visible */}
        <div className="border-b border-slate-200 bg-white">
          <div className="px-6 py-6">
            {/* Migration Status Banner */}
            {migrationStatus === 'running' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                <Lock className="w-5 h-5 text-blue-600 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Encriptando suas notas...
                  </p>
                  <p className="text-xs text-blue-700">
                    {migrationProgress.current} de {migrationProgress.total} notas processadas
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {navList.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={navigatePrev}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {isGlobalSearch ? 'Pesquisa em Todas as Notas' : (selectedFolder ? selectedFolder.name : 'Todas as Notas')}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {folderNoteCount} {folderNoteCount === 1 ? 'nota' : 'notas'}
                  </p>
                </div>
                {navList.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={navigateNext}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Sparkles className="w-4 h-4" />
                <span>{notes.length} total</span>
              </div>
            </div>
            
            <SearchBar
              onSearch={setSearchTerm}
              onFilterChange={setFilters}
              onSearchScopeChange={setSearchScope}
              searchScope={searchScope}
            />
          </div>
        </div>

        {/* Tab Bar - Always visible */}
        <TabBar
          tabs={openTabs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onCloseTab={closeTab}
          onNavigatePrev={navigateTabPrev}
          onNavigateNext={navigateTabNext}
          onNewTab={openNewTab}
        />

        {/* Content Region - Changes based on activeTab */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab ? (
            activeTab.type === 'quickEditor' ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto">
                  <QuickEditor 
                    onNoteSaved={handleNoteSaved} 
                    folderId={selectedFolder?.id || null}
                  />
                </div>
              </div>
            ) : (
              <NoteEditor
                note={activeTab.note}
                onSave={refetch}
                onClose={() => closeTab(activeTab.id)}
                allNotes={notes}
                onMoveNote={setNoteToMove}
              />
            )
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-6">
                <QuickEditor onNoteSaved={refetch} folderId={selectedFolder?.id || null} />
        
        {isLoading ? (
          <div className="space-y-4 mt-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
              <Brain className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? 'Nenhuma nota encontrada' : 'Comece a capturar ideias'}
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {searchTerm 
                ? 'Tente buscar por outros termos ou ajuste os filtros'
                : 'Adicione sua primeira nota, link ou imagem acima'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Notas Fixadas */}
            {pinnedNotes.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">
                  Fixadas
                </h2>
                <div className="grid gap-4">
                  <AnimatePresence>
                    {pinnedNotes.map(note => (
                      <div
                        key={note.id}
                        onClick={() => openNoteInTab(note)}
                        className="cursor-pointer"
                      >
                        <NoteCard
                          note={note}
                          onDelete={() => refetch()}
                          onUpdate={() => refetch()}
                          showFolderBadge={isGlobalSearch}
                          onMoveNote={setNoteToMove}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
            
            {/* Notas Regulares */}
            {regularNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <h2 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">
                    Todas as notas
                  </h2>
                )}
                <div className="grid gap-4">
                  <AnimatePresence>
                    {regularNotes.map(note => (
                      <div
                        key={note.id}
                        onClick={() => openNoteInTab(note)}
                        className="cursor-pointer"
                      >
                        <NoteCard
                          note={note}
                          onDelete={() => refetch()}
                          onUpdate={() => refetch()}
                          showFolderBadge={isGlobalSearch}
                          onMoveNote={setNoteToMove}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog para mover notas entre pastas */}
      <MoveNoteDialog
        note={noteToMove}
        open={noteToMove !== null}
        onOpenChange={(open) => { if (!open) setNoteToMove(null); }}
        onMoved={refetch}
      />
    </div>
  );
}
