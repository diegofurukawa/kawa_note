import { FileText, FolderOpen, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * BottomNav - Navegação inferior para mobile
 * Padrão nativo mobile com 4 itens principais
 * 
 * @param {Object} props - Props do componente
 * @param {string} props.activeTab - Tab ativo ('notes' | 'folders' | 'search' | 'profile')
 * @param {Function} props.onTabChange - Callback ao mudar de tab
 * @returns {JSX.Element} Bottom navigation bar
 */
export default function BottomNav({ activeTab = 'notes', onTabChange = () => {} }) {
  const tabs = [
    { id: 'notes', label: 'Notas', icon: FileText },
    { id: 'folders', label: 'Pastas', icon: FolderOpen },
    { id: 'search', label: 'Busca', icon: Search },
    { id: 'profile', label: 'Perfil', icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around md:hidden safe-area-inset-b">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center h-full flex-1 transition-colors",
              isActive 
                ? "text-blue-600" 
                : "text-slate-500 hover:text-slate-700"
            )}
            aria-label={tab.label}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
