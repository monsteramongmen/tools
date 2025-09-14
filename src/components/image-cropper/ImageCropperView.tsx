"use client";

import { useState, useRef } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  UploadCloud,
  Link as LinkIcon,
  Download,
  Loader2,
  AlertTriangle,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Eye,
} from "lucide-react";


// This is a more robust helper function for cropping and transforming the image.
async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<{ file: File, dataUrl: string }> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const realCropWidth = crop.width * scaleX;
  const realCropHeight = crop.height * scaleY;

  // Set canvas to the final crop size
  canvas.width = realCropWidth;
  canvas.height = realCropHeight;

  ctx.translate(realCropWidth / 2, realCropHeight / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  if (flip.horizontal) ctx.scale(-1, 1);
  if (flip.vertical) ctx.scale(1, -1);
  ctx.translate(-realCropWidth / 2, -realCropHeight / 2);

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    realCropWidth,
    realCropHeight,
    0,
    0,
    realCropWidth,
    realCropHeight
  );

  const dataUrl = canvas.toDataURL("image/png");

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      const file = new File([blob], fileName, { type: "image/png" });
      resolve({ file, dataUrl });
    }, "image/png");
  });
}


export default function ImageCropperView() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [imgSrc, setImgSrc] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const [cropShape, setCropShape] = useState<"rect" | "circle">("rect");
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');


  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
      setError(null);
      setIsLoading(false);
    }
  }

  function handleLoadUrl() {
    if (inputUrl) {
      setIsLoading(true);
      setError(null);
      // Use a proxy to avoid CORS issues if necessary, or just fetch directly.
      // For simplicity, we assume direct loading is fine.
      // A more robust solution might need a server-side proxy.
      setImgSrc(inputUrl);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    setIsLoading(false);
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height), width, height));
    }
  }

  async function handlePreview() {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      toast({
        variant: "destructive",
        title: "Crop Error",
        description: "Please select a crop area first.",
      });
      return;
    }

    try {
      const { dataUrl } = await getCroppedImg(
        image,
        completedCrop,
        `cropped-image-${Date.now()}.png`,
        rotation,
        flip,
      );
      setPreviewUrl(dataUrl);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate preview.",
      });
    }
  }

  async function handleDownload() {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      toast({
        variant: "destructive",
        title: "Crop Error",
        description: "Please select a crop area first.",
      });
      return;
    }

    try {
      const { file } = await getCroppedImg(
        image,
        completedCrop,
        `cropped-image-${Date.now()}.png`,
        rotation,
        flip
      );
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create cropped image.",
      });
    }
  }

  const handleAspectChange = (value: string) => {
    const newAspect = value === "free" ? undefined : parseFloat(value);
    setAspect(newAspect);
    if (imgRef.current && newAspect) {
        const { width, height } = imgRef.current;
        setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, newAspect, width, height), width, height));
    }
  }
  
  const rotateRight = () => setRotation((r) => r + 90);
  const rotateLeft = () => setRotation((r) => r - 90);
  const flipHorizontal = () => setFlip(f => ({ ...f, horizontal: !f.horizontal }));
  const flipVertical = () => setFlip(f => ({ ...f, vertical: !f.vertical }));

  return (
    <Card>
      <CardContent className="pt-6">
        {!imgSrc && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter image URL"
                className="flex-grow"
              />
              <Button onClick={handleLoadUrl} disabled={isLoading || !inputUrl}>
                {isLoading ? <Loader2 className="animate-spin" /> : <LinkIcon />}
                Load from URL
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <hr className="flex-grow border-border" />
              <span className="text-muted-foreground text-sm">OR</span>
              <hr className="flex-grow border-border" />
            </div>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload from Device
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        )}

        {error && (
            <div className="my-4 flex flex-col items-center justify-center text-destructive text-center p-4 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-10 h-10 mb-2" />
                <p className="font-semibold">Error Loading Image</p>
                <p className="text-sm">{error}</p>
            </div>
        )}
        
        {imgSrc && (
          <div className="space-y-6">
            <div className="max-w-full mx-auto overflow-hidden bg-muted p-4 rounded-lg flex justify-center items-center min-h-[300px]">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                circularCrop={cropShape === 'circle'}
                className="max-w-full max-h-[70vh]"
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  crossOrigin="anonymous"
                  style={{ 
                      transform: `scaleX(${flip.horizontal ? -1 : 1}) scaleY(${flip.vertical ? -1 : 1}) rotate(${rotation}deg)`,
                      maxHeight: '70vh'
                  }}
                  onLoad={onImageLoad}
                  onError={() => {
                    setError("Failed to load the image from the URL. Please check the link and ensure it's a valid, accessible image.");
                    setImgSrc("");
                    setIsLoading(false);
                  }}
                />
              </ReactCrop>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                  <Label>Crop Shape</Label>
                  <RadioGroup value={cropShape} onValueChange={(v: "rect" | "circle") => setCropShape(v)} className="flex gap-4">
                      <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="rect" />Rectangle</Label>
                      <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="circle" />Circle</Label>
                  </RadioGroup>
              </div>
              <div className="space-y-3">
                  <Label>Aspect Ratio</Label>
                  <RadioGroup value={aspect?.toString() || 'free'} onValueChange={handleAspectChange} className="flex flex-wrap gap-4">
                      <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="free" />Free</Label>
                      <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value={(1 / 1).toString()} />1:1</Label>
                      <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value={(4 / 3).toString()} />4:3</Label>
                      <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value={(16 / 9).toString()} />16:9</Label>
                  </RadioGroup>
              </div>
               <div className="space-y-3">
                  <Label>Transform</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={rotateLeft}><RotateCcw/>Left</Button>
                    <Button variant="outline" size="sm" onClick={rotateRight}><RotateCw/>Right</Button>
                    <Button variant="outline" size="sm" onClick={flipHorizontal}><FlipHorizontal/></Button>
                    <Button variant="outline" size="sm" onClick={flipVertical}><FlipVertical/></Button>
                  </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
              <Button
                onClick={() => {
                  setImgSrc("");
                  setInputUrl("");
                  setError(null);
                }}
                variant="outline"
              >
                Choose Another Image
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" onClick={handlePreview} disabled={!completedCrop}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Cropped Image Preview</DialogTitle>
                    </DialogHeader>
                    {previewUrl ? (
                        <img src={previewUrl} alt="Cropped Preview" className="mx-auto max-w-full max-h-[60vh]"/>
                    ) : (
                        <p>Could not generate preview.</p>
                    )}
                </DialogContent>
              </Dialog>
              <Button onClick={handleDownload} disabled={!completedCrop}>
                <Download className="mr-2 h-4 w-4" />
                Download Cropped Image
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
