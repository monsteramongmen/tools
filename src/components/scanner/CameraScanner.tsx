"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, VideoOff, Loader2, ScanLine } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CameraScannerProps {
  onScanSuccess: (result: Result) => void;
}

export default function CameraScanner({ onScanSuccess }: CameraScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const getDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission first
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
      setError("Could not access camera devices. Please grant permission in your browser settings.");
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    getDevices();
  }, [getDevices]);

  const stopScan = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (codeReader.current && typeof codeReader.current.reset === 'function') {
      try {
        codeReader.current.reset();
      } catch (e) {
        console.error("Error calling codeReader.reset(), may already be reset.", e)
      }
    }
    setIsScanning(false);
    setIsLoading(false);
  }, []);

  const startScan = useCallback(async () => {
    if (!selectedDeviceId) {
      toast({ variant: 'destructive', title: 'No Camera Selected', description: 'Please select a camera device.'});
      return;
    }

    setIsLoading(true);
    setIsScanning(true);
    setError(null);

    try {
      if (videoRef.current) {
        const result = await codeReader.current.decodeOnceFromVideoDevice(selectedDeviceId, videoRef.current);
        onScanSuccess(result);
      }
    } catch (err: any) {
      if (err.name !== 'NotFoundException') {
        let message = "Could not start the scanner.";
        if (err.name === 'NotAllowedError') {
          message = "Camera access was denied. Please allow camera access in your browser settings.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = "No camera was found on this device.";
        } else if (err.name === 'NotReadableError') {
          message = "The camera is already in use by another application.";
        }
        setError(message);
        toast({ variant: 'destructive', title: 'Scanner Error', description: message });
      }
      // For NotFoundException, we just silently fail and let the user try again
    } finally {
        stopScan();
    }
  }, [selectedDeviceId, toast, stopScan, onScanSuccess]);

  useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

  return (
    <div>
      <div className="relative w-full bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          <video ref={videoRef} className={`w-full h-full object-cover ${isScanning ? '' : 'hidden'}`} autoPlay playsInline muted />
           <div className={`absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground p-4 ${isScanning ? 'hidden' : 'flex'}`}>
              {isLoading && !isScanning ? (
                  <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <p>Starting camera...</p>
                  </div>
              ) : error ? (
                   <>
                    <VideoOff className="w-16 h-16 mx-auto mb-4" />
                    <p className="max-w-xs">{error}</p>
                  </>
              ) : !isScanning ? (
                  <>
                      <ScanLine className="w-16 h-16 mx-auto mb-4 text-primary" />
                      <p>Camera is off. Press "Start Scan" to begin.</p>
                  </>
              ) : null}
          </div>
          {isScanning && <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-ping"></div>}
      </div>
       <div className="flex flex-wrap gap-4 justify-center mt-6">
          {!isScanning && !isLoading ? (
              <>
                   {devices.length > 0 && (
                      <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                          <SelectTrigger className="w-full sm:w-[250px]">
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
                  <Button onClick={startScan} disabled={isLoading || !selectedDeviceId}>
                      <Camera className="mr-2" /> Start Scan
                  </Button>
              </>
          ) : ( (isScanning || isLoading) &&
              <Button variant="destructive" onClick={stopScan}>
                  <VideoOff className="mr-2" /> Stop Scan
              </Button>
          )}
      </div>
    </div>
  );
}