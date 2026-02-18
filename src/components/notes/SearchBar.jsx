import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function SearchBar({ onSearch, onFilterChange, onSearchScopeChange, searchScope = 'folder' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    text: true,
    url: true,
    image: true,
    word: true,
    pinnedOnly: false
  });

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const handleFilterToggle = (key) => {
    const newFilters = { ...filters, [key]: !filters[key] };
    setFilters(newFilters);
    if (onFilterChange) onFilterChange(newFilters);
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  const activeFiltersCount = Object.entries(filters)
    .filter(([key, value]) => key !== 'pinnedOnly' && !value)
    .length;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar notas, contextos, relações..."
          className="pl-10 pr-10 bg-white border-slate-200"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={clearSearch}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "relative",
          searchScope === 'global' && "bg-indigo-100 border-indigo-300 text-indigo-700"
        )}
        onClick={() => {
          const newScope = searchScope === 'folder' ? 'global' : 'folder';
          if (onSearchScopeChange) onSearchScopeChange(newScope);
        }}
        title={searchScope === 'global' ? 'Pesquisando em todas as pastas' : 'Pesquisar em todas as pastas'}
      >
        <Globe className="w-4 h-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <SlidersHorizontal className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-slate-900">Tipos de nota</h4>
            <div className="space-y-2">
              {[
                { key: 'text', label: 'Texto' },
                { key: 'url', label: 'Links' },
                { key: 'image', label: 'Imagens' },
                { key: 'word', label: 'Palavras' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={filters[key]}
                    onCheckedChange={() => handleFilterToggle(key)}
                  />
                  <Label htmlFor={key} className="text-sm cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pinnedOnly"
                  checked={filters.pinnedOnly}
                  onCheckedChange={() => handleFilterToggle('pinnedOnly')}
                />
                <Label htmlFor="pinnedOnly" className="text-sm cursor-pointer">
                  Apenas fixadas
                </Label>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}