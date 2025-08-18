"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw, Loader2, Wand2, AlertTriangle, Share2 } from 'lucide-react';
import { generateImage } from '@/ai/flows/generate-image-flow';

export default function ImageGeneratorView() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const result = await generateImage({ prompt });
      if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);
      } else {
        throw new Error('Image generation failed to return a valid image.');
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate image. ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Generation Error',
        description: `Could not generate the image. ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNew = () => {
    setPrompt('');
    setGeneratedImage(null);
    setError(null);
  };

  const downloadImage = () => {
    if (generatedImage) {
      const a = document.createElement('a');
      a.href = generatedImage;
      const sanitizedPrompt = prompt.substring(0, 50).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${sanitizedPrompt || 'generated-image'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const shareImage = async () => {
    if (!generatedImage) return;

    try {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], `ai-image-${Date.now()}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'AI Generated Image',
                text: `Image generated from prompt: "${prompt}"`,
                files: [file],
            });
        } else {
            // Fallback for browsers that don't support sharing files
            navigator.clipboard.writeText(generatedImage);
            toast({
                title: 'Link Copied',
                description: 'Image data URL copied to clipboard.',
            });
        }
    } catch (err) {
        console.error('Error sharing image:', err);
        toast({
            variant: 'destructive',
            title: 'Share Error',
            description: 'Could not share the image.',
        });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {!generatedImage && (
            <form onSubmit={handleGenerate} className="flex flex-col gap-4 mb-6">
            <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g., "A majestic lion in a field of wildflowers, photorealistic"'
                className="flex-grow min-h-[100px]"
                disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !prompt}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate
            </Button>
            </form>
        )}

        {error && <p className="text-destructive text-center mb-4">{error}</p>}

        <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="mt-2 text-muted-foreground">Generating image...</p>
            </div>
          )}

          {generatedImage ? (
            <img src={generatedImage} alt={prompt} className="w-full h-full object-contain transition-opacity duration-500 opacity-100" />
          ) : (
            !isLoading && (
                <div className="text-muted-foreground text-center p-4">
                    <Wand2 className="w-16 h-16 mx-auto mb-4" />
                    <p>Your generated image will appear here.</p>
                </div>
            )
          )}
           {error && !isLoading && !generatedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 z-10 text-destructive text-center p-4">
              <AlertTriangle className="w-10 h-10 mb-2" />
              <p className="font-semibold">Error Generating Image</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {generatedImage && (
          <div className="flex flex-wrap gap-4 justify-center mt-6">
            <Button onClick={handleGenerateNew} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate New
            </Button>
            <Button onClick={downloadImage}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {navigator.share && (
                <Button onClick={shareImage} variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
