"use client";

import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, Download, PackageCheck, Image as ImageIcon, Check, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '../ui/checkbox';

interface CompressionResult {
    id: string;
    originalFile: File;
    originalUrl: string;
    compressedFile: File;
    compressedUrl: string;
    reduction: number;
}

export default function ImageCompressorView() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [originalFiles, setOriginalFiles] = useState<File[]>([]);
    const [results, setResults] = useState<CompressionResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Compression Options
    const [maxSizeMB, setMaxSizeMB] = useState(1);
    const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);
    const [useWebWorker, setUseWebWorker] = useState(true);
    const [initialQuality, setInitialQuality] = useState(0.7);
    const [alwaysKeepResolution, setAlwaysKeepResolution] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setOriginalFiles(Array.from(e.target.files));
            setResults([]);
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const handleCompress = async () => {
        if (originalFiles.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Files Selected',
                description: 'Please select one or more images to compress.',
            });
            return;
        }

        setIsLoading(true);
        setResults([]);

        const options = {
            maxSizeMB,
            maxWidthOrHeight,
            useWebWorker,
            initialQuality,
            alwaysKeepResolution,
        };

        try {
            const compressionPromises = originalFiles.map(async (file, index) => {
                const compressedFile = await imageCompression(file, options);
                const originalUrl = URL.createObjectURL(file);
                const compressedUrl = URL.createObjectURL(compressedFile);
                const reduction = 100 - (compressedFile.size / file.size) * 100;
                
                return {
                    id: `${file.name}-${index}`,
                    originalFile: file,
                    originalUrl,
                    compressedFile,
                    compressedUrl,
                    reduction,
                };
            });

            const compressedResults = await Promise.all(compressionPromises);
            setResults(compressedResults);
            
            toast({
                title: 'Compression Successful',
                description: `${compressedResults.length} image(s) have been compressed.`,
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Compression Error',
                description: 'An error occurred while compressing the images. Please check the console.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const downloadFile = (file: File) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = `compressed-${file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    };

    const downloadAllAsZip = async () => {
        if (results.length === 0) return;

        const zip = new JSZip();
        results.forEach(result => {
            zip.file(`compressed-${result.compressedFile.name}`, result.compressedFile);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `compressed-images-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    };

    const reset = () => {
        setOriginalFiles([]);
        setResults([]);
        setIsLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-1 sticky top-24">
                <CardHeader>
                    <CardTitle>Compression Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="maxSizeMB">Max Size (MB)</Label>
                        <Input id="maxSizeMB" type="number" value={maxSizeMB} onChange={e => setMaxSizeMB(Number(e.target.value))} step="0.1" min="0.01" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="maxWidthOrHeight">Max Width/Height (px)</Label>
                        <Input id="maxWidthOrHeight" type="number" value={maxWidthOrHeight} onChange={e => setMaxWidthOrHeight(Number(e.target.value))} step="10" min="1" />
                    </div>
                    <div className="space-y-3">
                        <Label>Quality: {Math.round(initialQuality * 100)}%</Label>
                        <Slider value={[initialQuality]} onValueChange={([val]) => setInitialQuality(val)} max={1} step={0.05} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="useWebWorker" checked={useWebWorker} onCheckedChange={checked => setUseWebWorker(Boolean(checked))} />
                        <Label htmlFor="useWebWorker" className="cursor-pointer">Use Web Worker</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="alwaysKeepResolution" checked={alwaysKeepResolution} onCheckedChange={checked => setAlwaysKeepResolution(Boolean(checked))} />
                        <Label htmlFor="alwaysKeepResolution" className="cursor-pointer">Keep Original Resolution</Label>
                    </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-lg text-center">
                            <UploadCloud className="w-12 h-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">Select Images to Compress</h3>
                            <p className="mt-1 text-sm text-muted-foreground">You can select multiple files at once.</p>
                            <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="hidden"
                            />
                        </div>
                        
                        {(originalFiles.length > 0) && (
                            <div className="mt-6">
                                <h4 className="font-semibold mb-2">Selected Files:</h4>
                                <ul className="text-sm text-muted-foreground list-disc pl-5">
                                    {originalFiles.map(f => <li key={f.name}>{f.name} ({formatBytes(f.size)})</li>)}
                                </ul>
                                <div className="mt-6 flex flex-wrap gap-4">
                                     <Button onClick={handleCompress} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Check className="mr-2" />}
                                        Compress {originalFiles.length} Image(s)
                                    </Button>
                                    <Button variant="outline" onClick={reset}>
                                        <RefreshCw className="mr-2" /> Start Over
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {isLoading && (
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                             <Loader2 className="w-12 h-12 animate-spin text-primary" />
                             <p className="mt-4 text-lg font-medium">Compressing images...</p>
                             <p className="text-muted-foreground">Please wait, this may take a moment.</p>
                        </CardContent>
                    </Card>
                )}

                {results.length > 0 && !isLoading && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Compression Results</CardTitle>
                            {results.length > 1 && (
                                <Button onClick={downloadAllAsZip} size="sm">
                                    <PackageCheck className="mr-2" />
                                    Download All (.zip)
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Original</TableHead>
                                        <TableHead>Compressed</TableHead>
                                        <TableHead className="text-right">Details</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map(r => (
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <img src={r.originalUrl} alt="Original" className="w-24 h-24 object-cover rounded-md" />
                                            </TableCell>
                                             <TableCell>
                                                <img src={r.compressedUrl} alt="Compressed" className="w-24 h-24 object-cover rounded-md" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <p className="font-medium">{formatBytes(r.originalFile.size)} → {formatBytes(r.compressedFile.size)}</p>
                                                <p className="text-sm text-green-600 dark:text-green-400 font-bold">{r.reduction.toFixed(2)}% reduction</p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => downloadFile(r.compressedFile)}>
                                                    <Download className="mr-2 h-4 w-4" /> Download
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
