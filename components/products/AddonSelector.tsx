'use client';

import { useEffect, useState } from 'react';
import { Price } from '@/components/products/Price';

export interface AddonItem {
  id: string;
  name: string;
  price: number;
  enabled: boolean;
  image?: { id: string; preview: string } | null;
}

export interface AddonGroup {
  id: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  items: AddonItem[];
}

export interface AddonGroupSelection {
  addonGroupId: string;
  items: Array<{ addonItemId: string; quantity: number }>;
}

interface AddonSelectorProps {
  productVariantId: string | null;
  currencyCode?: string;
  /** Fires whenever the user changes selections. Parent owns the value so it can submit alongside add-to-cart. */
  onChange: (selections: AddonGroupSelection[]) => void;
  /**
   * Fires whenever the set of available addon groups changes. `hasGroups` is
   * true when the variant has at least one enabled addon group — the parent
   * uses this to suppress the qty-in-cart stepper (which would otherwise merge
   * each add into the existing line, silently losing the selected addons).
   */
  onValidityChange?: (info: { hasGroups: boolean }) => void;
  /** Reset all selections (use when variant changes). */
  resetKey?: string | null;
}

export function AddonSelector({
  productVariantId,
  currencyCode,
  onChange,
  onValidityChange,
  resetKey,
}: AddonSelectorProps) {
  const [groups, setGroups] = useState<AddonGroup[]>([]);
  const [loading, setLoading] = useState(false);
  /** Per-group, per-item quantity. 0 means unselected. */
  const [selections, setSelections] = useState<Record<string, Record<string, number>>>({});

  // Reset selections any time the variant or reset trigger changes.
  useEffect(() => {
    setSelections({});
  }, [resetKey, productVariantId]);

  useEffect(() => {
    if (!productVariantId) {
      setGroups([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch('/api/addon-groups?productVariantId=' + encodeURIComponent(productVariantId))
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setGroups(data?.addonGroups ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setGroups([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productVariantId]);

  // Whenever selections or loaded groups change, normalize and bubble up to
  // parent (selections + validity).
  useEffect(() => {
    const result: AddonGroupSelection[] = [];
    for (const [groupId, itemMap] of Object.entries(selections)) {
      const items: Array<{ addonItemId: string; quantity: number }> = [];
      for (const [itemId, qty] of Object.entries(itemMap)) {
        if (qty > 0) items.push({ addonItemId: itemId, quantity: qty });
      }
      if (items.length > 0) result.push({ addonGroupId: groupId, items });
    }
    onChange(result);

    onValidityChange?.({
      hasGroups: groups.some((g) => g.enabled),
    });
    // intentionally omit callbacks from deps — parents that recreate them every
    // render would otherwise cause infinite loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, groups]);

  const toggleCheckboxItem = (groupId: string, itemId: string) => {
    setSelections((prev) => {
      const nextGroup = { ...(prev[groupId] ?? {}) };
      if (nextGroup[itemId]) {
        delete nextGroup[itemId];
      } else {
        nextGroup[itemId] = 1;
      }
      return { ...prev, [groupId]: nextGroup };
    });
  };

  if (!productVariantId) return null;
  if (loading) {
    return (
      <div className="text-xs text-text-tertiary py-2">Loading addons…</div>
    );
  }
  if (groups.length === 0) return null;

  return (
    <div className="mb-5 space-y-4">
      {groups.map((group) => {
        const groupSel = selections[group.id] ?? {};
        return (
          <div
            key={group.id}
            className="border border-border-theme rounded-xl p-4 bg-surface"
          >
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {group.name}
                </h3>
                {group.description ? (
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {group.description}
                  </p>
                ) : null}
              </div>
              <span className="text-[11px] uppercase tracking-wide text-text-tertiary">
                Pick any
              </span>
            </div>

            <div className="space-y-2">
              {group.items
                .filter((i) => i.enabled)
                .map((item) => {
                  const qty = groupSel[item.id] ?? 0;
                  const selected = qty > 0;
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selected
                          ? 'border-btn-primary bg-btn-primary/5'
                          : 'border-border-theme hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCheckboxItem(group.id, item.id)}
                          className="h-4 w-4 accent-btn-primary"
                        />
                        {item.image?.preview ? (
                          <img
                            src={item.image.preview + '?preset=tiny'}
                            alt={item.name}
                            className="h-9 w-9 rounded object-cover border border-border-theme"
                          />
                        ) : null}
                        <span className="text-sm font-medium text-text-primary truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
                        +
                        <Price
                          priceWithTax={item.price}
                          currencyCode={currencyCode as any}
                        />
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
