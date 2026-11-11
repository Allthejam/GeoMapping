'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  BookOpen, 
  RotateCcw,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FlipBookViewerProps {
  children: React.ReactNode[];
  onPageChange?: (page: number) => void;
  className?: string;
}

/**
 * @fileOverview Surveyor 3D Digital Flipbook Viewer.
 * Uses PageFlip engine with realistic page curling, shadows, tablet drag/swipe,
 * and dual/single page responsive modes.
 */
export function FlipBookViewer({ children, onPageChange, className }: FlipBookViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const pageFlipInstance = useRef<any>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(children.length);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTotalPages(children.length);
  }, [children.length]);

  useEffect(() => {
    let flip: any = null;

    const initFlip = async () => {
      if (!bookRef.current || typeof window === 'undefined') return;

      try {
        const { PageFlip } = await import('page-flip');

        // Clean up previous instance if any
        if (pageFlipInstance.current) {
          try { pageFlipInstance.current.destroy(); } catch (e) {}
        }

        // Set realistic A4 aspect ratio (210mm x 297mm -> approx 550 x 780 per page)
        const isMobile = window.innerWidth < 768;
        const pageWidth = isMobile ? Math.min(window.innerWidth - 32, 420) : 520;
        const pageHeight = Math.round(pageWidth * 1.414); // True A4 proportion

        flip = new PageFlip(bookRef.current, {
          width: pageWidth,
          height: pageHeight,
          size: 'fixed',
          minWidth: 320,
          maxWidth: 600,
          minHeight: 450,
          maxHeight: 850,
          maxShadowOpacity: 0.5,
          showCover: true,
          mobileScrollSupport: false,
          usePortrait: isMobile,
          startPage: 0,
          drawShadow: true,
          flippingTime: 700,
          useMouseEvents: true,
          swipeDistance: 30,
        });

        // Load the pages from the HTML elements inside bookRef
        flip.loadFromHTML(bookRef.current.querySelectorAll('.flip-page'));

        flip.on('flip', (e: any) => {
          setCurrentPage(e.data);
          if (onPageChange) onPageChange(e.data);
        });

        pageFlipInstance.current = flip;
        setIsReady(true);
      } catch (err) {
        console.error('[FlipBook] Initialization error:', err);
      }
    };

    const timer = setTimeout(initFlip, 150);

    return () => {
      clearTimeout(timer);
      if (pageFlipInstance.current) {
        try {
          pageFlipInstance.current.destroy();
          pageFlipInstance.current = null;
        } catch (e) {}
      }
    };
  }, []);

  const flipPrev = () => {
    if (pageFlipInstance.current) {
      pageFlipInstance.current.flipPrev();
    }
  };

  const flipNext = () => {
    if (pageFlipInstance.current) {
      pageFlipInstance.current.flipNext();
    }
  };

  const flipToStart = () => {
    if (pageFlipInstance.current) {
      pageFlipInstance.current.flip(0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative flex flex-col items-center justify-center select-none w-full",
        isFullscreen ? "fixed inset-0 z-[200] bg-[#0c1222] p-4 h-screen w-screen" : "py-6",
        className
      )}
    >
      {/* Top Floating Flipbook Controls */}
      <div className="flex items-center justify-between gap-4 w-full max-w-4xl px-4 mb-4 bg-background/80 backdrop-blur-md border border-black/10 rounded-2xl py-2 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider">3D Cadastral Flipbook</p>
            <p className="text-[10px] text-muted-foreground font-medium">Click, drag page edges, or use arrows to turn</p>
          </div>
        </div>

        {/* Page Position Indicator */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs font-black px-3 py-1">
            Page {currentPage + 1} of {children.length}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={flipToStart} title="Cover Page">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={toggleFullscreen} title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* The 3D Book Container */}
      <div className="relative flex items-center justify-center my-4 overflow-visible">
        {/* Left Page Turn Button */}
        <button
          onClick={flipPrev}
          disabled={currentPage === 0}
          className="absolute -left-5 md:-left-14 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-background/90 border border-black/10 shadow-2xl flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-all disabled:opacity-20 disabled:pointer-events-none"
          title="Previous Page"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* DOM Root for page-flip library */}
        <div 
          ref={bookRef} 
          className="flip-book shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] rounded-r-lg overflow-hidden"
        >
          {children.map((pageContent, idx) => (
            <div 
              key={idx} 
              className="flip-page bg-white text-black p-6 md:p-8 flex flex-col justify-between overflow-y-auto box-border"
              style={{
                width: '100%',
                height: '100%',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.06)'
              }}
            >
              {pageContent}
            </div>
          ))}
        </div>

        {/* Right Page Turn Button */}
        <button
          onClick={flipNext}
          disabled={currentPage >= children.length - 1}
          className="absolute -right-5 md:-right-14 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-background/90 border border-black/10 shadow-2xl flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-all disabled:opacity-20 disabled:pointer-events-none"
          title="Next Page"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom Keyboard / Navigation Hints */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium mt-3">
        <span>Tip: Drag page corner to flip</span>
        <span>•</span>
        <span>Supports iPad & Touch Swiping</span>
        <span>•</span>
        <span>ISO 216 Proportion</span>
      </div>
    </div>
  );
}
