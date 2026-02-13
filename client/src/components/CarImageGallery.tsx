import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";

interface CarImageGalleryProps {
  images: string[];
  make: string;
  model: string;
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

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") setIsFullscreen(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden group">
        <img
          src={images[selectedIndex]}
          alt={`${make} ${model} - Image ${selectedIndex + 1}`}
          className="w-full h-full object-contain"
        />

        {/* Image Counter */}
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {selectedIndex + 1} / {images.length}
        </div>

        {/* Fullscreen Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsFullscreen(true)}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
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

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent 
          className="max-w-screen-xl w-full h-screen max-h-screen p-0 bg-black/95"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
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
              className="max-w-full max-h-full object-contain"
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
