"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ModelViewerElement } from '@google/model-viewer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw, ZoomIn, ZoomOut, RefreshCw, Loader2, AlertTriangle, UploadCloud } from 'lucide-react';

// Required for declaration merging, but we will import the component dynamically.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.AllHTMLAttributes<ModelViewerElement> & {
          src?: string;
          alt?: string;
          ar?: boolean;
          'ar-modes'?: string;
          'camera-controls'?: boolean;
          'enable-pan'?: boolean;
          'shadow-intensity'?: string;
          autoplay?: boolean;
          style?: React.CSSProperties;
          'camera-orbit'?: string;
          'camera-target'?: string;
          'field-of-view'?: string;
        },
        ModelViewerElement
      >;
    }
  }
}

export function ModelViewerComponent() {
  const modelViewerRef = useRef<ModelViewerElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modelSrc, setModelSrc] = useState('https://cdn.einstonlabs.com/ingressify/low-poly_conveyor_for_scada__hmi.glb');
  const [inputUrl, setInputUrl] = useState('https://cdn.einstonlabs.com/ingressify/low-poly_conveyor_for_scada__hmi.glb');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically import the model-viewer to ensure it only runs on the client
    import('@google/model-viewer').catch(e => console.error("Could not load model-viewer", e));
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((event: any) => {
    setIsLoading(false);
    setError(`Failed to load model: ${event.detail?.source?.url || modelSrc}`);
  }, [modelSrc]);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (modelViewer) {
      modelViewer.addEventListener('load', handleLoad);
      modelViewer.addEventListener('error', handleError);

      // Cleanup event listeners
      return () => {
        modelViewer.removeEventListener('load', handleLoad);
        modelViewer.removeEventListener('error', handleError);
      };
    }
  }, [modelSrc, handleLoad, handleError]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUrl(e.target.value);
  };
  
  const handleLoadUrl = () => {
    if (inputUrl) {
      setError(null);
      setIsLoading(true);
      setModelSrc(inputUrl);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        const url = URL.createObjectURL(file);
        setError(null);
        setIsLoading(true);
        setInputUrl(file.name);
        setModelSrc(url);
      } else {
        setError('Please select a .glb or .gltf file.');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const zoom = (factor: number) => {
    const viewer = modelViewerRef.current;
    if (viewer) {
      const currentOrbit = viewer.getAttribute('camera-orbit');
      if (!currentOrbit) return;

      const [theta, phi, radiusStr] = currentOrbit.split(' ');
      
      const isPercentage = radiusStr.includes('%');
      let radius = parseFloat(radiusStr);
      let unit = isPercentage ? '%' : 'm';
      
      let newRadius = radius * factor;

      if (isPercentage) {
        newRadius = Math.max(10, newRadius); 
      } else {
        newRadius = Math.max(0.1, newRadius); 
      }
      
      viewer.cameraOrbit = `${theta} ${phi} ${newRadius}${unit}`;
    }
  };


  const rotate = (deg: number) => {
    const viewer = modelViewerRef.current;
    if (viewer) {
        const currentOrbit = viewer.getAttribute('camera-orbit');
        if (!currentOrbit) return;
        const [theta, phi, radius] = currentOrbit.split(' ');
        viewer.cameraOrbit = `${parseFloat(theta) + deg}deg ${phi} ${radius}`;
    }
  };
  
  const resetCamera = () => {
    const viewer = modelViewerRef.current;
    if (viewer) {
        viewer.cameraOrbit = '0deg 75deg 105%';
        viewer.cameraTarget = 'auto auto auto';
        viewer.fieldOfView = 'auto';
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
                <Input
                    type="text"
                    value={inputUrl}
                    onChange={handleUrlChange}
                    placeholder="Enter .glb or .gltf model URL"
                    className="flex-grow"
                />
                <Button onClick={handleLoadUrl} className="flex-shrink-0">Load from URL</Button>
            </div>
            
            <div className="flex items-center gap-4 sm:hidden">
                <hr className="flex-grow border-border" />
                <span className="text-muted-foreground text-sm">OR</span>
                <hr className="flex-grow border-border" />
            </div>

            <Button variant="outline" onClick={triggerFileInput} className="w-full sm:hidden">
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload File
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".glb,.gltf"
                className="hidden"
            />
        </div>

        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <model-viewer
                ref={modelViewerRef}
                src={modelSrc}
                alt="A 3D model"
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                enable-pan
                shadow-intensity="1"
                autoplay
                style={{ width: '100%', height: '100%', position: 'absolute' }}
            >
            </model-viewer>
             {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 z-10">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="mt-2 text-muted-foreground">Loading model...</p>
                </div>
            )}
             {error && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 z-10 text-destructive text-center p-4">
                    <AlertTriangle className="w-10 h-10 mb-2" />
                    <p className="font-semibold">Error Loading Model</p>
                    <p className="text-sm">{error}</p>
                </div>
             )}
        </div>

        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-4 justify-center mt-6">
            <Button variant="outline" size="sm" onClick={() => rotate(-15)}>
                <RotateCcw className="mr-2 h-4 w-4" /> Rotate
            </Button>
            <Button variant="outline" size="sm" onClick={() => zoom(0.8)}>
                <ZoomIn className="mr-2 h-4 w-4" /> Zoom In
            </Button>
            <Button variant="outline" size="sm" onClick={() => zoom(1.25)}>
                <ZoomOut className="mr-2 h-4 w-4" /> Zoom Out
            </Button>
            <Button variant="outline" size="sm" onClick={resetCamera}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reset View
            </Button>
        </div>

      </CardContent>
    </Card>
  );
}
