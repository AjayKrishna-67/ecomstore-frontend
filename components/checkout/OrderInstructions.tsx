'use client';

import type React from 'react';
import { useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface OrderInstructionsProps {
  orderId: string;
  initialValue?: string;
  disabled?: boolean;
}

export function OrderInstructions({
  orderId,
  initialValue = '',
  disabled = false,
}: OrderInstructionsProps) {
  const [instructions, setInstructions] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    // Only save if there's a change
    if (instructions.trim() === initialValue.trim()) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateOrderInstructions',
          orderId,
          instructions: instructions.trim(),
        }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const hasChanges = instructions.trim() !== initialValue.trim();

  return (
    <section className="bg-surface rounded-2xl border border-border-theme overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border-theme bg-surface-hover">
        <PencilSquareIcon className="w-5 h-5 text-btn-primary" />
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Special Instructions
        </h2>
        {hasChanges && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || disabled}
            className="ml-auto text-xs font-semibold bg-btn-primary/10 text-btn-primary px-3 py-1 rounded-lg hover:bg-btn-primary/20 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      <div className="relative px-5 py-4">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Add a note for the seller..."
          className="w-full p-3 border border-border-theme rounded-lg bg-input-bg text-text-primary focus:ring-2 focus:ring-gold focus:border-navy text-sm resize-none disabled:opacity-50 transition-colors placeholder:text-text-muted"
          rows={3}
          maxLength={500}
        />
        <div className="absolute bottom-2 right-3 text-xs text-text-muted">
          {instructions.length}/500
        </div>
      </div>
    </section>
  );
}
