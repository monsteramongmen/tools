"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ImageCompareSliderProps {
  original: string;
  compressed: string;
  className?: string;
}

export default function ImageCompareSlider({ original, compressed, className }: ImageCompareSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(100, (x / width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  }

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchEnd = () => setIsDragging(false);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove]);

  return (
    <div className={cn("relative w-full max-w-full mx-auto select-none", className)}>
        <div ref={containerRef} className="relative w-full aspect-video overflow-hidden rounded-lg border">
            <img
                src={original}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
            <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img
                    src={compressed}
                    alt="Compressed"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
            </div>
             <div
                className="absolute top-0 bottom-0 bg-white w-1 cursor-ew-resize"
                style={{ left: `calc(${sliderPosition}% - 2px)` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white border-2 border-primary shadow-lg flex items-center justify-center">
                    <div className="h-4 w-1 bg-primary transform rotate-[-15deg]"></div>
                    <div className="h-4 w-1 bg-primary transform rotate-[15deg]"></div>
                </div>
            </div>
        </div>
         <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Compressed</span>
            <span>Original</span>
        </div>
    </div>
  );
}
