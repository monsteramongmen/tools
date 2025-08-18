// "use client";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import {
//   AlertTriangle,
//   Download,
//   Loader2,
//   RefreshCw,
//   Share2,
//   Wand2,
// } from "lucide-react";
// import { useState } from "react";

// // Updated API function to use your Next.js API route
// const generateImage = async (
//   model: string,
//   prompt: string,
//   n = 1,
//   size = "1024x1024"
// ) => {
//   try {
//     const response = await fetch("/api/generate-image", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ model, prompt, n, size }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.error || `Error ${response.status}`);
//     }

//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error("Image generation failed:", error);
//     throw error;
//   }
// };

// export default function ImageGeneratorView() {
//   const { toast } = useToast();
//   const [prompt, setPrompt] = useState("");
//   const [generatedImage, setGeneratedImage] = useState<string | null>(null);
//   const [selectedModel, setSelectedModel] = useState("img3");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const models = [
//     { id: "img3", name: "IMG3" },
//     { id: "img4", name: "IMG4" },
//     { id: "uncen", name: "Uncensored" },
//     { id: "qwen", name: "Qwen" },
//     { id: "gemini2.0", name: "Gemini 2.0" },
//   ];

//   // TypeScript-safe check for navigator.share
//   const canShare =
//     typeof navigator !== "undefined" &&
//     typeof navigator.share === "function" &&
//     typeof navigator.canShare === "function";

//   const handleGenerate = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!prompt) {
//       setError("Please enter a prompt.");
//       return;
//     }
//     setError(null);
//     setIsLoading(true);
//     setGeneratedImage(null);

