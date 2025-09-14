"use client";

import { useState, useRef } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/browser';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
            const img = new Image();
            img.src = src;
            img.onload = async () => {
                try {
                    const result = await codeReader.current.decodeFromImageElement(img);
                    onScanSuccess(result);
                } catch (err) {
                     console.error(err);
                    const message = "No barcode was found in the image. Please try a clearer image or a different file.";
                    setError(message);
                    toast({ variant: 'destructive', title: 'Decoding Error', description: message });
                } finally {
                    URL.revokeObjectURL(src);
                    setIsLoading(false);
                    if(fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                }
            };
            img.onerror = () => {
                setError("Could not load the selected file as an image.");
                toast({ variant: 'destructive', title: 'File Error', description: "The selected file could not be loaded as an image." });
                URL.revokeObjectURL(src);
                setIsLoading(false);
            };

        } catch (err) {
            console.error(err);
            const message = "An unexpected error occurred while preparing the image.";
            setError(message);
            toast({ variant: 'destructive', title: 'Error', description: message });
            setIsLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                decodeFromFile(file);
            } else {
                toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a valid image file.'});
            }
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };


    return (
        <div 
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-lg text-center min-h-[200px] cursor-pointer hover:border-primary transition-colors"
            onClick={triggerFileInput}
        >
            <Upload className="w-12 h-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Upload an Image</h3>
            <p className="mt-1 text-sm text-muted-foreground">Click here or drag and drop an image file.</p>
            <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
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
