"use client"

import React, { useState } from "react"
import { 
  HelpCircle, 
  BookOpen, 
  Layers, 
  Sparkles, 
  Printer, 
  Archive, 
  MousePointerClick, 
  Volume2, 
  FileText, 
  CheckCircle2, 
  Landmark,
  Compass,
  ArrowRight,
  ShieldCheck
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FlipbookHelpDialogProps {
  trigger?: React.ReactNode
  defaultOpen?: boolean
}

export function FlipbookHelpDialog({ trigger, defaultOpen = false }: FlipbookHelpDialogProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl font-bold h-11 px-3.5 gap-2 border-primary/20 hover:border-primary/50 text-foreground shadow-sm hover:bg-primary/5 transition-all"
            title="Help & Flipbook Instructions"
          >
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
              ?
            </div>
            <span className="hidden sm:inline font-black uppercase text-[10px] tracking-wider">Flipbook Guide</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border shadow-2xl bg-background">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 sm:p-8 border-b">
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-primary text-white font-black text-[9px] uppercase tracking-widest px-3 py-0.5">
              User Guide
            </Badge>
            <span className="text-[10px] font-black uppercase opacity-50 tracking-wider">
              Estate Portfolio & 3D Flipbook Engine
            </span>
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-black font-headline uppercase tracking-tight text-foreground flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-primary" />
            Cadastral Flipbook & Portfolio Guide
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-muted-foreground mt-1.5 max-w-xl">
            Everything you need to know about combining mapped fields into a 3D animated book, printing A4 bound dossiers, and exporting executive audits.
          </DialogDescription>
        </div>

        {/* Content Tabs */}
        <div className="p-6 sm:p-8 pt-4">
          <Tabs defaultValue="steps" className="w-full space-y-6">
            <TabsList className="grid grid-cols-3 w-full bg-muted/60 p-1.5 rounded-2xl h-auto">
              <TabsTrigger value="steps" className="rounded-xl py-2.5 font-black uppercase text-[10px] tracking-wider gap-2">
                <Layers className="h-4 w-4" /> 4-Step Walkthrough
              </TabsTrigger>
              <TabsTrigger value="interaction" className="rounded-xl py-2.5 font-black uppercase text-[10px] tracking-wider gap-2">
                <MousePointerClick className="h-4 w-4" /> Flip Controls
              </TabsTrigger>
              <TabsTrigger value="export" className="rounded-xl py-2.5 font-black uppercase text-[10px] tracking-wider gap-2">
                <Printer className="h-4 w-4" /> Print & Export
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: 4-Step Walkthrough */}
            <TabsContent value="steps" className="space-y-4 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Step 1 */}
                <div className="bg-muted/30 border border-border/60 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-primary/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="h-8 w-8 rounded-xl bg-primary text-white font-black text-xs flex items-center justify-center shadow-md">
                      01
                    </span>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">
                      Holding Selection
                    </Badge>
                  </div>
                  <h4 className="font-black text-sm uppercase tracking-tight text-foreground flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" /> Select Your Sites
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Under <strong>Holding Inventory</strong>, check off the fields or site parcels you want included in this audit portfolio. You can select one farm, multiple distinct holdings, or click <strong>Select All Sites</strong>.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-muted/30 border border-border/60 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-primary/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="h-8 w-8 rounded-xl bg-primary text-white font-black text-xs flex items-center justify-center shadow-md">
                      02
                    </span>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">
                      Executive Profile
                    </Badge>
                  </div>
                  <h4 className="font-black text-sm uppercase tracking-tight text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Title & Management Notes
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Set a formal <strong>Portfolio Title</strong>, describe your <strong>Current Operations</strong> (e.g. livestock grazing, rotational crops), and add your <strong>Strategic Intent</strong>. Click <strong>Synthesize Audit Narrative</strong> to auto-draft an executive review!
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-muted/30 border border-border/60 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-primary/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="h-8 w-8 rounded-xl bg-primary text-white font-black text-xs flex items-center justify-center shadow-md">
                      03
                    </span>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">
                      Book Assembly
                    </Badge>
                  </div>
                  <h4 className="font-black text-sm uppercase tracking-tight text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> Generate Report
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click the top button <strong>Generate Professional Report</strong>. The system instantly compiles all parcels, metric tables, GPS coordinate registers, and legal certifications into a multi-page book.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="bg-muted/30 border border-border/60 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-primary/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="h-8 w-8 rounded-xl bg-primary text-white font-black text-xs flex items-center justify-center shadow-md">
                      04
                    </span>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">
                      Interactive Experience
                    </Badge>
                  </div>
                  <h4 className="font-black text-sm uppercase tracking-tight text-foreground flex items-center gap-2">
                    <Compass className="h-4 w-4 text-primary" /> Flip, Review & Vault
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    View the book in <strong>3D Flipbook</strong> mode or <strong>A4 Print View</strong>. Turn pages with your mouse or arrow keys, print directly to hardcopy PDF, or archive the record into your secure <strong>Reports Vault</strong>.
                  </p>
                </div>

              </div>

              {/* Pro Tip Alert */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-foreground">Multi-Holding Aggregation</p>
                  <p className="text-xs text-muted-foreground">
                    Have 2 or more different field sites on one account? Select both! The book calculates individual site breakdowns on Page 2 and Page 3 while presenting an aggregate master balance on Page 1.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Flip Controls */}
            <TabsContent value="interaction" className="space-y-4 focus-visible:outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-5 bg-muted/30 rounded-2xl border space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <MousePointerClick className="h-5 w-5" />
                    <h5 className="font-black text-sm uppercase">Mouse & Touch Dragging</h5>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click and drag any page corner, or simply click the outer edge of a page. Realistic 3D curl physics and paper shading mimic a genuine physical book.
                  </p>
                </div>

                <div className="p-5 bg-muted/30 rounded-2xl border space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Volume2 className="h-5 w-5" />
                    <h5 className="font-black text-sm uppercase">Audio & Bottom Controls</h5>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use the bottom control bar to jump with <strong>Previous</strong> and <strong>Next</strong> buttons, view current page numbers, or toggle realistic paper-flip sound effects.
                  </p>
                </div>

                <div className="p-5 bg-muted/30 rounded-2xl border space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5" />
                    <h5 className="font-black text-sm uppercase">Keyboard Shortcuts</h5>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Press <kbd className="px-1.5 py-0.5 bg-muted border rounded font-mono text-[10px]">Left Arrow</kbd> and <kbd className="px-1.5 py-0.5 bg-muted border rounded font-mono text-[10px]">Right Arrow</kbd> to rapidly flip through pages during presentations.
                  </p>
                </div>

                <div className="p-5 bg-muted/30 rounded-2xl border space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                    <h5 className="font-black text-sm uppercase">Book Structure</h5>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The book comprises a leather-styled <strong>Cover</strong>, an <strong>Executive Synthesis</strong>, a <strong>Technical Analytics</strong> page, a <strong>Cadastral Vertex Register</strong>, and <strong>Legal Certification</strong> sign-off.
                  </p>
                </div>

              </div>
            </TabsContent>

            {/* TAB 3: Print & Export */}
            <TabsContent value="export" className="space-y-4 focus-visible:outline-none">
              <div className="space-y-3">
                <div className="p-5 bg-muted/30 rounded-2xl border space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5" />
                    <h5 className="font-black text-sm uppercase">Switching to A4 Print View</h5>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click the <strong>A4 Print View</strong> toggle in the top bar. This flattens the 3D book into true 210mm × 297mm precision pages configured for physical binding, ring binders, or digital distribution.
                  </p>
                </div>

                <div className="p-5 bg-muted/30 rounded-2xl border space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Printer className="h-5 w-5" />
                    <h5 className="font-black text-sm uppercase">Save as PDF or Print</h5>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click <strong>Print / Save PDF</strong>. In your browser's print dialog, select <em>Destination: Save as PDF</em>, set Margins to <em>None</em> or <em>Default</em>, and ensure <em>Background Graphics</em> is checked for crisp charts and seals.
                  </p>
                </div>

                <div className="p-5 bg-muted/30 rounded-2xl border space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Archive className="h-5 w-5" />
                    <h5 className="font-black text-sm uppercase">Save to Reports Vault</h5>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click <strong>Save to Vault</strong> to upload this snapshot directly to your cloud account. You can revisit past reports anytime from the <strong>/reports</strong> vault without recalculating.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Action */}
          <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground font-medium">
              Ready to create your first portfolio book? Select your sites and click generate!
            </p>
            <Button 
              className="w-full sm:w-auto rounded-xl font-black uppercase text-[10px] tracking-wider px-6 h-10 bg-primary text-white"
              onClick={() => setOpen(false)}
            >
              Got it, let's build <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
