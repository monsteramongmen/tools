import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, View, Box, QrCode, Wand2 } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Toolkit</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Your modern, mobile-responsive web app for Augmented Reality experiences and media capture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="items-center text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <View className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">AR Viewer</CardTitle>
            <CardDescription>
              Experience marker-based augmented reality. Render videos or 3D models into your world.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/ar-viewer">Launch AR Viewer</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="items-center text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Capture & Share</CardTitle>
            <CardDescription>
              Use your device's camera to take high-quality snapshots and share them with the world.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/capture-share">Open Camera</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="items-center text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Box className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Model Viewer</CardTitle>
            <CardDescription>
              View and interact with 3D models in GLB or GLTF format directly in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/model-viewer">Open Viewer</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="items-center text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">QR Code Generator</CardTitle>
            <CardDescription>
              Create and share QR codes for URLs, text, and more. Instantly scannable.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/qr-generator">Create QR Code</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="items-center text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Wand2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">AI Image Generator</CardTitle>
            <CardDescription>
              Create stunning and unique images from a simple text description using AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/image-generator">Generate Images</Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
