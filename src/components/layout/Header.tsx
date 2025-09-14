
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Cpu, Menu, ChevronDown, View, Camera, Box, QrCode, Wand2, Crop, Minimize, Barcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

const mainNavLinks = [{ href: "/", label: "Home" }];
const toolsNavLinks = [
  { href: "/ar-viewer", label: "AR Viewer", icon: View },
  { href: "/capture-share", label: "Capture & Share", icon: Camera },
  { href: "/model-viewer", label: "Model Viewer", icon: Box },
  { href: "/qr-generator", label: "QR Generator", icon: QrCode },
  { href: "/barcode-generator", label: "Barcode Generator", icon: Barcode },
  { href: "/image-generator", label: "AI Image Generator", icon: Wand2 },
  { href: "/image-cropper", label: "Image Cropper", icon: Crop },
  { href: "/image-compressor", label: "Image Compressor", icon: Minimize },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Button asChild variant="ghost" className={cn(isActive ? "text-primary hover:text-primary" : "text-muted-foreground", "hover:text-foreground", "text-base")}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  const isToolsActive = toolsNavLinks.some((link) => pathname === link.href);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Toolkit</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
          {mainNavLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "text-base",
                  isToolsActive ? "text-primary hover:text-primary" : "text-muted-foreground",
                  "hover:text-foreground"
                )}
              >
                Tools
                <ChevronDown className="relative top-[1px] ml-1 h-4 w-4 transition duration-200 group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {toolsNavLinks.map((link) => (
                <Link key={link.href} href={link.href} passHref>
                   <DropdownMenuItem className={cn(pathname === link.href && "bg-accent")}>
                    <link.icon className="mr-2 h-4 w-4" />
                    {link.label}
                   </DropdownMenuItem>
                </Link>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="flex flex-1 items-center justify-end">
          <ThemeToggle />
          <div className="md:hidden ml-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col gap-4 p-4">
                  <Link href="/" className="flex items-center gap-2 mb-4">
                    <Cpu className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">AR Toolkit</span>
                  </Link>
                  {mainNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "text-lg",
                        pathname === link.href ? "text-primary font-semibold" : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Collapsible open={isMobileToolsOpen} onOpenChange={setIsMobileToolsOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-lg text-muted-foreground">
                      Tools
                      <ChevronDown className={cn("h-5 w-5 transition-transform", isMobileToolsOpen && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 flex flex-col gap-2 pl-4">
                      {toolsNavLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "text-base flex items-center",
                            pathname === link.href ? "text-primary font-semibold" : "text-muted-foreground"
                          )}
                        >
                          <link.icon className="mr-2 h-4 w-4" />
                          {link.label}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}