"use client";

import { useState, useRef } from 'react';
import bwipjs, { ToCanvasOptions, ToSvgOptions } from 'bwip-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Download, Share2, Palette, Text, Minimize, Settings, AlertCircle, Wand2, RefreshCw } from 'lucide-react';

const supportedBarcodeTypes = [
    'code128', 'ean13', 'ean8', 'upca', 'upce', 'isbn', 'gs1-128', 'qrcode',
    'pdf417', 'datamatrix', 'azteccode', 'pharmacode', 'postnet', 'planet',
    'industrial2of5', 'interleaved2of5', 'itf14', 'telepen', 'code39', 'codabar'
];

const fontOptions = ['Helvetica', 'Arial', 'Courier', 'Times'];

type DownloadFormat = 'png' | 'svg';

const defaultOptions: ToCanvasOptions = {
    bcid: 'code128',
    text: '1234567890',
    scale: 3,
    scaleX: undefined,
    scaleY: undefined,
    height: 10,
    includetext: true,
    textxalign: 'center',
    barcolor: '000000',
    backgroundcolor: 'FFFFFF',
    padding: 10,
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

    const handleOptionChange = (key: keyof ToCanvasOptions, value: any) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerate = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            try {
                // bwip-js treats `text` as required.
                if (!options.text) {
                    setError("Text to encode cannot be empty.");
                    // Clear the canvas
                    const ctx = canvas.getContext('2d');
                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    canvas.width = 0; // Collapse canvas
                    canvas.height = 0;
                    setHasGenerated(false);
                    return;
                }

                bwipjs.toCanvas(canvas, options);
                setError(null);
                setHasGenerated(true);
            } catch (e: any) {
                console.error('Barcode generation error:', e);
                const friendlyMessage = e.message || 'Invalid options for the selected barcode type.';
                setError(friendlyMessage);
                setHasGenerated(false);
            }
        }
    };
    
    const handleReset = () => {
        const canvas = canvasRef.current;
        setOptions(defaultOptions);
        setError(null);
        setHasGenerated(false);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 0;
            canvas.height = 0;
        }
    }

    const downloadBarcode = () => {
        if (!hasGenerated || error) {
             toast({
                variant: 'destructive',
                title: 'Cannot Download',
                description: error || 'Please generate a valid barcode first.'
            });
            return;
        }

        if (downloadFormat === 'png') {
            const canvas = canvasRef.current;
            if (canvas) {
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = `${options.bcid}-${options.text}.png`;
                a.click();
            }
        } else if (downloadFormat === 'svg') {
            try {
                const svgString = bwipjs.toSVG(options as ToSvgOptions);
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
                    <div className="space-y-2">
                        <Label htmlFor="text">Text to Encode</Label>
                        <Input id="text" value={options.text as string} onChange={e => handleOptionChange('text', e.target.value)} />
                    </div>

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
                        <AccordionItem value="item-2">
                            <AccordionTrigger><Minimize className="mr-2"/>Size & Padding</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="scale">Scale</Label>
                                    <Input id="scale" type="number" value={options.scale} min={1} max={10} onChange={e => handleOptionChange('scale', Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="height">Height (px)</Label>
                                    <Input id="height" type="number" value={options.height} min={1} max={50} onChange={e => handleOptionChange('height', Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="padding">Padding</Label>
                                    <Input id="padding" type="number" value={options.padding as number} min={0} max={50} onChange={e => handleOptionChange('padding', Number(e.target.value))} />
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

                    <div className="flex gap-2 w-full mt-4">
                         <Button onClick={handleGenerate} className="flex-1">
                            <Wand2 className="mr-2" /> Generate
                        </Button>
                         <Button onClick={handleReset} variant="outline">
                            <RefreshCw className="mr-2" /> Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Barcode Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[250px] bg-muted rounded-lg p-4">
                        <div className="overflow-auto w-full flex justify-center">
                            <canvas ref={canvasRef} />
                        </div>
                         {error && (
                            <div className="text-destructive text-center p-4 rounded-md bg-destructive/10 flex flex-col items-center gap-2 mt-4">
                                <AlertCircle className="w-8 h-8" />
                                <p className="font-semibold">Generation Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        {!hasGenerated && !error && (
                            <div className="text-muted-foreground text-center">
                                <p>Your generated barcode will appear here.</p>
                            </div>
                        )}
                        
                        {hasGenerated && !error && (
                             <div className="flex flex-wrap gap-4 justify-center mt-6 pt-6 border-t border-border w-full">
                                <div className="flex items-center gap-2">
                                    <Select value={downloadFormat} onValueChange={(v: DownloadFormat) => setDownloadFormat(v)}>
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="png">PNG</SelectItem>
                                            <SelectItem value="svg">SVG</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={downloadBarcode}>
                                        <Download className="mr-2" /> Download
                                    </Button>
                                </div>
                                {navigator.share && (
                                    <Button variant="outline" onClick={shareBarcode}>
                                        <Share2 className="mr-2" /> Share
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
