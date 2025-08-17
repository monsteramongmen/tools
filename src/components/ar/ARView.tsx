"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Play, StopCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ARView() {
  const sceneRef = useRef<any>(null);
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState({ aframe: false, mindar: false });
  const [isStarted, setIsStarted] = useState(false);
  const [mode, setMode] = useState<'video' | 'model'>('model');
  const [modelRotation, setModelRotation] = useState({ x: 0, y: 0, z: 0 });
  const [modelScale, setModelScale] = useState(0.5);

  const allScriptsLoaded = scriptsLoaded.aframe && scriptsLoaded.mindar;

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleStart = () => {
    if (sceneRef.current) {
      const videoEl = document.querySelector("#video-asset") as HTMLVideoElement | null;
      sceneRef.current.systems['mindar-image-system'].start();
      setIsStarted(true);
      if (mode === 'video' && videoEl) {
        videoEl.play();
      }
    }
  };

  const handleStop = () => {
    if (sceneRef.current) {
      const videoEl = document.querySelector("#video-asset") as HTMLVideoElement | null;
      sceneRef.current.systems['mindar-image-system'].stop();
      setIsStarted(false);
      if (videoEl) {
        videoEl.pause();
      }
    }
  };

  const handleModeChange = (newMode: 'video' | 'model') => {
    const videoEl = document.querySelector("#video-asset") as HTMLVideoElement | null;
    setMode(newMode);
    if(isStarted) {
      if (newMode === 'video' && videoEl) {
        videoEl.play();
      } else if (videoEl) {
        videoEl.pause();
      }
    }
  }

  const rotateModel = (axis: 'x' | 'y' | 'z',_direction: 'cw' | 'ccw') => {
    setModelRotation(prev => ({ ...prev, [axis]: prev[axis] + (_direction === 'cw' ? 15 : -15) }));
  };

  const zoomModel = (direction: 'in' | 'out') => {
    setModelScale(prev => Math.max(0.1, prev + (direction === 'in' ? 0.1 : -0.1)));
  };

  useEffect(() => {
    const arSystem = sceneRef.current?.systems['mindar-image-system'];
    if (arSystem) {
      sceneRef.current.addEventListener('arError', (event: any) => {
        toast({
          variant: 'destructive',
          title: 'AR Error',
          description: event.detail.error || 'Could not start AR experience.',
        });
      });
    }
  }, [allScriptsLoaded, toast]);
  
  if (!isClient) {
    return null;
  }

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/aframe@1.5.0/dist/aframe-master.min.js" onLoad={() => setScriptsLoaded(prev => ({...prev, aframe: true}))} />
      <Script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-aframe-three.prod.js" onLoad={() => setScriptsLoaded(prev => ({...prev, mindar: true}))} />
      
      <div className="container mx-auto px-4 py-8 relative max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">AR Viewer</h1>
        <p className="text-muted-foreground mb-6">Point your camera at the target image to see the magic. You can find the target image <a href="https://raw.githubusercontent.com/hiukim/mind-ar-js/master/examples/image-tracking/assets/card-example/card.png" target="_blank" rel="noopener noreferrer" className="text-primary underline">here</a>.</p>
        
        <div className="relative w-full h-[70vh] border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {!allScriptsLoaded && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>Loading AR libraries...</p>
            </div>
          )}

          {allScriptsLoaded && (
            <a-scene
              ref={sceneRef}
              mindar-image={`imageTargetSrc: https://cdn.jsdelivr.net/gh/RanjanLGHIVE/cdn/uploads/mindar_target.mind; autoStart: false; filterMinCF:0.0001; filterBeta: 0.001;`}
              color-space="sRGB"
              renderer="logarithmicDepthBuffer: true;"
              vr-mode-ui="enabled: false"
              device-orientation-permission-ui="enabled: false"
              class="w-full h-full"
            >
              <a-assets>
                <video
                  id="video-asset"
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                  preload="auto" loop muted playsInline crossOrigin="anonymous"
                ></video>
                <a-asset-item
                  id="model-asset"
                  src="https://cdn.einstonlabs.com/ingressify/low-poly_conveyor_for_scada__hmi.glb"
                  crossOrigin="anonymous"
                ></a-asset-item>
              </a-assets>
              <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
              <a-entity mindar-image-target="targetIndex: 0">
                <a-video
                  visible={mode === 'video'}
                  src="#video-asset"
                  width="1" height="0.55" position="0 0 0" rotation="0 0 0"
                ></a-video>
                <a-gltf-model
                  visible={mode === 'model'}
                  src="#model-asset"
                  rotation={`${modelRotation.x} ${modelRotation.y} ${modelRotation.z}`}
                  scale={`${modelScale} ${modelScale} ${modelScale}`}
                  position="0 -0.25 0"
                  animation="property: rotation; to: 0 360 0; loop: true; dur: 10000; easing: linear; enabled: false;"
                ></a-gltf-model>
              </a-entity>
            </a-scene>
          )}

          <div className="absolute top-4 left-4 z-10">
            {!isStarted ? (
              <Button onClick={handleStart} disabled={!allScriptsLoaded}>
                <Play className="mr-2 h-4 w-4" /> Start Camera
              </Button>
            ) : (
              <Button onClick={handleStop} variant="destructive">
                <StopCircle className="mr-2 h-4 w-4" /> Stop Camera
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>Display Mode</CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={mode} onValueChange={(value: 'video' | 'model') => handleModeChange(value)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="model" id="r-model" />
                            <Label htmlFor="r-model">3D Model</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="video" id="r-video" />
                            <Label htmlFor="r-video">Video</Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>
            <Card className={mode !== 'model' ? 'opacity-50 pointer-events-none' : ''}>
                <CardHeader>
                    <CardTitle>3D Model Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="mb-2 block">Rotation</Label>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => rotateModel('y', 'ccw')}><RotateCcw className="mr-1 h-4 w-4" /> Y-axis</Button>
                            <Button variant="outline" size="sm" onClick={() => rotateModel('y', 'cw')}><RotateCw className="mr-1 h-4 w-4" /> Y-axis</Button>
                        </div>
                    </div>
                    <div>
                        <Label className="mb-2 block">Zoom</Label>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => zoomModel('in')}><ZoomIn className="mr-1 h-4 w-4" /> Zoom In</Button>
                            <Button variant="outline" size="sm" onClick={() => zoomModel('out')}><ZoomOut className="mr-1 h-4 w-4" /> Zoom Out</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
