import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Brain,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  FileX
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { NO_FOLDER_SENTINEL } from "@/lib/constants";
import { useFolders, useFolderHierarchy, useCreateFolder, useUpdateFolder, useDeleteFolder } from '@/api/useFolders';
import { useNotes } from '@/api/useNotes';
import { checkAndHandleEncryptionError } from '@/lib/errorHandlers';
import { useAuth } from '@/components/providers/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import ColorPickerPopover from '@/components/folders/ColorPickerPopover';
import IconPickerPopover from '@/components/folders/IconPickerPopover';
import SubFolderCreateDialog from '@/components/folders/SubFolderCreateDialog';
import { getFolderIcon } from '@/lib/folderIconHelper';

/** @typedef {import('@/types/models').Folder} Folder */
/** @typedef {import('@/types/models').Note} Note */

const colorClasses = {
  slate: "text-slate-600 hover:bg-slate-100",
  blue: "text-blue-600 hover:bg-blue-50",
  purple: "text-purple-600 hover:bg-purple-50",
  green: "text-green-600 hover:bg-green-50",
  amber: "text-amber-600 hover:bg-amber-50",
  red: "text-red-600 hover:bg-red-50",
  pink: "text-pink-600 hover:bg-pink-50"
};

// @ts-ignore
function FolderItem({ folder, notes, selectedFolder, onSelect, level = 0, subfolders = /** @type {any[]} */ ([]), isCollapsed = false, allFolders = [] }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState(false);
  const updateFolderMutation = useUpdateFolder();
  const deleteFolderMutation = useDeleteFolder();

  const handleUpdate = async () => {
    if (editName.trim()) {
      await updateFolderMutation.mutateAsync({
        id: folder.id,
        data: { name: editName.trim() }
      });
      setIsEditing(false);
    } else {
      setIsEditing(false);
    }
  };

  const handleColorChange = async (newColor) => {
    try {
      await updateFolderMutation.mutateAsync({
        id: folder.id,
        data: { color: newColor }
      });
      toast.success('Cor atualizada');
    } catch (error) {
      if (checkAndHandleEncryptionError(error)) return;
      toast.error('Erro ao atualizar cor');
    }
  };

  const handleIconChange = async (newIcon) => {
    try {
      await updateFolderMutation.mutateAsync({
        id: folder.id,
        data: { icon: newIcon }
      });
      toast.success('Ícone atualizado');
    } catch (error) {
      if (checkAndHandleEncryptionError(error)) return;
      toast.error('Erro ao atualizar ícone');
    }
  };

  const notesCount = notes.filter((/** @type {Note} */ n) => n.folderId === folder.id).length;
  const FolderIconComponent = getFolderIcon(folder.icon);

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={() => onSelect(folder)}
              className={cn(
                "flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                selectedFolder?.id === folder.id ? "bg-indigo-100 text-indigo-900" : colorClasses[/** @type {keyof typeof colorClasses} */ (folder.color) || 'slate']
              )}
            >
              <FolderIconComponent className="w-5 h-5 shrink-0" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{folder.name} {notesCount > 0 && `(${notesCount})`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm",
          selectedFolder?.id === folder.id ? "bg-indigo-100 text-indigo-900" : colorClasses[/** @type {keyof typeof colorClasses} */ (folder.color) || 'slate']
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {subfolders.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="shrink-0"
          >
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
        
        <FolderIconComponent className="w-4 h-4 shrink-0" />
        
        {isEditing ? (
          // @ts-ignore
          <Input
            // @ts-ignore
            value={editName}
            onChange={(/** @type {{ target: { value: string } }} */ e) => setEditName(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(/** @type {{ key: string; target: { blur: () => void } }} */ e) => {
              if (e.key === 'Enter') e.target.blur();
              if (e.key === 'Escape') {
                setEditName(folder.name);
                setIsEditing(false);
              }
            }}
            className="h-6 text-sm"
            autoFocus
            onClick={(/** @type {{ stopPropagation: () => void }} */ e) => e.stopPropagation()}
          />
        ) : (
          <span
            onClick={() => onSelect(folder)}
            className="flex-1 truncate"
          >
            {folder.name}
          </span>
        )}
        
        {notesCount > 0 && (
          <span className="text-xs text-slate-400 shrink-0">{notesCount}</span>
        )}
        
        {/* @ts-ignore */}
        <DropdownMenu>
          {/* @ts-ignore */}
          <DropdownMenuTrigger asChild onClick={(/** @type {{ stopPropagation: () => void }} */ e) => e.stopPropagation()}>
            {/* @ts-ignore */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          {/* @ts-ignore */}
          <DropdownMenuContent align="end">
            {/* @ts-ignore */}
            <DropdownMenuItem onClick={() => setIsCreatingSubfolder(true)}>
              <Plus className="w-3 h-3 mr-2" />
              Criar SubPasta
            </DropdownMenuItem>
            {/* @ts-ignore */}
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit2 className="w-3 h-3 mr-2" />
              Renomear
            </DropdownMenuItem>
            {/* Separator */}
            <div className="my-1 h-px bg-slate-200" />
            {/* Color Picker */}
            <div className="px-2 py-1.5">
              <ColorPickerPopover 
                currentColor={folder.color || 'slate'} 
                onColorChange={handleColorChange}
              />
            </div>
            {/* Icon Picker */}
            <div className="px-2 py-1.5">
              <IconPickerPopover 
                currentIcon={folder.icon || 'Folder'} 
                onIconChange={handleIconChange}
              />
            </div>
            {/* Separator */}
            <div className="my-1 h-px bg-slate-200" />
            {/* @ts-ignore */}
            <DropdownMenuItem
              onClick={() => deleteFolderMutation.mutateAsync(folder.id)}
              className="text-red-600"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* SubFolder Create Dialog */}
      <SubFolderCreateDialog
        open={isCreatingSubfolder}
        onOpenChange={setIsCreatingSubfolder}
        parentFolderId={folder.id}
        parentFolderName={folder.name}
      />
      
      {isOpen && subfolders.map(subfolder => (
        <FolderItem
          key={subfolder.id}
          folder={subfolder}
          notes={notes}
          selectedFolder={selectedFolder}
          onSelect={onSelect}
          level={level + 1}
          subfolders={allFolders.filter((/** @type {{ parentFolderId: string }} */ f) => f.parentFolderId === subfolder.id)}
          isCollapsed={isCollapsed}
          allFolders={allFolders}
        />
      ))}
    </div>
  );
}

/**
 * Sidebar - Componente de navegação lateral com pastas e usuário
 * @param {Object} props - Props do componente
 * @param {Object} props.selectedFolder - Pasta selecionada atualmente
 * @param {Function} props.onSelectFolder - Callback ao selecionar pasta
 * @param {number} props.notesCount - Quantidade total de notas
 * @param {boolean} props.isCollapsed - Se a sidebar está recolhida
 * @param {Function} props.onToggleCollapse - Callback para alternar colapso
 * @returns {JSX.Element} Sidebar com navegação de pastas
 */
// @ts-ignore
export default function Sidebar({ 
  selectedFolder, 
  onSelectFolder, 
  notesCount, 
  isCollapsed = false, 
  onToggleCollapse
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { data: foldersResponse = { data: [] } } = useFolderHierarchy();

  // hierarchy pode vir como árvore (com children) ou flat — achata para lista flat
  const flattenFolders = (items, result = []) => {
    for (const item of items) {
      result.push(item);
      if (item.children?.length) flattenFolders(item.children, result);
    }
    return result;
  };
  const folders = flattenFolders(foldersResponse?.data || []);
  const { data: notesResponse = { data: [] } } = useNotes();
  const notes = notesResponse?.data || [];
  const createFolderMutation = useCreateFolder();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const rootFolders = folders.filter((/** @type {Folder} */ f) => !f.parentFolderId);
  
  // Handle logout with cache clearing
  const handleLogout = async () => {
    // Clear React Query cache before logout
    queryClient.clear();
    // Call logout from AuthContext
    await logout();
  };
  
  // Generate user initials for avatar
  const getUserInitials = () => {
    if (!user) return '?';
    if (user.name) {
      const names = user.name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };
  
  // Generate avatar color from email/name
  const getAvatarColor = () => {
    const str = user?.email || user?.name || 'default';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-indigo-500',
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-amber-500',
      'bg-red-500',
      'bg-pink-500'
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={cn(
      "h-screen bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-slate-200">
        {isCollapsed ? (
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Kawa Note</h1>
            </div>
          </div>
        )}
      </div>

      {/* @ts-ignore */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1">
          {isCollapsed ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => onSelectFolder(null)}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                      !selectedFolder ? "bg-indigo-100 text-indigo-900" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <Brain className="w-5 h-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Todas as Notas ({notesCount || 0})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div
              onClick={() => onSelectFolder(null)}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors",
                !selectedFolder ? "bg-indigo-100 text-indigo-900" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Brain className="w-4 h-4" />
              <span className="flex-1">Todas as Notas</span>
              <span className="text-xs text-slate-400">{notesCount || 0}</span>
            </div>
          )}

          {!isCollapsed && (
            <div
              onClick={() => onSelectFolder(NO_FOLDER_SENTINEL)}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors",
                selectedFolder?.virtual ? "bg-amber-100 text-amber-900" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <FileX className="w-4 h-4" />
              <span className="flex-1">Sem Pasta</span>
              <span className="text-xs text-slate-400">{notes.filter(n => !n.folderId).length}</span>
            </div>
          )}

          {isCollapsed && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => onSelectFolder(NO_FOLDER_SENTINEL)}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                      selectedFolder?.virtual ? "bg-amber-100 text-amber-900" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <FileX className="w-5 h-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sem Pasta ({notes.filter(n => !n.folderId).length})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {!isCollapsed && (
            <div className="pt-4 pb-2 px-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase">Pastas</span>
              {/* @ts-ignore */}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}

          {isCollapsed && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center p-2">
                    <div className="h-px w-8 bg-slate-300" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Pastas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {!isCollapsed && isCreating && (
            <div className="px-2 py-1">
              {/* @ts-ignore */}
              <Input
                value={newFolderName}
                onChange={(/** @type {{ target: { value: string } }} */ e) => setNewFolderName(e.target.value)}
                onBlur={async () => {
                  if (newFolderName.trim()) {
                    try {
                      await createFolderMutation.mutateAsync({ name: newFolderName.trim(), color: 'slate' });
                      setIsCreating(false);
                      setNewFolderName('');
                      toast.success('Pasta criada com sucesso');
                    } catch (error) {
                      // Check if it's an encryption error and handle logout
                      if (checkAndHandleEncryptionError(error)) {
                        return;
                      }
                      
                      const errorMessage = error?.data?.error?.message || error?.message || 'Erro ao criar pasta';
                      toast.error(errorMessage);
                      setIsCreating(false);
                      setNewFolderName('');
                    }
                  } else {
                    setIsCreating(false);
                  }
                }}
                onKeyDown={(/** @type {{ key: string; target: { blur: () => void } }} */ e) => {
                  if (e.key === 'Enter') e.target.blur();
                  if (e.key === 'Escape') {
                    setNewFolderName('');
                    setIsCreating(false);
                  }
                }}
                placeholder="Nome da pasta..."
                className="h-7 text-sm"
                autoFocus
              />
            </div>
          )}

          {rootFolders.map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              notes={notes}
              selectedFolder={selectedFolder}
              onSelect={onSelectFolder}
              subfolders={folders.filter((/** @type {{ parentFolderId: string }} */ f) => f.parentFolderId === folder.id)}
              isCollapsed={isCollapsed}
              allFolders={folders}
            />
          ))}
        </div>
      </ScrollArea>

      {/* User Area */}
      <div className="p-3 border-t border-slate-200">
        {isCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium", getAvatarColor())}>
                        {getUserInitials()}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="right">
                    {user && (
                      <div className="px-2 py-1.5 text-sm">
                        <p className="font-medium text-slate-900">{user.name || 'Usuário'}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-3 h-3 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{user?.name || user?.email || 'Usuário'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0", getAvatarColor())}>
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 shrink-0 text-slate-400 hover:text-slate-600"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <div className="p-3 border-t border-slate-200">
        {isCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="w-full"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Expandir sidebar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full justify-start text-slate-600"
          >
            <PanelLeftClose className="w-4 h-4 mr-2" />
            Recolher
          </Button>
        )}
      </div>
    </div>
  );
}
