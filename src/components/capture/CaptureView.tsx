"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Download, Share2, RefreshCw, VideoOff, Loader2 } from 'lucide-react';

export default function CaptureView() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment' 
        },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      let message = "Could not access the camera. Please check permissions.";
      if (err instanceof Error && err.name === 'NotAllowedError') {
        message = "Camera access was denied. Please allow camera access in your browser settings.";
      }
      setError(message);
      toast({ variant: 'destructive', title: 'Camera Error', description: message });
    } finally {
        setIsLoading(false);
    }
  }, [stream, toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
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
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
          ) : stream ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-muted-foreground">
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
        </div>
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="flex flex-wrap gap-4 justify-center mt-6">
          {!stream && !capturedImage && (
            <Button onClick={startCamera} disabled={isLoading}>
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          )}

          {stream && !capturedImage && (
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
