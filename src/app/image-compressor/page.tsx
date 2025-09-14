import ImageCompressorView from "@/components/image-compressor/ImageCompressorView";

export default function ImageCompressorPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-bold mb-2">Image Compressor</h1>
            <p className="text-muted-foreground mb-6">Select an image, choose your compression settings, and instantly reduce the file size.</p>
            <ImageCompressorView />
        </div>
    );
}
