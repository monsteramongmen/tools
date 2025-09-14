import BarcodeGeneratorView from "@/components/barcode-generator/BarcodeGeneratorView";

export default function BarcodeGeneratorPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-2">Barcode Generator</h1>
            <p className="text-muted-foreground mb-6">Create highly customizable barcodes for any purpose.</p>
            <BarcodeGeneratorView />
        </div>
    );
}