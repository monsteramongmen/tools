"use client";

import { useState } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Share2, Loader2, QrCode, Package, FileJson, PackageCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type BulkQrCode = {
    id: string;
    data: string;
    url: string;
}

export default function QrGeneratorView() {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [bulkJson, setBulkJson] = useState('');
  const [bulkQrCodes, setBulkQrCodes] = useState<BulkQrCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  const generateSingleQrCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) {
      setError('Please enter some text or a URL.');
      return;
    }
    setError('');
    setIsLoading(true);
    setQrCodeUrl('');
    try {
      const url = await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 512,
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error(err);
      setError('Failed to generate QR code. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Generation Error',
        description: 'Could not generate the QR code.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateBulkQrCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkJson) {
        setError('Please enter a valid JSON array.');
        return;
    }
    setError('');
    setIsLoading(true);
    setBulkQrCodes([]);

    try {
        const data = JSON.parse(bulkJson);
        if (!Array.isArray(data)) {
            throw new Error('Input is not a JSON array.');
        }

        const generatedCodes: BulkQrCode[] = await Promise.all(
            data.map(async (item, index) => {
                const dataString = typeof item === 'object' ? JSON.stringify(item) : String(item);
                const url = await QRCode.toDataURL(dataString, {
                    errorCorrectionLevel: 'H',
                    type: 'image/png',
                    quality: 0.92,
                    margin: 1,
                    width: 256,
                });
                return { id: `qrcode-${index}-${Date.now()}`, data: dataString, url };
            })
        );
        setBulkQrCodes(generatedCodes);

    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to process JSON. ${errorMessage}`);
        toast({
            variant: 'destructive',
            title: 'Bulk Generation Error',
            description: `Could not generate QR codes from the provided JSON. ${errorMessage}`,
        });
    } finally {
        setIsLoading(false);
    }
  };

  const downloadQrCode = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const downloadAllAsZip = async () => {
    if (bulkQrCodes.length === 0) return;
    
    const zip = new JSZip();
    
    await Promise.all(bulkQrCodes.map(async (qr, index) => {
      const response = await fetch(qr.url);
      const blob = await response.blob();
      // Sanitize data for filename
      const safeFilename = qr.data.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      zip.file(`qrcode_${index + 1}_${safeFilename}.png`, blob);
    }));

    zip.generateAsync({ type: 'blob' }).then((content) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `qrcodes-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  };

  const shareQrCode = async () => {
    if (qrCodeUrl && navigator.share) {
      try {
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const file = new File([blob], `qrcode-${Date.now()}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'QR Code',
            text: `Here is a QR code for: ${text}`,
          });
        } else {
            throw new Error("Cannot share this file type.");
        }
      } catch (err) {
        console.error('Error sharing:', err);
        toast({
          variant: 'destructive',
          title: 'Share Error',
          description: 'Could not share the QR code.',
        });
      }
    } else {
        toast({
            title: 'Share not available',
            description: 'Web Share API is not available on your browser or you are not on a secure connection (HTTPS).',
        });
    }
  };

  const handleTabChange = (value: string) => {
    setMode(value as 'single' | 'bulk');
    setError('');
    setQrCodeUrl('');
    setBulkQrCodes([]);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs value={mode} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single"><Package className="mr-2 h-4 w-4" />Single QR</TabsTrigger>
                <TabsTrigger value="bulk"><FileJson className="mr-2 h-4 w-4" />Bulk from JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="single" className="mt-6">
                <form onSubmit={generateSingleQrCode} className="flex flex-col sm:flex-row gap-2 mb-6">
                <Input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text or URL"
                    className="flex-grow"
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                    Generate
                </Button>
                </form>
                {error && <p className="text-destructive text-center mb-4">{error}</p>}

                {qrCodeUrl && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                            <img src={qrCodeUrl} alt="Generated QR Code" className="w-64 h-64" />
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Button onClick={() => downloadQrCode(qrCodeUrl, `qrcode-${Date.now()}.png`)}>
                                <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                            {navigator.share && (
                                <Button variant="outline" onClick={shareQrCode}>
                                <Share2 className="mr-2 h-4 w-4" /> Share
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="bulk" className="mt-6">
                 <form onSubmit={generateBulkQrCodes} className="flex flex-col gap-4 mb-6">
                    <Textarea
                        value={bulkJson}
                        onChange={(e) => setBulkJson(e.target.value)}
                        placeholder='Enter a JSON array of strings or objects, e.g., ["hello", "world"]'
                        className="flex-grow min-h-[150px] font-mono text-sm"
                    />
                    <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                        Generate from JSON
                    </Button>
                </form>
                {error && <p className="text-destructive text-center mb-4">{error}</p>}

                {bulkQrCodes.length > 0 && (
                    <div className="flex flex-col items-center gap-6">
                         <Button onClick={downloadAllAsZip} variant="default" size="lg">
                            <PackageCheck className="mr-2 h-5 w-5" /> Download All as .zip
                        </Button>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                            {bulkQrCodes.map((qr) => (
                                <div key={qr.id} className="flex flex-col items-center gap-2 p-3 border rounded-lg bg-card">
                                    <div className="p-2 bg-white rounded-md border">
                                        <img src={qr.url} alt="Generated QR Code" className="w-full h-auto aspect-square" />
                                    </div>
                                    <p className="text-xs text-muted-foreground w-full truncate text-center" title={qr.data}>{qr.data}</p>
                                    <Button size="sm" variant="outline" className="w-full" onClick={() => downloadQrCode(qr.url, `${qr.id}.png`)}>
                                        <Download className="mr-1 h-4 w-4" /> Download
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