//     try {
//       const result = await generateImage(selectedModel, prompt);
//       if (result && result.data && result.data.length > 0) {
//         setGeneratedImage(result.data[0].url);
//       } else {
//         throw new Error("Image generation failed to return a valid image.");
//       }
//     } catch (err) {
//       console.error(err);
//       const errorMessage =
//         err instanceof Error ? err.message : "An unknown error occurred.";
//       setError(`Failed to generate image. ${errorMessage}`);
//       toast({
//         variant: "destructive",
//         title: "Generation Error",
//         description: `Could not generate the image. ${errorMessage}`,
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleGenerateNew = () => {
//     setPrompt("");
//     setGeneratedImage(null);
//     setError(null);
//   };

//   const downloadImage = () => {
//     if (generatedImage) {
//       const a = document.createElement("a");
//       a.href = generatedImage;
//       const sanitizedPrompt = prompt
//         .substring(0, 50)
//         .replace(/[^a-z0-9]/gi, "_")
//         .toLowerCase();
//       a.download = `${sanitizedPrompt || "generated-image"}.png`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//     }
//   };

//   const shareImage = async () => {
//     if (!generatedImage) return;

//     try {
//       const response = await fetch(generatedImage);
//       const blob = await response.blob();
//       const file = new File([blob], `ai-image-${Date.now()}.png`, {
//         type: "image/png",
//       });

//       if (canShare && navigator.canShare({ files: [file] })) {
//         await navigator.share({
//           title: "AI Generated Image",
//           text: `Image generated from prompt: "${prompt}"`,
//           files: [file],
//         });
//       } else {
//         await navigator.clipboard.writeText(generatedImage);
//         toast({
//           title: "Link Copied",
//           description: "Image URL copied to clipboard.",
//         });
//       }
//     } catch (err) {
//       console.error("Error sharing image:", err);
//       toast({
//         variant: "destructive",
//         title: "Share Error",
//         description: "Could not share the image.",
//       });
//     }
//   };

//   return (
//     <Card>
//       <CardContent className="pt-6">
//         {!generatedImage && (
//           <form onSubmit={handleGenerate} className="flex flex-col gap-4 mb-6">
//             <Textarea
//               value={prompt}
//               onChange={(e) => setPrompt(e.target.value)}
//               placeholder='e.g., "A majestic lion in a field of wildflowers, photorealistic"'
//               className="flex-grow min-h-[100px]"
//               disabled={isLoading}
//             />

//             <div className="flex flex-col gap-2">
//               <label htmlFor="model-select" className="text-sm font-medium">
//                 Select Model:
//               </label>
//               <select
//                 id="model-select"
//                 value={selectedModel}
//                 onChange={(e) => setSelectedModel(e.target.value)}
//                 disabled={isLoading}
//                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 {models.map((model) => (
//                   <option key={model.id} value={model.id}>
//                     {model.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <Button type="submit" disabled={isLoading || !prompt}>
//               {isLoading ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 <Wand2 className="mr-2 h-4 w-4" />
//               )}
//               Generate
//             </Button>
//           </form>
//         )}

//         {error && <p className="text-destructive text-center mb-4">{error}</p>}

//         <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
//           {isLoading && (
//             <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 z-10">
//               <Loader2 className="w-8 h-8 animate-spin" />
//               <p className="mt-2 text-muted-foreground">Generating image...</p>
//             </div>
//           )}

//           {generatedImage ? (
//             <img
//               src={generatedImage}
//               alt={prompt}
//               className="w-full h-full object-contain transition-opacity duration-500 opacity-100"
//             />
//           ) : (
//             !isLoading && (
//               <div className="text-muted-foreground text-center p-4">
//                 <Wand2 className="w-16 h-16 mx-auto mb-4" />
//                 <p>Your generated image will appear here.</p>
//               </div>
//             )
//           )}

//           {error && !isLoading && !generatedImage && (
//             <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 z-10 text-destructive text-center p-4">
//               <AlertTriangle className="w-10 h-10 mb-2" />
//               <p className="font-semibold">Error Generating Image</p>
//               <p className="text-sm">{error}</p>
//             </div>
//           )}
//         </div>

//         {generatedImage && (
//           <div className="flex flex-wrap gap-4 justify-center mt-6">
//             <Button onClick={handleGenerateNew} variant="outline">
//               <RefreshCw className="mr-2 h-4 w-4" />
//               Generate New
//             </Button>
//             <Button onClick={downloadImage}>
//               <Download className="mr-2 h-4 w-4" />
//               Download
//             </Button>
//             {canShare && (
//               <Button onClick={shareImage} variant="outline">
//                 <Share2 className="mr-2 h-4 w-4" />
//                 Share
//               </Button>
//             )}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, RefreshCw, Share2, Wand2 } from "lucide-react";
import { useState } from "react";

const generateImage = async (
  model: string,
  prompt: string,
  n = 1,
  size = "1024x1024"
) => {
  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, prompt, n, size }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Error ${response.status}`);
  }

  const data = await response.json();
  return data;
};

export default function ImageGeneratorView() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState(
    [] as {
      model: string;
      modelName: string;
      url?: string;
      error?: string;
      loading: boolean;
    }[]
  );
  const [selectedModel, setSelectedModel] = useState("img3");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMultiple, setIsMultiple] = useState(false);
  const [numImages, setNumImages] = useState(1);

  const models = [
    { id: "img3", name: "IMG3" },
    { id: "img4", name: "IMG4" },
    { id: "uncen", name: "Uncensored" },
    { id: "qwen", name: "Qwen" },
    { id: "gemini2.0", name: "Gemini 2.0" },
  ];

  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function";

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError("Please enter a prompt.");
      return;
    }
    if (!isMultiple && (numImages < 1 || numImages > 4)) {
      setError(
        "Number of images must be between 1 and 4 for single model generation."
      );
      return;
    }
    setError(null);
    setIsLoading(true);

    if (isMultiple) {
      const initialPlaceholders = models.map((m) => ({
        model: m.id,
        modelName: m.name,
        loading: true,
      }));

      setGeneratedImages(initialPlaceholders);

      const promises = models.map(async (model) => {
        try {
          const result = await generateImage(model.id, prompt);
          if (result && result.data && result.data.length > 0) {
            setGeneratedImages((prev) =>
              prev.map((item) =>
                item.model === model.id
                  ? {
                      model: item.model,
                      modelName: item.modelName,
                      url: result.data[0].url,
                      loading: false,
                    }
                  : item
              )
            );
            return { success: true };
          } else {
            setGeneratedImages((prev) =>
              prev.filter((item) => item.model !== model.id)
            );
            return { success: false };
          }
        } catch (error) {
          setGeneratedImages((prev) =>
            prev.map((item) =>
              item.model === model.id
                ? {
                    model: item.model,
                    modelName: item.modelName,
                    error:
                      error instanceof Error ? error.message : String(error),
                    loading: false,
                  }
                : item
            )
          );
          return { success: false };
        }
      });

      const results = await Promise.all(promises);

      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;
      if (successCount > 0) {
        toast({
          title: "All operations complete",
          description: `Successfully generated ${successCount} image(s).${
            errorCount ? ` ${errorCount} failed.` : ""
          }`,
        });
      }
      setIsLoading(false);
    } else {
      const numToGenerate = numImages;
      const initialPlaceholders = Array.from(
        { length: numToGenerate },
        (_, i) => ({
          model: `${selectedModel}-${i}`,
          modelName:
            models.find((m) => m.id === selectedModel)?.name || selectedModel,
          loading: true,
        })
      );
      setGeneratedImages(initialPlaceholders);

      try {
        const result = await generateImage(selectedModel, prompt, numImages);
        if (result && result.data && result.data.length > 0) {
          const modelInfo = models.find((m) => m.id === selectedModel);
          const images = result.data.map((img: any, idx: number) => ({
            model: `${selectedModel}-${idx}`,
            modelName: modelInfo?.name || selectedModel,
            url: img.url,
            loading: false,
          }));
          setGeneratedImages(images);
          toast({
            title: "Generation Complete",
            description: `Successfully generated ${images.length} image(s).`,
          });
        } else {
          throw new Error("Image generation failed to return a valid image.");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred.";
        setGeneratedImages([
          {
            model: selectedModel,
            modelName:
              models.find((m) => m.id === selectedModel)?.name || selectedModel,
            error: "Image generation failed.",
            loading: false,
          },
        ]);
        setError(`Failed to generate image. ${errorMessage}`);
        toast({
          variant: "destructive",
          title: "Generation Error",
          description: `Could not generate the image. ${errorMessage}`,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGenerateNew = () => {
    setPrompt("");
    setGeneratedImages([]);
    setError(null);
    setIsMultiple(false);
    setSelectedModel("img3");
    setNumImages(1);
  };

  function downloadImage(url: string, modelName: string) {
    const sanitizedPrompt = prompt
      .substring(0, 30)
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    const filename = `${sanitizedPrompt || "generated-image"}_${modelName}.png`;
    // Open image url in new tab/window
    const newWindow = window.open(url, "_blank");
    if (newWindow) {
      newWindow.focus();
      const a = newWindow.document.createElement("a");
      a.href = url;
      a.download = filename;
      newWindow.document.body.appendChild(a);
      a.click();
      newWindow.document.body.removeChild(a);
    } else {
      // Popup blocked fallback
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  const shareImage = async (url: string, modelName: string) => {
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `ai-image-${modelName}-${Date.now()}.png`, {
        type: "image/png",
      });

      if (canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `AI Generated Image - ${modelName}`,
          text: `Image generated using ${modelName} from prompt: "${prompt}"`,
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: `${modelName} image URL copied to clipboard.`,
        });
      }
    } catch (err) {
      console.error("Error sharing image:", err);
      toast({
        variant: "destructive",
        title: "Share Error",
        description: "Could not share the image.",
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {generatedImages.length === 0 && (
          <form onSubmit={handleGenerate} className="flex flex-col gap-4 mb-6">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g., "A majestic lion in a field of wildflowers, photorealistic"'
              className="flex-grow min-h-[100px]"
              disabled={isLoading}
            />
            <div className="flex flex-row gap-4 items-center">
              <div className="flex flex-col flex-1">
                <label htmlFor="mode-select" className="text-sm font-medium">
                  Generation Mode:
                </label>
                <select
                  id="mode-select"
                  value={isMultiple ? "multiple" : "single"}
                  onChange={(e) => setIsMultiple(e.target.value === "multiple")}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="single">Single Model</option>
                  <option value="multiple">
                    Generate Multiple (All Models)
                  </option>
                </select>
              </div>

              {!isMultiple && (
                <div className="flex flex-col flex-1">
                  <label htmlFor="model-select" className="text-sm font-medium">
                    Select Model:
                  </label>
                  <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!isMultiple && (
                <div className="flex flex-col flex-1">
                  <label htmlFor="num-images" className="text-sm font-medium">
                    Number of Images
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    id="num-images"
                    value={numImages}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 1 && val <= 4) setNumImages(val);
                    }}
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              )}
            </div>

            <Button type="submit" disabled={isLoading || !prompt}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {isMultiple ? "Generate All" : "Generate"}
            </Button>
          </form>
        )}

        {error && <p className="text-destructive text-center mb-4">{error}</p>}

        {generatedImages.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map(
                ({ model, modelName, url, error, loading }) => {
                  if (error) {
                    return (
                      <div
                        key={model}
                        className="p-4 bg-muted text-destructive rounded"
                      >
                        <p className="text-center text-sm">
                          Error generating image for {modelName}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <Card key={model} className="overflow-hidden">
                      <div className="aspect-square relative flex items-center justify-center bg-muted">
                        {loading ? (
                          <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
                        ) : (
                          <img
                            src={url}
                            alt={`${modelName} generated image`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {modelName}
                          </span>
                          {url && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadImage(url!, modelName)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              {canShare && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => shareImage(url!, modelName)}
                                >
                                  <Share2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>

            {!isLoading && (
              <div className="flex justify-center mt-6">
                <Button onClick={handleGenerateNew} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate New
                </Button>
              </div>
            )}
          </div>
        )}

        {isLoading && generatedImages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-muted-foreground">
              {isMultiple
                ? `Generating images with ${models.length} models...`
                : "Generating image..."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
