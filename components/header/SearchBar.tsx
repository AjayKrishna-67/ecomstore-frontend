'use client';

import type React from 'react';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function SearchBar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get('q') as string;
    if (query?.trim()) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Search container */}
      <div
        className={`relative flex flex-col items-center justify-start pt-[18vh] px-4 transition-all duration-300 ${
          isOpen ? 'translate-y-0' : '-translate-y-8'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-surface/80 backdrop-blur-sm border border-border-theme text-text-primary hover:bg-surface transition-all"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Search heading */}
        <h2 className="text-text-secondary text-sm uppercase tracking-[0.2em] font-semibold mb-6">
          What are you looking for?
        </h2>

        {/* Search card */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl">
          <div className="relative group bg-surface/90 border border-border-theme rounded-2xl shadow-lg backdrop-blur-md">
            <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted group-focus-within:text-header-accent transition-colors" />
            <input
              ref={inputRef}
              type="text"
              name="q"
              placeholder="Search products..."
              className="w-full pl-14 pr-5 py-4 bg-transparent rounded-2xl text-text-primary text-lg placeholder:text-text-muted focus:outline-none transition-all duration-200"
              autoComplete="off"
            />
          </div>

          <p className="text-center text-text-muted text-xs mt-4">
            Press <kbd className="px-1.5 py-0.5 bg-surface border border-border-theme rounded text-text-tertiary text-[11px] font-mono shadow-sm">Enter</kbd> to search
            &nbsp;&middot;&nbsp;
            <kbd className="px-1.5 py-0.5 bg-surface border border-border-theme rounded text-text-tertiary text-[11px] font-mono shadow-sm">Esc</kbd> to close
          </p>
        </form>
      </div>
    </div>
  );
}
