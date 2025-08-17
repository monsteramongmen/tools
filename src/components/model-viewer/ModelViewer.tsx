
"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ModelViewerElement } from '@google/model-viewer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw, ZoomIn, ZoomOut, Move, RefreshCw, Loader2, AlertTriangle, UploadCloud } from 'lucide-react';
import { Label } from '@/components/ui/label';

// Required for declaration merging
import '@google/model-viewer';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.AllHTMLAttributes<ModelViewerElement>,
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
    import('@google/model-viewer');
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
    if (modelViewerRef.current) {
      const current = modelViewerRef.current.cameraOrbit;
      const [theta, phi, radius] = current.split(' ').map(parseFloat);
      modelViewerRef.current.cameraOrbit = `${theta}deg ${phi}deg ${radius * factor}m`;
    }
  };

  const rotate = (deg: number) => {
    if (modelViewerRef.current) {
      const [theta, phi, radius] = modelViewerRef.current.cameraOrbit.split(' ').map(parseFloat);
      modelViewerRef.current.cameraOrbit = `${theta + deg}deg ${phi}deg ${radius}m`;
    }
  };
  
  const resetCamera = () => {
    modelViewerRef.current?.resetCamera();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            type="text"
            value={inputUrl}
            onChange={handleUrlChange}
            placeholder="Enter .glb or .gltf model URL"
            className="flex-grow"
          />
          <div className="flex gap-2">
            <Button onClick={handleLoadUrl}>Load from URL</Button>
            <Button variant="outline" onClick={triggerFileInput}>
              <UploadCloud className="mr-2" />
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

        <div className="flex flex-wrap gap-4 justify-center mt-6">
            <Button variant="outline" onClick={() => rotate(-15)}>
                <RotateCcw className="mr-2" /> Rotate
            </Button>
            <Button variant="outline" onClick={() => zoom(0.8)}>
                <ZoomIn className="mr-2" /> Zoom In
            </Button>
            <Button variant="outline" onClick={() => zoom(1.25)}>
                <ZoomOut className="mr-2" /> Zoom Out
            </Button>
            <Button variant="outline" onClick={resetCamera}>
                <RefreshCw className="mr-2" /> Reset View
            </Button>
        </div>

      </CardContent>
    </Card>
  );
}
