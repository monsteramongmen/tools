"use client";

import { useState, useRef } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/browser';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';

interface FileScannerProps {
    onScanSuccess: (result: Result) => void;
}

export default function FileScanner({ onScanSuccess }: FileScannerProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const codeReader = useRef(new BrowserMultiFormatReader());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const decodeFromFile = async (file: File) => {
        setError(null);
        setIsLoading(true);

        try {
            const src = URL.createObjectURL(file);
            const result = await codeReader.current.decodeFromImage(undefined, src);
            onScanSuccess(result);
        } catch (err) {
            console.error(err);
            const message = "No barcode was found in the image. Please try a clearer image or a different file.";
            setError(message);
            toast({ variant: 'destructive', title: 'Decoding Error', description: message });
        } finally {
            setIsLoading(false);
            // Reset file input to allow re-selection of the same file
            if(fileInputRef.current) {
              fileInputRef.current.value = "";
            }
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            decodeFromFile(file);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-lg text-center min-h-[200px]">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Upload an Image</h3>
            <p className="mt-1 text-sm text-muted-foreground">Select an image file containing a barcode.</p>
            <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
                className="mt-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 w-full max-w-sm"
            />
            {isLoading && (
                <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                    <Loader2 className="animate-spin" />
                    <p>Processing image...</p>
                </div>
            )}
            {error && !isLoading && (
                <p className="mt-4 text-destructive">{error}</p>
            )}
        </div>
    );
}