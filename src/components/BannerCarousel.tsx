import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// يدعم الصور الثابتة (PNG/JPG) والمتحركة (GIF/WebP) والفيديو (MP4/WebM)
const bannerMedia = [
  '/icon/banr/banner-1.mp4',
  '/icon/banr/banner-2.mp4',
  '/icon/banr/banner-3.mp4',
  '/icon/banr/banner-1.gif',
  '/icon/banr/banner-2.gif',
  '/icon/banr/banner-3.gif',
  '/icon/banr/banner-1.webp',
  '/icon/banr/banner-2.webp',
  '/icon/banr/banner-3.webp',
  '/icon/banr/banner-1.png',
  '/icon/banr/banner-2.png',
  '/icon/banr/banner-3.png',
];

type MediaItem = {
  src: string;
  type: 'image' | 'video';
};

type TransitionDirection = 'next' | 'prev';

const BannerCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);
  const [availableMedia, setAvailableMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<TransitionDirection>('next');
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const checkMedia = async () => {
      setIsLoading(true);
      const results = await Promise.all(
        bannerMedia.map((src) =>
          new Promise<{ src: string; exists: boolean; type: 'image' | 'video' }>((resolve) => {
            const isVideo = /\.(mp4|webm)$/i.test(src);
            
            if (isVideo) {
              const video = document.createElement('video');
              video.onloadedmetadata = () => resolve({ src, exists: true, type: 'video' });
              video.onerror = () => resolve({ src, exists: false, type: 'video' });
              video.src = src;
            } else {
              const img = new Image();
              img.onload = () => resolve({ src, exists: true, type: 'image' });
              img.onerror = () => resolve({ src, exists: false, type: 'image' });
              img.src = src;
            }
          })
        )
      );
      
      const existing = results.filter((r) => r.exists);
      
      // Remove duplicates by base name (keep first match - priority: MP4 > GIF > WebP > PNG)
      const uniqueByBase: MediaItem[] = [];
      const seenBases = new Set<string>();
      
      for (const item of existing) {
        const baseName = item.src.replace(/\.(mp4|webm|gif|webp|png|jpg|jpeg)$/i, '');
        if (!seenBases.has(baseName)) {
          seenBases.add(baseName);
          uniqueByBase.push({ src: item.src, type: item.type });
        }
      }
      
      setAvailableMedia(uniqueByBase);
      setIsLoading(false);
    };
    checkMedia();
  }, []);

  useEffect(() => {
    if (availableMedia.length <= 1) return;

    const currentMedia = availableMedia[currentIndex];
    const isVideo = currentMedia?.type === 'video';
    
    // For videos, wait for them to end before switching
    if (isVideo) {
      const videoEl = videoRefs.current[currentIndex];
      if (videoEl) {
        const handleEnded = () => {
          setCurrentIndex((prev) => (prev + 1) % availableMedia.length);
        };
        videoEl.addEventListener('ended', handleEnded);
        return () => videoEl.removeEventListener('ended', handleEnded);
      }
    }
    
    // For images, use interval
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % availableMedia.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [availableMedia.length, currentIndex, availableMedia]);

  // Play/pause videos based on visibility
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.currentTime = 0;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  const goToPrevious = () => {
    if (isTransitioning) return;
    setDirection('prev');
    setPreviousIndex(currentIndex);
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + availableMedia.length) % availableMedia.length);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setDirection('next');
    setPreviousIndex(currentIndex);
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % availableMedia.length);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  const goToIndex = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setDirection(index > currentIndex ? 'next' : 'prev');
    setPreviousIndex(currentIndex);
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  // Helper function to get transition classes
  const getTransitionClasses = (index: number) => {
    const isActive = index === currentIndex;
    const wasPrevious = index === previousIndex;
    
    if (isActive) {
      return direction === 'next'
        ? 'translate-x-0 opacity-100 scale-100 z-10'
        : 'translate-x-0 opacity-100 scale-100 z-10';
    }
    
    if (wasPrevious && isTransitioning) {
      return direction === 'next'
        ? '-translate-x-full opacity-0 scale-95 z-5'
        : 'translate-x-full opacity-0 scale-95 z-5';
    }
    
    // Default hidden state
    return direction === 'next'
      ? 'translate-x-full opacity-0 scale-95 z-0'
      : '-translate-x-full opacity-0 scale-95 z-0';
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden glass-effect flex items-center justify-center">
        <div className="animate-pulse bg-muted w-full h-full" />
      </div>
    );
  }

  if (availableMedia.length === 0) {
    return (
      <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden glass-effect flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-muted-foreground text-sm">مساحة إعلانية</p>
          <p className="text-xs text-muted-foreground mt-1">
            أضف ملفات البانر (PNG, JPG, GIF, WebP, MP4) في مجلد public/icon/banr
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            يدعم الصور المتحركة GIF و WebP والفيديو MP4
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden glass-effect group">
      {/* Media - supports images, animated GIF/WebP, and videos */}
      <div className="relative w-full h-full">
        {availableMedia.map((media, index) => {
          const isVideo = media.type === 'video';
          const isAnimated = /\.(gif|webp)$/i.test(media.src);
          const transitionClasses = getTransitionClasses(index);
          
          if (isVideo) {
            return (
              <video
                key={media.src}
                ref={(el) => (videoRefs.current[index] = el)}
                src={media.src}
                muted
                playsInline
                loop={true}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out transform ${transitionClasses}`}
              />
            );
          }
          
          return (
            <img
              key={media.src}
              src={media.src}
              alt={`Banner ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out transform ${transitionClasses}`}
              loading={isAnimated ? 'eager' : 'lazy'}
            />
          );
        })}
      </div>

      {/* Gradient overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-20" />

      {/* Navigation Arrows */}
      {availableMedia.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Dots indicator */}
      {availableMedia.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {availableMedia.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-6 shadow-lg'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Media type badge */}
      {availableMedia[currentIndex] && (
        <div className="absolute top-3 right-3 z-30">
          {availableMedia[currentIndex].type === 'video' ? (
            <span className="px-2 py-1 text-xs font-medium bg-red-500/80 text-white rounded-full backdrop-blur-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              فيديو
            </span>
          ) : /\.(gif|webp)$/i.test(availableMedia[currentIndex].src) ? (
            <span className="px-2 py-1 text-xs font-medium bg-primary/80 text-primary-foreground rounded-full backdrop-blur-sm">
              متحركة
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
