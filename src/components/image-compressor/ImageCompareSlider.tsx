"use client";

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '../ui/slider';

interface ImageCompareSliderProps {
  original: string;
  compressed: string;
  className?: string;
}

export default function ImageCompareSlider({ original, compressed, className }: ImageCompareSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = (value: number[]) => {
    setSliderPosition(value[0]);
  };
  
  return (
    <div className={cn("relative w-full max-w-full mx-auto", className)}>
        <div ref={containerRef} className="relative w-full aspect-video overflow-hidden rounded-lg border">
            <img
                src={original}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain"
            />
            <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img
                    src={compressed}
                    alt="Compressed"
                    className="absolute inset-0 w-full h-full object-contain"
                />
            </div>
             <div
                className="absolute top-0 bottom-0 bg-white w-1 cursor-ew-resize"
                style={{ left: `calc(${sliderPosition}% - 2px)` }}
            >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white border-2 border-primary shadow-lg flex items-center justify-center">
                    <div className="h-4 w-1 bg-primary transform rotate-[-15deg]"></div>
                    <div className="h-4 w-1 bg-primary transform rotate-[15deg]"></div>
                </div>
            </div>
        </div>
        <Slider
            value={[sliderPosition]}
            onValueChange={handleSliderChange}
            max={100}
            step={0.1}
            className="mt-4"
        />
         <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Original</span>
            <span>Compressed</span>
        </div>
    </div>
  );
}
