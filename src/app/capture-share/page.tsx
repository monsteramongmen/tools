import CaptureView from "@/components/capture/CaptureView";

export default function CaptureSharePage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">Capture & Share</h1>
            <p className="text-muted-foreground mb-6">Take a snapshot and share it with your friends.</p>
            <CaptureView />
        </div>
    );
}
