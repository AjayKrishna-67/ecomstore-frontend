'use client';

import { useState, useRef, MouseEvent } from 'react';

interface Asset {
  id: string;
  preview: string;
}

interface Props {
  assets: Asset[];
  activeAssetId?: string | null;
  onSelect?: (asset: Asset) => void;
  productName: string;
}

export function ProductImageGallery({
  assets,
  activeAssetId,
  onSelect,
  productName,
}: Props) {
  const active =
    assets.find((a) => a.id === activeAssetId) ?? assets[0] ?? null;
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  if (!active) return null;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4 w-full">
      {/* Thumbnails */}
      {assets.length > 1 ? (
        <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto pb-1 sm:pb-0">
          {assets.map((asset) => {
            const isActive = asset.id === active.id;
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onSelect?.(asset)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  isActive
                    ? 'border-header-accent shadow-md'
                    : 'border-header-accent/20 hover:border-header-accent/50'
                }`}
                aria-label={`View image ${asset.id}`}
              >
                <img
                  src={asset.preview + '?w=160&h=160'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Main image */}
      <div className="flex-1">
        <div
          ref={imgRef}
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
          className="relative w-full aspect-square rounded-2xl overflow-hidden bg-background border border-header-accent/20 shadow-md cursor-zoom-in"
        >
          <img
            src={active.preview + '?w=1400'}
            alt={productName}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${
              isZooming ? 'sm:opacity-0' : 'opacity-100'
            }`}
          />
          {/* Zoomed layer (desktop only) */}
          <div
            aria-hidden
            className={`hidden sm:block absolute inset-0 transition-opacity duration-150 ${
              isZooming ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${active.preview}?w=1600)`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: '200%',
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
