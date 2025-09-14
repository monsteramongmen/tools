"use client";

import { useState } from 'react';
import { Result } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Link as LinkIcon, RefreshCw, Copy, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '../ui/textarea';
import CameraScanner from './CameraScanner';
import FileScanner from './FileScanner';
import UrlScanner from './UrlScanner';

type ScanMode = "camera" | "file" | "url";

export default function ScannerView() {
  const [scanResult, setScanResult] = useState<Result | null>(null);
  const [mode, setMode] = useState<ScanMode>("camera");
  const [copied, setCopied] = useState(false);

  const handleScanSuccess = (result: Result) => {
    setScanResult(result);
  };

  const resetAll = () => {
    setScanResult(null);
    // The active component will handle its own internal reset
  };
  
  const handleTabChange = (newMode: string) => {
    if (scanResult) {
      resetAll();
    }
    setMode(newMode as ScanMode);
  }

  const copyToClipboard = () => {
    if(scanResult) {
      navigator.clipboard.writeText(scanResult.getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        {!scanResult ? (
          <Tabs value={mode} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="camera"><Camera className="mr-2" />Live Camera</TabsTrigger>
                  <TabsTrigger value="file"><Upload className="mr-2" />Image File</TabsTrigger>
                  <TabsTrigger value="url"><LinkIcon className="mr-2" />Image URL</TabsTrigger>
              </TabsList>
              <TabsContent value="camera" className="mt-6">
                <CameraScanner onScanSuccess={handleScanSuccess} />
              </TabsContent>
              <TabsContent value="file" className="mt-6">
                <FileScanner onScanSuccess={handleScanSuccess} />
              </TabsContent>
              <TabsContent value="url" className="mt-6">
                <UrlScanner onScanSuccess={handleScanSuccess} />
              </TabsContent>
          </Tabs>
        ) : (
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Scan Result</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
        )}
      </CardContent>
    </Card>
  );
}
