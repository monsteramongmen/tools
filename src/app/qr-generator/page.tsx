import QrGeneratorView from "@/components/qr-generator/QrGeneratorView";

export default function QrGeneratorPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">QR Code Generator</h1>
            <p className="text-muted-foreground mb-6">Create a QR code for a URL, text, or other data.</p>
            <QrGeneratorView />
        </div>
    );
}
