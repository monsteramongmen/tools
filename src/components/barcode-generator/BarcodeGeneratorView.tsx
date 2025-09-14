"use client";

import { useState, useRef } from 'react';
import bwipjs, { ToCanvasOptions, ToSvgOptions } from 'bwip-js';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Download, Share2, Palette, Text, Settings, AlertCircle, Wand2, RefreshCw, Loader2, PackageCheck, FileJson, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';

const supportedBarcodeTypes = [
    'code128', 'ean13', 'ean8', 'upca', 'upce', 'isbn', 'gs1-128', 'qrcode',
    'pdf417', 'datamatrix', 'azteccode', 'pharmacode', 'postnet', 'planet',
    'industrial2of5', 'interleaved2of5', 'itf14', 'telepen', 'code39', 'codabar'
];

const twoDBarcodeTypes = ['qrcode', 'pdf417', 'datamatrix', 'azteccode'];

const fontOptions = ['Helvetica', 'Arial', 'Courier', 'Times'];

type DownloadFormat = 'png' | 'svg';

type BulkBarcode = {
    id: string;
    data: string;
    url: string;
    filename: string;
}

const defaultOptions: ToCanvasOptions = {
    bcid: 'code128',
    text: '1234567890',
    scale: 3,
    height: 10,
    padding: 10,
    includetext: true,
    textxalign: 'center',
    barcolor: '000000',
    backgroundcolor: 'FFFFFF',
    textsize: 12,
    textfont: 'Helvetica',
    textyalign: 'below',
    rotate: 'N',
    addon: '',
};

