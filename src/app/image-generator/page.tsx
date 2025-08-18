import ImageGeneratorView from "@/components/image-generator/ImageGeneratorView";

export default function ImageGeneratorPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">AI Image Generator</h1>
            <p className="text-muted-foreground mb-6">Create stunning images from a text prompt using AI.</p>
            <ImageGeneratorView />
        </div>
    );
}
