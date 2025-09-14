"use client";

import { useState, useRef } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/browser';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, Loader2 } from 'lucide-react';

interface UrlScannerProps {
    onScanSuccess: (result: Result) => void;
}

export default function UrlScanner({ onScanSuccess }: UrlScannerProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState('');
    const codeReader = useRef(new BrowserMultiFormatReader());

    const decodeFromUrl = async (url: string) => {
        setError(null);
        setIsLoading(true);

        try {
            // Using a CORS proxy to prevent cross-origin issues
            const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
            const result = await codeReader.current.decodeFromImage(undefined, proxyUrl);
            onScanSuccess(result);
        } catch (err) {
            console.error(err);
            const message = "Could not find a barcode in the image at the provided URL. Please check the link or try a different image.";
            setError(message);
            toast({ variant: 'destructive', title: 'Decoding Error', description: message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (imageUrl) {
            decodeFromUrl(imageUrl);
        }
    };

    return (
        <form onSubmit={handleUrlSubmit} className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-muted rounded-lg text-center min-h-[200px] justify-center">
            <LinkIcon className="w-12 h-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">Scan from Image URL</h3>
            <p className="mt-1 text-sm text-muted-foreground">Enter the web address of an image to scan.</p>
            <Input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/barcode.png"
                className="w-full max-w-lg"
                disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !imageUrl}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <LinkIcon className="mr-2" />}
                Scan from URL
            </Button>
            {error && !isLoading && (
                <p className="mt-4 text-destructive">{error}</p>
            )}
        </form>
    );
}