export default function BarcodeGeneratorView() {
    const { toast } = useToast();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [options, setOptions] = useState<ToCanvasOptions>(defaultOptions);
    const [error, setError] = useState<string | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('png');
    const [isLoading, setIsLoading] = useState(false);
    
    const [mode, setMode] = useState<'single' | 'bulk'>('single');
    const [bulkJson, setBulkJson] = useState('');
    const [bulkBarcodes, setBulkBarcodes] = useState<BulkBarcode[]>([]);

    const handleOptionChange = (key: keyof ToCanvasOptions, value: any) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const generateSingle = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setHasGenerated(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.width = 0;
                canvas.height = 0;
            }

            try {
                if (!options.text) {
                    setError("Text to encode cannot be empty.");
                    return;
                }
                
                const generationOptions = { ...options };
                if (twoDBarcodeTypes.includes(generationOptions.bcid)) {
                    // @ts-ignore
                    delete generationOptions.height; 
                    generationOptions.padding = 1;
                }

                bwipjs.toCanvas(canvas, generationOptions);
                setError(null);
                setHasGenerated(true);
            } catch (e: any) {
                console.error('Barcode generation error:', e);
                const friendlyMessage = e.message || 'Invalid options for the selected barcode type.';
                setError(friendlyMessage);
            }
        }
    }

    const generateBulk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkJson) {
            setError('Please enter a valid JSON array.');
            return;
        }
        setError('');
        setIsLoading(true);
        setBulkBarcodes([]);

        try {
            const data = JSON.parse(bulkJson);
            if (!Array.isArray(data)) {
                throw new Error('Input is not a JSON array.');
            }

            const generationPromises = data.map(async (item: any, index: number) => {
                const dataString = typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item);
                
                const generationOptions: ToSvgOptions = {
                    ...options,
                    text: dataString,
                    scale: 2, // Use a smaller scale for bulk previews
                };

                if (twoDBarcodeTypes.includes(generationOptions.bcid)) {
                    // @ts-ignore
                    delete generationOptions.height;
                }
                
                const svgString = bwipjs.toSVG(generationOptions);
                const url = `data:image/svg+xml;base64,${btoa(svgString)}`;

                let filename = `barcode_${index + 1}`;
                if (typeof item === 'object' && item !== null && Object.keys(item).length > 0) {
                    const firstKey = Object.keys(item)[0];
                    const firstValue = item[firstKey];
                    filename = String(firstValue).substring(0, 50).replace(/[^a-z0-9]/gi, '_').toLowerCase();
                } else if (typeof item === 'string') {
                    filename = item.substring(0, 50).replace(/[^a-z0-9]/gi, '_').toLowerCase();
                }

                return { id: `barcode-${index}-${Date.now()}`, data: dataString, url, filename: `${filename}.png` };
            });

            const generatedCodes = await Promise.all(generationPromises);
            setBulkBarcodes(generatedCodes);
            setHasGenerated(true);

        } catch (err: any) {
            const errorMessage = err.message || 'An unknown error occurred.';
            setError(`Failed to process JSON. ${errorMessage}`);
            toast({
                variant: 'destructive',
                title: 'Bulk Generation Error',
                description: `Could not generate barcodes from the provided JSON. ${errorMessage}`,
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleReset = () => {
        window.location.reload();
    }

    const downloadBarcode = (format: DownloadFormat) => {
        if (!hasGenerated || error) {
             toast({
                variant: 'destructive',
                title: 'Cannot Download',
                description: error || 'Please generate a valid barcode first.'
            });
            return;
        }

        if (format === 'png') {
            const canvas = canvasRef.current;
            if (canvas) {
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = `${options.bcid}-${options.text}.png`;
                a.click();
            }
        } else if (format === 'svg') {
            try {
                 const generationOptions = { ...options };
                if (twoDBarcodeTypes.includes(generationOptions.bcid)) {
                    // @ts-ignore
                    delete generationOptions.height;
                     generationOptions.padding = 1;
                }
                const svgString = bwipjs.toSVG(generationOptions as ToSvgOptions);
                const blob = new Blob([svgString], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${options.bcid}-${options.text}.svg`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (e: any) {
                 toast({
                    variant: 'destructive',
                    title: 'SVG Generation Error',
                    description: e.message || 'Could not generate SVG.'
                });
            }
        }
    };
    
    const downloadAllAsZip = async () => {
        if (bulkBarcodes.length === 0) return;

        const zip = new JSZip();
        
        const filePromises = bulkBarcodes.map(async (barcode) => {
            const generationOptions: ToCanvasOptions = {
                ...options,
                text: barcode.data,
                scale: 5, // Higher scale for better quality download
            };
             if (twoDBarcodeTypes.includes(generationOptions.bcid)) {
                // @ts-ignore
                delete generationOptions.height;
            }

            const tempCanvas = document.createElement('canvas');
            bwipjs.toCanvas(tempCanvas, generationOptions);
            const blob: Blob | null = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));
            if(blob) {
                zip.file(barcode.filename, blob);
            }
        });

        await Promise.all(filePromises);

        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `barcodes-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    };
    
    const shareBarcode = async () => {
        const canvas = canvasRef.current;
        if (canvas && hasGenerated && !error && navigator.share) {
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const file = new File([blob], `${options.bcid}-${options.text}.png`, { type: 'image/png' });
                     if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                files: [file],
                                title: 'Barcode',
                                text: `Barcode for: ${options.text}`,
                            });
                        } catch (err) {
                             console.error('Share failed:', err);
                             toast({ variant: 'destructive', title: 'Share Failed', description: 'Could not share the barcode.' });
                        }
                    } else {
                         toast({ variant: 'destructive', title: 'Cannot Share', description: 'Your browser does not support sharing this file.' });
                    }
                }
            }, 'image/png');
        } else {
             toast({ title: 'Share not available', description: 'Web Share API not supported or no valid barcode has been generated.'});
        }
    }
    
    const handleTabChange = (value: string) => {
        setMode(value as 'single' | 'bulk');
        setError('');
        setHasGenerated(false);
        setBulkBarcodes([]);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0,0,canvasRef.current.width, canvasRef.current.height);
        }
    }


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Barcode Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="bcid">Barcode Type</Label>
                        <Select value={options.bcid} onValueChange={(v) => handleOptionChange('bcid', v)}>
                            <SelectTrigger id="bcid"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {supportedBarcodeTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <Tabs value={mode} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                             <TabsTrigger value="single"><Package className="mr-2" />Single</TabsTrigger>
                             <TabsTrigger value="bulk"><FileJson className="mr-2" />Bulk</TabsTrigger>
                        </TabsList>
                        <TabsContent value="single" className="pt-4">
                            <form onSubmit={generateSingle} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="text">Text to Encode</Label>
                                    <Input id="text" value={options.text as string} onChange={e => handleOptionChange('text', e.target.value)} />
                                </div>
                                <Button type="submit" className="w-full">
                                    <Wand2 className="mr-2" /> Generate Single Barcode
                                </Button>
                            </form>
                        </TabsContent>
                        <TabsContent value="bulk" className="pt-4">
                            <form onSubmit={generateBulk} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bulk-json">JSON Array</Label>
                                    <Textarea 
                                        id="bulk-json"
                                        value={bulkJson}
                                        onChange={(e) => setBulkJson(e.target.value)}
                                        placeholder='["Product A", "Product B", {"id": 123}]'
                                        className="min-h-[120px] font-mono text-sm"
                                    />
                                </div>
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                                    Generate from JSON
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                    
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger><Palette className="mr-2"/>Colors</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="barcolor">Bar Color</Label>
                                    <div className="flex items-center gap-2">
                                        <Input type="color" value={`#${options.barcolor}`} onChange={(e) => handleOptionChange('barcolor', e.target.value.substring(1))} className="p-1 h-10 w-14" />
                                        <Input id="barcolor" value={options.barcolor as string} onChange={e => handleOptionChange('barcolor', e.target.value.replace('#', ''))} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="backgroundcolor">Background Color</Label>
                                    <div className="flex items-center gap-2">
                                        <Input type="color" value={`#${options.backgroundcolor}`} onChange={(e) => handleOptionChange('backgroundcolor', e.target.value.substring(1))} className="p-1 h-10 w-14" />
                                        <Input id="backgroundcolor" value={options.backgroundcolor as string} onChange={e => handleOptionChange('backgroundcolor', e.target.value.replace('#', ''))} />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger><Text className="mr-2"/>Text Options</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="includetext" checked={options.includetext} onCheckedChange={(c) => handleOptionChange('includetext', c)} />
                                    <Label htmlFor="includetext">Include Human-Readable Text</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="textsize">Text Size</Label>
                                    <Input id="textsize" type="number" value={options.textsize as number} min={5} max={30} onChange={e => handleOptionChange('textsize', Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="textfont">Text Font</Label>
                                    <Select value={options.textfont as string} onValueChange={(v) => handleOptionChange('textfont', v)}>
                                        <SelectTrigger id="textfont"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {fontOptions.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="textxalign">Text Horizontal Align</Label>
                                    <Select value={options.textxalign as string} onValueChange={(v) => handleOptionChange('textxalign', v)}>
                                        <SelectTrigger id="textxalign"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="center">Center</SelectItem>
                                            <SelectItem value="left">Left</SelectItem>
                                            <SelectItem value="right">Right</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="textyalign">Text Vertical Align</Label>
                                    <Select value={options.textyalign as string} onValueChange={(v) => handleOptionChange('textyalign', v)}>
                                        <SelectTrigger id="textyalign"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="below">Below</SelectItem>
                                            <SelectItem value="above">Above</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger><Settings className="mr-2"/>Advanced</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rotate">Rotation</Label>
                                    <Select value={options.rotate as string} onValueChange={(v) => handleOptionChange('rotate', v)}>
                                        <SelectTrigger id="rotate"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="N">Normal (0°)</SelectItem>
                                            <SelectItem value="R">Right (90°)</SelectItem>
                                            <SelectItem value="L">Left (-90°)</SelectItem>
                                            <SelectItem value="I">Inverted (180°)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="addon">EAN/UPC Addon</Label>
                                    <Input id="addon" value={options.addon as string} onChange={e => handleOptionChange('addon', e.target.value)} placeholder="2 or 5 digit addon"/>
                                    <p className="text-xs text-muted-foreground">Only for EAN/UPC barcodes. Enter 2 or 5 digits.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <Button onClick={handleReset} variant="outline" className="w-full mt-4">
                        <RefreshCw className="mr-2" /> Reset All Options
                    </Button>
                </CardContent>
            </Card>

            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[250px] bg-muted rounded-lg p-4">
                         {error && (
                            <div className="text-destructive text-center p-4 rounded-md bg-destructive/10 flex flex-col items-center gap-2 mt-4">
                                <AlertCircle className="w-8 h-8" />
                                <p className="font-semibold">Generation Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        {!hasGenerated && !error && (
                            <div className="text-muted-foreground text-center">
                                <p>Your generated barcode(s) will appear here.</p>
                            </div>
                        )}
                        
                        {hasGenerated && !error && mode === 'single' && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="overflow-auto w-full flex justify-center p-2 border bg-white rounded-md">
                                    <canvas ref={canvasRef} />
                                </div>
                                <div className="flex flex-wrap gap-4 justify-center pt-4 border-t border-border w-full">
                                    <div className="flex items-center gap-2">
                                        <Select value={downloadFormat} onValueChange={(v: DownloadFormat) => setDownloadFormat(v)}>
                                            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="png">PNG</SelectItem>
                                                <SelectItem value="svg">SVG</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={() => downloadBarcode(downloadFormat)}>
                                            <Download className="mr-2" /> Download
                                        </Button>
                                    </div>
                                    {navigator.share && (
                                        <Button variant="outline" onClick={shareBarcode}>
                                            <Share2 className="mr-2" /> Share
                                        </Button>
                                    )}
                                </div>
                             </div>
                        )}

                        {hasGenerated && !error && mode === 'bulk' && (
                             <div className="flex flex-col items-center gap-6 w-full">
                                <Button onClick={downloadAllAsZip} variant="default" size="lg">
                                    <PackageCheck className="mr-2 h-5 w-5" /> Download All as .zip
                                </Button>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                                    {bulkBarcodes.map((qr) => (
                                        <div key={qr.id} className="flex flex-col items-center gap-2 p-3 border rounded-lg bg-card">
                                            <div className="p-2 bg-white rounded-md border w-full">
                                                <img src={qr.url} alt="Generated Barcode" className="w-full h-auto aspect-square" />
                                            </div>
                                            <p className="text-xs text-muted-foreground w-full truncate text-center" title={qr.data}>{qr.data}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}