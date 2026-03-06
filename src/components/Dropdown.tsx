"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

interface DropdownOption {
  value: number;
  label: string;
}

interface DropdownProps {
  id?: string;
  value: number;
  options: DropdownOption[];
  onChange: (value: number) => void;
}

export default function Dropdown({ id, value, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generatedId = useId();
  const listId = `${id ?? generatedId}-listbox`;
  const buttonId = id ?? generatedId;
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const selectedIndex = options.findIndex((o) => o.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [value, options]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function openMenu() {
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
  }

  function selectIndex(index: number) {
    const next = options[index];
    if (!next) return;
    onChange(next.value);
    closeMenu();
  }

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const selectedIndex = options.findIndex((o) => o.value === value);
      openMenu();
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }

  function onOptionKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectIndex(index);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % options.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        id={buttonId}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className="w-full flex items-center justify-between py-2.5 px-4 border-2 border-slate-200 rounded-lg font-bold text-sm bg-white cursor-pointer focus:outline-none focus:border-slate-900 transition-colors"
      >
        <span>{selected?.label}</span>
        <span className={`text-gray-400 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg overflow-hidden"
        >
          {options.map((o, index) => (
            <li key={o.value} role="option" aria-selected={value === o.value}>
              <button
                type="button"
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                onClick={() => selectIndex(index)}
                onKeyDown={(e) => onOptionKeyDown(e, index)}
                className={`w-full text-left py-2.5 px-4 text-sm font-bold cursor-pointer transition-colors focus:outline-none focus:bg-slate-100 ${
                  value === o.value ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
