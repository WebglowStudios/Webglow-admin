'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Tag, Plus, Check, X, ChevronDown, Trash2, PhoneOff } from 'lucide-react';
import { CardTag } from '../types/kanban';
import { DEFAULT_TAG_OPTIONS } from '../lib/mockData';

interface TagDropdownSelectorProps {
  selectedTags: CardTag[];
  onToggleTag: (tag: CardTag) => void;
}

const STORAGE_KEY_TAG_OPTIONS = 'webglow_saved_tag_options_v1';

const PRESET_COLORS = [
  { label: 'Sky', class: 'bg-sky-500/20 text-sky-300 border-sky-500/40', dot: '#0ea5e9' },
  { label: 'Emerald', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: '#10b981' },
  { label: 'Amber', class: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: '#f59e0b' },
  { label: 'Rose', class: 'bg-rose-500/20 text-rose-300 border-rose-500/40', dot: '#f43f5e' },
  { label: 'Purple', class: 'bg-purple-500/20 text-purple-300 border-purple-500/40', dot: '#a855f7' },
  { label: 'Teal', class: 'bg-teal-500/20 text-teal-300 border-teal-500/40', dot: '#14b8a6' },
  { label: 'Slate', class: 'bg-neutral-600/20 text-neutral-300 border-neutral-500/40', dot: '#94a3b8' },
];

export const TagDropdownSelector: React.FC<TagDropdownSelectorProps> = ({
  selectedTags,
  onToggleTag,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Load tag options from localStorage and merge with DEFAULT_TAG_OPTIONS
  const [availableOptions, setAvailableOptions] = useState<CardTag[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_TAG_OPTIONS);
      if (saved) {
        try {
          const parsed: CardTag[] = JSON.parse(saved);
          const customOnly = parsed.filter((p) => p.id.startsWith('custom-tag-'));
          return [...DEFAULT_TAG_OPTIONS, ...customOnly];
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_TAG_OPTIONS;
  });

  // Save options to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TAG_OPTIONS, JSON.stringify(availableOptions));
    }
  }, [availableOptions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const filteredOptions = availableOptions.filter((opt) =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const exactMatch = availableOptions.some(
    (opt) => opt.name.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const handleCreateCustomTag = () => {
    const name = searchQuery.trim();
    if (!name) return;

    const newTag: CardTag = {
      id: `custom-tag-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name,
      color: selectedColor.class,
    };

    setAvailableOptions((prev) => [newTag, ...prev]);
    onToggleTag(newTag);
    setSearchQuery('');
  };

  // Smart DNP Tag Click: when choosing a DNP status, swap out any other active DNP tag
  const handleTagClick = (option: CardTag) => {
    if (option.id.startsWith('tag-dnp-')) {
      if (selectedTags.some((t) => t.id === option.id)) {
        onToggleTag(option);
      } else {
        selectedTags
          .filter((t) => t.id.startsWith('tag-dnp-'))
          .forEach((oldDnp) => onToggleTag(oldDnp));
        onToggleTag(option);
      }
    } else {
      onToggleTag(option);
    }
  };

  const handleDeleteOption = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAvailableOptions((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-sky-400" />
          <span>Tags & Contact Status (DNP)</span>
        </label>
      </div>

      {/* Currently Attached Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${tag.color} shadow-xs`}
          >
            <span>{tag.name}</span>
            <button
              type="button"
              onClick={() => onToggleTag(tag)}
              className="hover:opacity-80 p-0.5 rounded transition-opacity"
              title="Remove tag"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Dropdown Toggle Button */}
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#22272b] hover:bg-[#282e33] border border-[#384148] text-neutral-300 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Select or Create Tag</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-76 rounded-xl bg-[#1d2125] border border-[#384148] shadow-2xl p-2.5 z-50 text-xs text-neutral-200 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Quick DNP (Did Not Pick) Stepper Strip */}
              <div className="mb-2 p-2 rounded-lg bg-[#161a1d] border border-[#282e33]">
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1.5 font-medium">
                  <span className="flex items-center gap-1 text-neutral-300">
                    <PhoneOff className="w-3 h-3 text-amber-400" />
                    <span>Call Status (DNP):</span>
                  </span>
                  <span className="text-[9px] text-red-400 font-semibold">DNP 6 = Delete Lead</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((num) => {
                    const dnpId = `tag-dnp-${num}`;
                    const isSelected = selectedTags.some((t) => t.id === dnpId);
                    const isDnp6 = num === 6;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          const opt = availableOptions.find((o) => o.id === dnpId);
                          if (opt) handleTagClick(opt);
                        }}
                        className={`py-1 text-center rounded text-[10px] font-bold transition-all border ${
                          isSelected
                            ? isDnp6
                              ? 'bg-red-600 text-white border-red-400 ring-1 ring-red-400 shadow-sm'
                              : 'bg-amber-500 text-white border-amber-300 ring-1 ring-amber-300 shadow-sm'
                            : isDnp6
                            ? 'bg-red-950/40 text-red-300 border-red-900/60 hover:bg-red-900/60'
                            : 'bg-[#22272b] text-neutral-300 border-[#384148] hover:bg-[#282e33] hover:text-white'
                        }`}
                        title={
                          isDnp6
                            ? 'DNP 6: Lead exhausted after 6 calls (delete eligible)'
                            : `DNP ${num}: Call attempt ${num} unanswered`
                        }
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search & Custom Input */}
              <div className="relative mb-2">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!exactMatch && searchQuery.trim()) {
                        handleCreateCustomTag();
                      }
                    }
                  }}
                  placeholder="Search tags or type custom text..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#22272b] border border-[#384148] text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400 text-xs"
                />
              </div>

              {/* Color Selector for Custom Tag */}
              {searchQuery.trim() && !exactMatch && (
                <div className="mb-2.5 p-2 rounded-lg bg-[#161a1d] border border-[#282e33]">
                  <div className="flex items-center justify-between mb-1.5 text-[10px] text-neutral-400">
                    <span>Pick tag color:</span>
                    <span className="font-semibold text-neutral-300">{selectedColor.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        style={{ backgroundColor: c.dot }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform ${
                          selectedColor.label === c.label
                            ? 'scale-125 ring-2 ring-white shadow-md'
                            : 'hover:scale-110'
                        }`}
                      >
                        {selectedColor.label === c.label && (
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateCustomTag}
                    className="w-full mt-2 py-1 px-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add custom &quot;{searchQuery.trim()}&quot;</span>
                  </button>
                </div>
              )}

              {/* List of Available Options */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredOptions.length === 0 && !searchQuery.trim() && (
                  <div className="text-center py-3 text-neutral-500 text-[11px]">
                    No options found
                  </div>
                )}

                {filteredOptions.map((option) => {
                  const isAttached = selectedTags.some((t) => t.id === option.id);
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleTagClick(option)}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        isAttached
                          ? 'bg-sky-950/40 border border-sky-400/40 text-white'
                          : 'hover:bg-[#282e33] text-neutral-300'
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${option.color}`}>
                        {option.name}
                      </span>

                      <div className="flex items-center gap-1">
                        {isAttached && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        {/* Option delete button for custom tags */}
                        {option.id.startsWith('custom-tag-') && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteOption(option.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-rose-400 transition-opacity"
                            title="Delete option from dropdown"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
