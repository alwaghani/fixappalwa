"use client";

import { ChevronsUpDown, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SearchSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  required?: boolean;
}

export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  className = "",
  required,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = useCallback(
    (option: string) => {
      onChange(option);
      setOpen(false);
      setSearch("");
    },
    [onChange],
  );

  // Scroll highlight into view
  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      if (item) item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setSearch("");
        setHighlightIndex(0);
        break;
    }
  };

  // Scroll highlight into view
  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      if (item) item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input type="hidden" name="tipe" value={value} required={required} />
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="tipe-listbox"
        tabIndex={0}
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 10);
        }}
        onKeyDown={handleKeyDown}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground/60"}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border/60 bg-card shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-border/30 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div
            ref={listRef}
            role="listbox"
            id="tipe-listbox"
            className="max-h-48 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground/50">
                Tidak ditemukan
              </div>
            ) : (
              filtered.map((option, index) => (
                <div
                  key={option}
                  role="option"
                  aria-selected={option === value}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightIndex(index)}
                  className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                    index === highlightIndex
                      ? "bg-primary/10 text-primary"
                      : option === value
                      ? "bg-muted/30 text-foreground font-medium"
                      : "text-foreground hover:bg-muted/20"
                  }`}
                >
                  {option}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
