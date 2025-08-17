import { ModelViewerComponent } from "@/components/model-viewer/ModelViewer";

export default function ModelViewerPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-[750px]">
            <h1 className="text-3xl font-bold mb-2">3D Model Viewer</h1>
            <p className="text-muted-foreground mb-6">Load a 3D model from a URL to view and interact with it.</p>
            <ModelViewerComponent />
        </div>
    );
}
