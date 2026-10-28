"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { 
  MapPin, 
  ShieldCheck, 
  Layers, 
  LayoutDashboard, 
  CheckCircle2, 
  ArrowRight,
  Printer,
  TrendingUp,
  AlertTriangle,
  Lock
} from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/layout/Footer"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useFirestore, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"

export default function AboutPage() {
  const db = useFirestore()
  const configRef = useMemo(() => (db ? doc(db, "config", "seo") : null), [db])
  const { data: configData } = useDoc(configRef)

  const getAsset = (id: string, fallbackId: string) => {
    const custom = configData?.assets?.[id];
    if (custom?.url) {
      return { imageUrl: custom.url, description: custom.description || "", imageHint: custom.hint || "" };
    }
    const fallback = PlaceHolderImages.find(img => img.id === fallbackId);
    return fallback ? { 
      imageUrl: fallback.imageUrl, 
      description: fallback.description, 
      imageHint: fallback.imageHint 
    } : { imageUrl: null, description: "", imageHint: "" };
  }

  const missionImage = getAsset('aboutMission', 'about-mission');
  const nestingImage = getAsset('aboutHierarchy', 'about-hierarchy');
  const grossNetImage = getAsset('aboutGrossNet', 'feature-audit');
  const tier1Image = getAsset('aboutTierAsset', 'field-1');
  const tier2Image = getAsset('aboutTierWorking', 'about-hierarchy');
  const tier3Image = getAsset('aboutTierObstacle', 'about-mission');
  const reportingImage = getAsset('aboutReporting', 'feature-ai');

  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <main className="max-w-5xl mx-auto p-6 py-16 md:py-24 space-y-24">
        
        {/* Hero Section */}
        <section className="text-center space-y-8">
          <div className="mx-auto h-20 w-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-8">
            <MapPin className="h-10 w-10 text-white fill-current" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter font-headline leading-none">
            Estate-Scale Audits <br /><span className="text-primary">Built for the Field.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            GeoMapping is a professional-grade land management tool designed to differentiate between your total ownership and your actual productive land.
          </p>
          
          <div className="relative w-full aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl mt-12">
            {missionImage.imageUrl && (
              <Image 
                src={missionImage.imageUrl} 
                alt={missionImage.description || "Mission"} 
                fill 
                className="object-cover"
                data-ai-hint={missionImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-muted/30 overflow-hidden group">
            <div className="relative h-64 w-full overflow-hidden">
               {nestingImage.imageUrl && (
                 <Image src={nestingImage.imageUrl} alt="Nesting" fill className="object-cover group-hover:scale-110 transition-transform duration-700" data-ai-hint={nestingImage.imageHint} />
               )}
            </div>
            <CardHeader className="p-8 pb-0">
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-primary mb-4 shadow-sm">
                <Layers className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-black">Project Nesting</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Map entire estates with complex hierarchies. Overlay obstacles, access roads, and sub-fields within a single project perimeter.
              </p>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest">Multi-Layer Support</Badge>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-muted/30 overflow-hidden group">
            <div className="relative h-64 w-full overflow-hidden">
               {grossNetImage.imageUrl && (
                 <Image src={grossNetImage.imageUrl} alt="Audit" fill className="object-cover group-hover:scale-110 transition-transform duration-700" data-ai-hint={grossNetImage.imageHint} />
               )}
            </div>
            <CardHeader className="p-8 pb-0">
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-primary mb-4 shadow-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-black">Gross vs. Net Audits</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Stop paying for unworkable land. Automatically subtract ponds, poles, and infrastructure waste from your gross acreage.
              </p>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest">Productivity Optimized</Badge>
            </CardContent>
          </Card>
        </section>

        {/* Portfolio Aggregator Spotlight */}
        <section className="bg-secondary rounded-[4rem] p-10 md:p-20 text-secondary-foreground space-y-12 shadow-2xl relative overflow-hidden">
           <Image 
             src="https://picsum.photos/seed/geosky/1200/800" 
             alt="Sky" 
             fill 
             className="object-cover opacity-10" 
             data-ai-hint="cloudy sky"
           />
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              <div className="space-y-8">
                 <div className="space-y-4">
                    <Badge className="bg-primary text-white border-none font-black text-[10px] tracking-widest uppercase px-3 py-1">Estate Only Access</Badge>
                    <h2 className="text-5xl font-black font-headline tracking-tighter leading-tight">The Estate <br />Portfolio Auditor</h2>
                 </div>
                 <p className="text-xl opacity-80 font-medium leading-relaxed">
                    Designed for large-scale land owners and managers. Select multiple holdings across your entire estate to generate an aggregate utilization summary instantly.
                 </p>
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className="h-6 w-6 text-primary" />
                       <span className="text-lg font-bold">Aggregate Multi-Project Math</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className="h-6 w-6 text-primary" />
                       <span className="text-lg font-bold">Global Estate Efficiency Tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className="h-6 w-6 text-primary" />
                       <span className="text-lg font-bold">One-Click Grand Total Audits</span>
                    </div>
                 </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-8 backdrop-blur-md shadow-2xl">
                 <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Aggregate Portfolio Preview</p>
                    <Lock className="h-4 w-4 opacity-40" />
                 </div>
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <div className="flex justify-between text-sm font-black uppercase tracking-widest">
                          <span>Portfolio Efficiency</span>
                          <span className="text-primary">84.2%</span>
                       </div>
                       <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[84%] shadow-[0_0_20px_rgba(45,91,255,0.5)]" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="bg-white/5 p-6 rounded-3xl text-center border border-white/5">
                          <p className="text-[10px] font-black uppercase opacity-40 mb-2">Total Net Area</p>
                          <p className="text-3xl font-black tracking-tight">1,420 ac</p>
                       </div>
                       <div className="bg-white/5 p-6 rounded-3xl text-center border border-white/5">
                          <p className="text-[10px] font-black uppercase opacity-40 mb-2">Active Projects</p>
                          <p className="text-3xl font-black tracking-tight">12 Sites</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* The 3-Tier Hierarchy */}
        <section className="space-y-16">
          <div className="space-y-4 text-center">
            <h2 className="text-4xl font-black tracking-tight uppercase font-headline">The 3-Tier Hierarchy</h2>
            <p className="text-muted-foreground font-medium max-w-xl mx-auto">Our professional spatial engine logic allows you to structure land records according to industrial auditing standards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-background overflow-hidden flex flex-col">
              <div className="relative h-40 w-full overflow-hidden grayscale opacity-50">
                {tier1Image.imageUrl && (
                  <Image src={tier1Image.imageUrl} alt="Asset" fill className="object-cover" data-ai-hint={tier1Image.imageHint} />
                )}
              </div>
              <CardContent className="p-8 space-y-4 flex-1">
                <div className="h-10 w-10 bg-black rounded-lg flex items-center justify-center text-white"><ShieldCheck className="h-5 w-5" /></div>
                <h4 className="font-black uppercase text-sm tracking-widest">Asset Perimeter</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">The "Deed" boundary. Includes hedges, walls, and road access. This represents your total **Gross Area**.</p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-background overflow-hidden flex flex-col">
              <div className="relative h-40 w-full overflow-hidden grayscale opacity-50">
                {tier2Image.imageUrl && (
                  <Image src={tier2Image.imageUrl} alt="Working" fill className="object-cover" data-ai-hint={tier2Image.imageHint} />
                )}
              </div>
              <CardContent className="p-8 space-y-4 flex-1">
                <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center text-white"><LayoutDashboard className="h-5 w-5" /></div>
                <h4 className="font-black uppercase text-sm tracking-widest">Working Area</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">The actual arable, developable, or functional surface inside the property hedges.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-background overflow-hidden flex flex-col">
              <div className="relative h-40 w-full overflow-hidden grayscale opacity-50">
                {tier3Image.imageUrl && (
                  <Image src={tier3Image.imageUrl} alt="Obstacle" fill className="object-cover" data-ai-hint={tier3Image.imageHint} />
                )}
              </div>
              <CardContent className="p-8 space-y-4 flex-1">
                <div className="h-10 w-10 bg-red-600 rounded-lg flex items-center justify-center text-white"><AlertTriangle className="h-5 w-5" /></div>
                <h4 className="font-black uppercase text-sm tracking-widest">Internal Obstacle</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Exclusion zones like ponds, electricity poles, or infrastructure waste that must be subtracted from net productivity.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Reporting */}
        <section className="flex flex-col md:flex-row items-center gap-16 p-12 md:p-20 bg-muted/30 rounded-[4rem] overflow-hidden relative">
           <div className="flex-1 space-y-8 relative z-10">
              <h2 className="text-4xl font-black uppercase tracking-tight font-headline">Audit Reporting</h2>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                Turn your layered project data into professional A4 PDF reports instantly. Our engine automatically generates a full land utilization table, breaking down gross area versus efficiency waste for lenders and managers.
              </p>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 text-sm font-bold"><CheckCircle2 className="h-5 w-5 text-primary" /> Multi-Layer Map Captures</div>
                 <div className="flex items-center gap-3 text-sm font-bold"><CheckCircle2 className="h-5 w-5 text-primary" /> Infrastructure vs. Obstacle Breakdown</div>
                 <div className="flex items-center gap-3 text-sm font-bold"><CheckCircle2 className="h-5 w-5 text-primary" /> Verified Datum & Spatial Metadata</div>
              </div>
           </div>
           <div className="relative h-80 w-full md:w-80 bg-white rounded-[3rem] border shadow-2xl flex items-center justify-center p-1 overflow-hidden group">
              <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden">
                {reportingImage.imageUrl && (
                  <Image src={reportingImage.imageUrl} alt="Reporting" fill className="object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" data-ai-hint={reportingImage.imageHint} />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                   <Printer className="h-32 w-32 text-primary opacity-40" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-2 bg-primary animate-pulse" />
           </div>
        </section>

        {/* Final CTA */}
        <section className="text-center space-y-8 py-12">
          <h2 className="text-4xl md:text-5xl font-black font-headline tracking-tight">Ready to map your first field?</h2>
          <div className="flex justify-center">
             <Button asChild size="lg" className="h-20 px-12 rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
                <Link href="/measure">Initialize Mapping Engine <ArrowRight className="ml-2 h-6 w-6" /></Link>
             </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
