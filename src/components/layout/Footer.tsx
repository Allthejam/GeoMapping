"use client"

import Link from "next/link"
import { MapPin, Twitter, Linkedin, Github, Mail, ExternalLink, Info, Download, MessageCircle } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/30 border-t mt-auto print:hidden">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <MapPin className="h-5 w-5 text-white fill-current" />
              </div>
              <span className="font-black text-xl tracking-tight">GeoMapping</span>
            </Link>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Professional grade GPS precision mapping for agriculture, property management, and field research.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">Application</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/measure" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors">
                  Field Mapping
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors">
                  Record History
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" /> How it Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Setup Links */}
          <div>
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">Installation</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/install" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                  <Download className="h-3.5 w-3.5" /> App Install Guide
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5" /> Contact Support
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-1">
                  Help Center <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter/Status */}
          <div>
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">System Status</h3>
            <div className="bg-background/50 rounded-2xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">All Systems Operational</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                GPS Precision Mapping V2.4 is live. Real-time satellite synchronization is active.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            &copy; {currentYear} GeoMapping Mapping Systems. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">WGS 84 (EPSG:4326)</span>
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">v2.4.0-stable</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
