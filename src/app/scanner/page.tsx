import ScannerView from "@/components/scanner/ScannerView";

export default function ScannerPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Barcode & QR Code Scanner</h1>
            <p className="text-muted-foreground mb-6">Scan barcodes using your camera or by uploading an image.</p>
            <ScannerView />
        </div>
    );
}