'use client';

import { useMemo, useState } from 'react';
import { Plus, Tag, X } from 'lucide-react';

type TagInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
  /** Tags already used on other projects, offered as suggestions. */
  knownTags: string[];
  label: string;
  placeholder: string;
  removeLabel: (tag: string) => string;
};

const MAX_SUGGESTIONS = 8;

// Chips plus a text field. Enter or a comma adds what was typed (or the
// highlighted suggestion); Backspace on an empty field removes the last chip.
export function TagInput({ tags, onChange, knownTags, label, placeholder, removeLabel }: TagInputProps) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const suggestions = useMemo(() => {
    const query = input.trim().toLowerCase();
    const taken = new Set(tags.map((tag) => tag.toLowerCase()));
    return knownTags
      .filter((tag) => !taken.has(tag.toLowerCase()) && tag.toLowerCase().includes(query))
      .slice(0, MAX_SUGGESTIONS);
  }, [input, knownTags, tags]);

  function add(raw: string) {
    const tag = raw.trim();
    if (tag && !tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) onChange([...tags, tag]);
    setInput('');
    setHighlight(-1);
  }

  const showList = open && suggestions.length > 0;

  return (
    <div className="relative">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 transition-colors focus-within:border-foreground/60">
        <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-sm bg-muted py-0.5 pl-2 pr-1 font-mono text-[11px]">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((existing) => existing !== tag))}
              aria-label={removeLabel(tag)}
              className="rounded-sm p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          aria-label={label}
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setOpen(true);
            setHighlight(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            if (input) add(input);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && suggestions.length > 0) {
              event.preventDefault();
              setOpen(true);
              setHighlight((highlight + 1) % suggestions.length);
            } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
              event.preventDefault();
              setHighlight(highlight <= 0 ? suggestions.length - 1 : highlight - 1);
            } else if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              add(showList && highlight >= 0 ? suggestions[highlight] : input);
            } else if (event.key === 'Escape') {
              setOpen(false);
            } else if (event.key === 'Backspace' && !input && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
          placeholder={placeholder}
          className="min-w-28 flex-1 bg-transparent py-0.5 text-sm outline-none focus-visible:outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      {showList && (
        <ul role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-card p-1 shadow-lg">
          {suggestions.map((tag, index) => (
            <li key={tag} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                // mousedown, so the field's blur doesn't close the list first
                onMouseDown={(event) => {
                  event.preventDefault();
                  add(tag);
                }}
                onMouseEnter={() => setHighlight(index)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-mono text-xs ${index === highlight ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              >
                <Plus className="h-3 w-3" />
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
