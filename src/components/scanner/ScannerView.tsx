"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, VideoOff, Loader2, Upload, Link as LinkIcon, RefreshCw, Copy, Check, ScanLine } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

type ScanMode = "camera" | "file" | "url";

export default function ScannerView() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  
  const [scanResult, setScanResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  const [mode, setMode] = useState<ScanMode>("camera");
  const [imageUrl, setImageUrl] = useState('');

  // Initialize codeReader ref
  useEffect(() => {
    if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
    }
  }, []);

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
    if (codeReader.current && typeof codeReader.current.reset === 'function') {
        codeReader.current.reset();
    }
    setIsScanning(false);
    setIsLoading(false);
  }, []);

  const startScan = useCallback(async () => {
    if (!selectedDeviceId) {
      toast({ variant: 'destructive', title: 'No Camera Selected', description: 'Please select a camera device.'});
      return;
    }
    if (!codeReader.current) return;

    setIsLoading(true);
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      if (videoRef.current) {
        await codeReader.current.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
          if (result) {
            setScanResult(result);
            stopScan();
            playBeep();
          }
          if (err && err.name !== 'NotFoundException') {
            console.error(err);
            // Don't set a hard error for continuous scanning, just log it.
          }
        });
      }
      setIsLoading(false);
    } catch (err: any) {
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
      setIsLoading(false);
      setIsScanning(false);
    }
  }, [selectedDeviceId, toast, stopScan]);
  
  const decodeFromImage = async (source: string | File) => {
    setError(null);
    setScanResult(null);
    setIsLoading(true);
    
    if (!codeReader.current) {
        setIsLoading(false);
        setError("Scanner not initialized.");
        return;
    }
    
    try {
      let src: string;
      if (typeof source === 'string') {
        // Use a proxy for CORS issues
        src = `https://images.weserv.nl/?url=${encodeURIComponent(source)}`;
      } else {
        src = URL.createObjectURL(source);
      }

      const result = await codeReader.current.decodeFromImage(undefined, src);
      setScanResult(result);
      playBeep();
    } catch (err: any) {
      console.error(err);
      let message = "Could not decode the barcode from the image.";
      if (err.name === 'NotFoundException') {
        message = "No barcode was found in the image. Please try a clearer image."
      } else if (err instanceof DOMException && err.name === 'NotSupportedError') {
          message = "Image format not supported by the browser."
      } else {
          message = "No barcode found. The image may be too blurry or the format is not supported.";
      }
      setError(message);
      toast({ variant: 'destructive', title: 'Decoding Error', description: message });
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      decodeFromImage(file);
    }
  };
  
  const handleUrlSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if(imageUrl) {
        decodeFromImage(imageUrl);
    }
  }
  
  const resetAll = () => {
    stopScan();
    setScanResult(null);
    setError(null);
    setIsLoading(false);
    setImageUrl('');
  }

  useEffect(() => {
    return () => {
      stopScan();
    }
  }, [stopScan]);

  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    if(scanResult) {
      navigator.clipboard.writeText(scanResult.getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  
  const playBeep = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.value = 0.1; // Lower volume
        oscillator.frequency.value = 880; // A5 note
        oscillator.type = 'sine';
        
        oscillator.start();
        setTimeout(() => oscillator.stop(), 150);
    } catch (e) {
        console.warn("Could not play beep sound.", e);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {!scanResult && (
          <Tabs value={mode} onValueChange={(v) => { resetAll(); setMode(v as ScanMode); }} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="camera"><Camera className="mr-2" />Live Camera</TabsTrigger>
                  <TabsTrigger value="file"><Upload className="mr-2" />Image File</TabsTrigger>
                  <TabsTrigger value="url"><LinkIcon className="mr-2" />Image URL</TabsTrigger>
              </TabsList>
              <TabsContent value="camera" className="mt-6">
                  <div className="relative w-full bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                      <video ref={videoRef} className={`w-full h-full object-cover ${isScanning ? '' : 'hidden'}`} />
                       <div className={`absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground p-4 ${isScanning ? 'hidden' : 'flex'}`}>
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
                      {!isScanning && !scanResult ? (
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
                      ) : ( isScanning &&
                          <Button variant="destructive" onClick={stopScan}>
                              <VideoOff className="mr-2" /> Stop Scan
                          </Button>
                      )}
                  </div>
              </TabsContent>
              <TabsContent value="file" className="mt-6">
                   <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-lg text-center min-h-[200px]">
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">Upload an Image</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Select an image file containing a barcode.</p>
                      <Input type="file" accept="image/*" onChange={handleFileChange} className="mt-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 w-full max-w-sm"/>
                  </div>
              </TabsContent>
              <TabsContent value="url" className="mt-6">
                  <form onSubmit={handleUrlSubmit} className="flex flex-col items-center gap-4">
                       <Input
                          type="text"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="Enter image URL"
                          className="w-full max-w-lg"
                      />
                      <Button type="submit" disabled={isLoading || !imageUrl}>
                          {isLoading ? <Loader2 className="animate-spin mr-2"/> : <LinkIcon className="mr-2" />} 
                          Scan from URL
                      </Button>
                  </form>
              </TabsContent>
          </Tabs>
        )}

        {(scanResult || (error && !isLoading && !isScanning)) && (
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>{scanResult ? 'Scan Result' : 'Error'}</CardTitle>
                </CardHeader>
                <CardContent>
                    {scanResult ? (
                        <div className="space-y-4">
                            <Textarea readOnly value={scanResult.getText()} className="min-h-[100px] font-mono text-sm" />
                            <p className="text-sm text-muted-foreground">
                                <span className="font-semibold">Format:</span> {scanResult.getBarcodeFormat()}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button onClick={copyToClipboard}>
                                    {copied ? <Check className="mr-2"/> : <Copy className="mr-2" />}
                                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                                </Button>
                                <Button variant="outline" onClick={resetAll}>
                                    <RefreshCw className="mr-2" /> New Scan
                                </Button>
                            </div>
                        </div>
                    ) : (
                         <div className="space-y-4">
                            <p className="text-destructive">{error}</p>
                            <Button variant="outline" onClick={resetAll}>
                                <RefreshCw className="mr-2" /> Try Again
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        )}

      </CardContent>
    </Card>
  );
}
