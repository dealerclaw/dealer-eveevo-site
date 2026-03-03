import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";

interface CarImageGalleryProps {
  images: string[];
  make: string;
  model: string;
}

/** Minimum horizontal drag distance (px) to trigger a swipe */
const SWIPE_THRESHOLD = 50;

function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      // Only trigger if horizontal movement dominates
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }
      startX.current = null;
      startY.current = null;
    },
    [onSwipeLeft, onSwipeRight]
  );

  return { onTouchStart, onTouchEnd };
}

export default function CarImageGallery({ images, make, model }: CarImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center">
        <ImageIcon className="w-16 h-16 text-gray-400 mb-2" />
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  const goToPrevious = () =>
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const goToNext = () =>
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") setIsFullscreen(false);
  };

  // Swipe handlers for the main gallery image
  const { onTouchStart, onTouchEnd } = useSwipe(goToNext, goToPrevious);

  // Swipe handlers for the fullscreen dialog
  const {
    onTouchStart: onFsTouchStart,
    onTouchEnd: onFsTouchEnd,
  } = useSwipe(goToNext, goToPrevious);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative w-full h-72 sm:h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden group select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={images[selectedIndex]}
          alt={`${make} ${model} - Image ${selectedIndex + 1}`}
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Image Counter */}
        <div className="absolute top-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs sm:text-sm">
          {selectedIndex + 1} / {images.length}
        </div>

        {/* Fullscreen Button — always visible on mobile, hover on desktop */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 left-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={() => setIsFullscreen(true)}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        {/* Navigation Arrows — always visible on mobile, hover on desktop */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Swipe hint dots on mobile */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden">
            {images.slice(0, Math.min(images.length, 8)).map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === selectedIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
            {images.length > 8 && (
              <span className="text-white/60 text-[10px] leading-none self-center">+{images.length - 8}</span>
            )}
          </div>
        )}
      </div>

      {/* Thumbnail Grid — hidden on mobile (use swipe instead) */}
      {images.length > 1 && (
        <div className="hidden sm:grid grid-cols-6 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`
                relative h-20 rounded-lg overflow-hidden border-2 transition-all
                ${
                  index === selectedIndex
                    ? "border-green-600 ring-2 ring-green-600/20"
                    : "border-transparent hover:border-gray-300"
                }
              `}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Mobile horizontal thumbnail strip */}
      {images.length > 1 && (
        <div className="sm:hidden flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`
                flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all snap-start
                ${
                  index === selectedIndex
                    ? "border-green-600 ring-2 ring-green-600/20"
                    : "border-transparent"
                }
              `}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent
          className="max-w-screen-xl w-full h-screen max-h-screen p-0 bg-black/95"
          onKeyDown={handleKeyDown}
        >
          <div
            className="relative w-full h-full flex items-center justify-center select-none"
            onTouchStart={onFsTouchStart}
            onTouchEnd={onFsTouchEnd}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Image Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/20 text-white px-4 py-2 rounded-full text-sm z-50">
              {selectedIndex + 1} / {images.length}
            </div>

            {/* Main Image */}
            <img
              src={images[selectedIndex]}
              alt={`${make} ${model} - Image ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain pointer-events-none"
              draggable={false}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-screen-lg overflow-x-auto px-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={`
                      flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                      ${
                        index === selectedIndex
                          ? "border-white ring-2 ring-white/50"
                          : "border-transparent hover:border-white/50"
                      }
                    `}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
