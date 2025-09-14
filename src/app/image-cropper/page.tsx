import ImageCropperView from "@/components/image-cropper/ImageCropperView";

export default function ImageCropperPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-bold mb-2">Image Cropper</h1>
            <p className="text-muted-foreground mb-6">Upload an image, crop it to your liking, and download the result.</p>
            <ImageCropperView />
        </div>
    );
}
