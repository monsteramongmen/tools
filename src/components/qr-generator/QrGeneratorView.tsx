"use client";

import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Share2, Loader2, QrCode } from 'lucide-react';

export default function QrGeneratorView() {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateQrCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) {
      setError('Please enter some text or a URL.');
      return;
    }
    setError('');
    setIsLoading(true);
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

  const downloadQrCode = () => {
    if (qrCodeUrl) {
      const a = document.createElement('a');
      a.href = qrCodeUrl;
      a.download = `qrcode-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={generateQrCode} className="flex flex-col sm:flex-row gap-2 mb-6">
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
                    <Button onClick={downloadQrCode}>
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
      </CardContent>
    </Card>
  );
}
