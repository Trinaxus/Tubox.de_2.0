import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

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

  return (
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

      {/* Image counter */}
      <div className="absolute top-4 left-4 z-50 text-white bg-black/50 px-3 py-1 rounded">
        {currentIndex + 1} / {images.length}
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
        onClick={onClose}
      >
        <img
          src={currentImage}
          alt={`${galleryTitle} - Bild ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      </div>

      {/* Thumbnail strip (optional, for better UX) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2 max-w-full overflow-x-auto px-4">
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
                src={img}
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
  );
};