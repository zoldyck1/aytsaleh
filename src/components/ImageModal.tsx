import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Share2 } from 'lucide-react';

interface Image {
  id: string;
  url: string;
  alt_text?: string | null;
  caption?: string | null;
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Image[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function ImageModal({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex, 
  onNavigate 
}: ImageModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentImage = images[currentIndex];

  // Reset transformations when image changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentImage.alt_text || 'صورة',
          url: currentImage.url,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(currentImage.url);
        alert('تم نسخ رابط الصورة!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen || !currentImage) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all duration-200"
              aria-label="إغلاق العارض"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">إغلاق</span>
            </button>
            
            {images.length > 1 && (
              <div className="text-white/80 text-sm bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                {currentIndex + 1} من {images.length}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="تصغير"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <div className="text-white/80 text-sm bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </div>
            
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="تكبير"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <button
              onClick={handleRotate}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all duration-200"
              aria-label="دوران"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            <button
              onClick={handleDownload}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all duration-200"
              aria-label="تحميل الصورة"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={handleShare}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all duration-200"
              aria-label="مشاركة الصورة"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="الصورة السابقة"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === images.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="الصورة التالية"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image Container */}
      <div
        className="flex-1 flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={currentImage.url}
          alt={currentImage.alt_text || `صورة ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          draggable={false}
        />
      </div>

      {/* Image Info */}
      {(currentImage.caption || currentImage.alt_text) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent">
          <div className="p-4 text-center">
            {currentImage.caption && (
              <h3 className="text-white text-lg font-semibold mb-1">
                {currentImage.caption}
              </h3>
            )}
            {currentImage.alt_text && currentImage.alt_text !== currentImage.caption && (
              <p className="text-white/80 text-sm">
                {currentImage.alt_text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-2">
          <div className="flex gap-2 max-w-sm overflow-x-auto scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => onNavigate(index)}
                className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden transition-all duration-200 ${
                  index === currentIndex 
                    ? 'ring-2 ring-white scale-110' 
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={image.url}
                  alt={`صورة مصغرة ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="absolute top-20 left-4 text-white/60 text-xs bg-white/5 backdrop-blur-sm rounded p-2 hidden lg:block">
        <div>مفاتيح الاختصار:</div>
        <div>← → للتنقل</div>
        <div>+ - للتكبير/التصغير</div>
        <div>R للدوران</div>
        <div>Esc للخروج</div>
      </div>
    </div>
  );
}
