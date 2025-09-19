import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { ImageInfoDialog } from '@/components/gallery/ImageInfoDialog';

interface LightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onThumbnailClick: (index: number) => void;
  galleryTitle: string;
}

export const Lightbox = ({ 
  images, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev, 
  onThumbnailClick,
  galleryTitle 
}: LightboxProps) => {
  const [infoOpen, setInfoOpen] = useState(false);
  // Swipe/drag refs
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startT = useRef<number>(0);
  const dragging = useRef<boolean>(false);
  const didSwipe = useRef<boolean>(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button/finger
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    dragging.current = true;
    didSwipe.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startT.current = performance.now();
    // capture pointer to receive move/up outside element
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || startX.current == null || startY.current == null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    // If mostly horizontal movement and over a small threshold, mark as swipe to avoid onClose
    if (!didSwipe.current && Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      didSwipe.current = true;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || startX.current == null || startY.current == null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    const dt = Math.max(1, performance.now() - startT.current);
    const vx = dx / dt; // px per ms
    const horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
    const passed = Math.abs(dx) > 50 || Math.abs(vx) > 0.35; // distance or velocity

    if (horizontal && passed) {
      if (dx < 0) onNext(); else onPrev();
    } else if (!didSwipe.current) {
      // treat as click-to-close if no swipe gesture was detected
      onClose();
    }

    dragging.current = false;
    didSwipe.current = false;
    startX.current = null;
    startY.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
          onNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const currentImage = images[currentIndex];

  const originalImageUrl = useMemo(() => {
    try {
      const u = new URL(currentImage, window.location.href);
      // If it's a preview URL, try to map to original
      u.pathname = u.pathname.replace('/preview/', '/');
      return u.toString();
    } catch {
      return currentImage.replace('/preview/', '/');
    }
  }, [currentImage]);

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>

      {/* Left controls: Info + counter */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); setInfoOpen(true); }}
          aria-label="Bild-Informationen"
        >
          <Info className="h-5 w-5" />
        </Button>
        <div className="text-white bg-black/50 px-3 py-1 rounded">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Gallery title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 text-white bg-black/50 px-4 py-2 rounded">
        {galleryTitle}
      </div>

      {/* Previous button */}
      {images.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
      )}

      {/* Next button */}
      {images.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      )}

      {/* Main image */}
      <div 
        className="flex items-center justify-center w-full h-full p-8"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragging.current = false; didSwipe.current = false; }}
      >
        <img
          src={currentImage}
          alt={`${galleryTitle} - Bild ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => {
            // prevent inner image click from bubbling; wrapper decides to close or swipe
            e.stopPropagation();
          }}
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      </div>

      {/* Thumbnail strip (optional, for better UX) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 max-w-full overflow-x-auto overflow-y-hidden px-4 py-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => onThumbnailClick(index)}
              className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all duration-200 ${
                index === currentIndex 
                  ? 'border-primary shadow-lg scale-110' 
                  : 'border-white/30 hover:border-white/60 hover:scale-105'
              }`}
              aria-label={`Bild ${index + 1} anzeigen`}
            >
              <img
                src={(function toPreview(url: string) {
                  try {
                    const u = new URL(url);
                    const parts = u.pathname.split('/');
                    const file = parts.pop() || '';
                    if (parts.includes('preview')) return url;
                    parts.push('preview');
                    parts.push(file);
                    return `${u.origin}${parts.join('/')}${u.search}`;
                  } catch {
                    return url.replace(/\/([^\/]+)$/,'/preview/$1');
                  }
                })(img)}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
    {/* Metadata dialog */}
    <ImageInfoDialog
      open={infoOpen}
      onOpenChange={setInfoOpen}
      imageUrl={originalImageUrl}
      title={galleryTitle}
    />
    </>
  );
}