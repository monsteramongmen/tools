"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Download, Share2, RefreshCw, VideoOff, Loader2, Crop, SwitchCamera } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CaptureView() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [captureMode, setCaptureMode] = useState<'landscape' | 'portrait'>('landscape');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  useEffect(() => {
    const getDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error enumerating devices:', err);
      }
    };
    getDevices();
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    if (stream) {
        stopCamera();
    }
    setError(null);
    setIsLoading(true);
    try {
      if (!selectedDeviceId) {
        throw new Error("No camera selected");
      }
      const constraints = {
        video: { 
          deviceId: { exact: selectedDeviceId },
          width: { ideal: captureMode === 'landscape' ? 1920 : 1080 },
          height: { ideal: captureMode === 'landscape' ? 1080 : 1920 },
        },
        audio: false 
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      let message = "Could not access the camera. Please check permissions.";
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          message = "Camera access was denied. Please allow camera access in your browser settings.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = "No camera was found on this device.";
        }
      }
      setError(message);
      toast({ variant: 'destructive', title: 'Camera Error', description: message });
      setIsCameraOn(false);
    } finally {
        setIsLoading(false);
    }
  }, [captureMode, stopCamera, stream, toast, selectedDeviceId]);
  
  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const canvasAspectRatio = video.clientWidth / video.clientHeight;

      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;

      const context = canvas.getContext('2d');
      if (context) {
        let sx = 0, sy = 0, sWidth = video.videoWidth, sHeight = video.videoHeight;
        
        if (videoAspectRatio > canvasAspectRatio) { // video is wider than canvas
            sWidth = video.videoHeight * canvasAspectRatio;
            sx = (video.videoWidth - sWidth) / 2;
        } else { // video is taller than canvas
            sHeight = video.videoWidth / canvasAspectRatio;
            sy = (video.videoHeight - sHeight) / 2;
        }

        context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retry = () => {
    setCapturedImage(null);
    startCamera();
  };

  const downloadImage = () => {
    if (capturedImage) {
      const a = document.createElement('a');
      a.href = capturedImage;
      a.download = `capture-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const shareImage = async () => {
    if (capturedImage && navigator.share) {
      try {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Image from AR Toolkit',
                text: 'Check out this image I captured!',
            });
        } else {
            throw new Error("Cannot share this file type.");
        }
      } catch (err) {
        console.error('Error sharing:', err);
        toast({
          variant: 'destructive',
          title: 'Share Error',
          description: 'Could not share the image. Your browser might not support sharing files.',
        });
      }
    } else {
        toast({
            title: 'Share not available',
            description: 'Web Share API is not available on your browser or you are not on a secure connection (HTTPS).',
        });
    }
  };
  
  useEffect(() => {
    if (isCameraOn) {
        startCamera();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureMode, selectedDeviceId]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const showVideo = isCameraOn && !capturedImage && stream;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className={`relative w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center ${captureMode === 'landscape' ? 'aspect-video' : 'aspect-[9/16]'}`}>
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${showVideo ? '' : 'hidden'}`} />
              {!showVideo && (
                <div className="text-center text-muted-foreground p-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <p>Starting camera...</p>
                    </div>
                  ) : error ? (
                    <>
                      <VideoOff className="w-16 h-16 mx-auto mb-4" />
                      <p className="max-w-xs">{error}</p>
                    </>
                  ) : (
                    <>
                      <Camera className="w-16 h-16 mx-auto mb-4" />
                      <p>Camera is off. Press "Start Camera" to begin.</p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="flex flex-wrap gap-4 justify-center mt-6">
          {!isCameraOn && !capturedImage && (
            <>
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full justify-center">
                    <RadioGroup value={captureMode} onValueChange={(value: 'landscape' | 'portrait') => setCaptureMode(value)} className="flex gap-4 items-center">
                        <Label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="landscape" id="landscape" />
                            <Crop className="w-4 h-4" /> Landscape
                        </Label>
                        <Label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="portrait" id="portrait" />
                            <Crop className="w-4 h-4 rotate-90" /> Portrait
                        </Label>
                    </RadioGroup>

                    {devices.length > 1 && (
                      <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SwitchCamera className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Select a camera" />
                        </SelectTrigger>
                        <SelectContent>
                            {devices.map((device) => (
                                <SelectItem key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${devices.indexOf(device) + 1}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                </div>
                <Button onClick={startCamera} disabled={isLoading || !selectedDeviceId}>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
            </>
          )}

          {isCameraOn && !capturedImage && (
            <>
              <Button onClick={capture}>
                <Camera className="mr-2 h-4 w-4" />
                Capture
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                <VideoOff className="mr-2 h-4 w-4" />
                Stop Camera
              </Button>
            </>
          )}

          {capturedImage && (
            <>
              <Button onClick={retry} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button onClick={downloadImage}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              {navigator.share && (
                <Button onClick={shareImage}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
