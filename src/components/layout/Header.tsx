
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Cpu, Menu, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const toolLinks = [
  { href: "/ar-viewer", label: "AR Viewer" },
  { href: "/capture-share", label: "Capture & Share" },
  { href: "/model-viewer", label: "Model Viewer" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">AR Toolkit</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
          <Link href="/" passHref>
            <Button
              variant="ghost"
              className={cn(
                "text-base",
                pathname === "/" ? "text-primary hover:text-primary" : "text-muted-foreground"
              )}
            >
              Home
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                 className={cn(
                  "text-base",
                  toolLinks.some(link => pathname.startsWith(link.href)) ? "text-primary hover:text-primary" : "text-muted-foreground"
                )}
              >
                Tools
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {toolLinks.map((link) => (
                 <DropdownMenuItem key={link.href} asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        "w-full justify-start",
                        pathname === link.href ? "text-primary font-semibold" : ""
                      )}
                    >
                      {link.label}
                    </Link>
                 </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="flex flex-1 items-center justify-end md:hidden">
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
                <Link
                    href="/"
                    className={cn(
                      "text-lg",
                      pathname === "/" ? "text-primary font-semibold" : "text-muted-foreground"
                    )}
                  >
                    Home
                </Link>
                <div className="pl-4">
                    <h3 className="mb-2 text-lg font-semibold">Tools</h3>
                    {toolLinks.map((link) => (
                       <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "block py-1 text-lg",
                            pathname === link.href ? "text-primary font-semibold" : "text-muted-foreground"
                          )}
                        >
                          {link.label}
                       </Link>
                    ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
