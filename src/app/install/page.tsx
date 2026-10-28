"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Monitor, 
  Smartphone, 
  Apple, 
  Download, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/layout/Footer"

export default function InstallGuidePage() {
  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <main className="max-w-4xl mx-auto p-6 py-16 md:py-24 space-y-16">
        
        {/* Header Section */}
        <section className="text-center space-y-6">
          <div className="mx-auto h-20 w-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-8">
            <Download className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter font-headline leading-none">
            GeoMapping <br /><span className="text-primary">Everywhere.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Install GeoMapping as a professional-grade application on your mobile device or desktop for faster access and offline reliability.
          </p>
        </section>

        {/* Installation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* iOS Section */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-muted/30 overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-foreground mb-4 shadow-sm">
                <Apple className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-black">iPhone & iPad</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 font-black text-xs">1</div>
                  <p className="text-sm font-medium leading-relaxed">Open <strong>Safari</strong> and navigate to this site.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 font-black text-xs">2</div>
                  <p className="text-sm font-medium leading-relaxed">Tap the <strong>Share</strong> button <Share className="h-4 w-4 inline mx-1" /> at the bottom of the screen.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 font-black text-xs">3</div>
                  <p className="text-sm font-medium leading-relaxed">Scroll down and select <strong>"Add to Home Screen"</strong> <PlusSquare className="h-4 w-4 inline mx-1" />.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Android Section */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-muted/30 overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-green-600 mb-4 shadow-sm">
                <Smartphone className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-black">Android & Google</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 font-black text-xs">1</div>
                  <p className="text-sm font-medium leading-relaxed">Open <strong>Chrome</strong> and navigate to this site.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 font-black text-xs">2</div>
                  <p className="text-sm font-medium leading-relaxed">Tap the <strong>Menu</strong> icon <MoreVertical className="h-4 w-4 inline mx-1" /> near the address bar.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 font-black text-xs">3</div>
                  <p className="text-sm font-medium leading-relaxed">Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Section */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-muted/30 overflow-hidden md:col-span-2">
            <CardHeader className="p-8 pb-0">
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-primary mb-4 shadow-sm">
                <Monitor className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-black">Windows & MacOS</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-sm font-black uppercase tracking-widest opacity-50">Chrome / Edge</p>
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 font-black text-xs">1</div>
                    <p className="text-sm font-medium leading-relaxed">Look for the <strong>Install Icon</strong> <Download className="h-4 w-4 inline mx-1" /> in the address bar.</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 font-black text-xs">2</div>
                    <p className="text-sm font-medium leading-relaxed">Follow the prompt to "Install App".</p>
                  </div>
                </div>
                <div className="bg-primary/5 p-6 rounded-3xl space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-widest text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Why install?
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs font-bold"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Edge-to-edge workspace</li>
                    <li className="flex items-center gap-2 text-xs font-bold"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Instant taskbar access</li>
                    <li className="flex items-center gap-2 text-xs font-bold"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Enhanced mapping stability</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final CTA */}
        <section className="text-center bg-primary rounded-[3rem] p-12 space-y-6 text-primary-foreground shadow-2xl">
          <h2 className="text-3xl font-black font-headline tracking-tight uppercase">Ready to Start?</h2>
          <p className="max-w-md mx-auto opacity-90 font-medium">Once installed, GeoMapping functions as a native application with dedicated GPS handling.</p>
          <div className="flex justify-center pt-4">
             <Button asChild size="lg" className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-sm bg-white text-primary hover:bg-white/90 shadow-2xl">
                <Link href="/measure">Open Mapping Engine <ArrowRight className="ml-2 h-5 w-5" /></Link>
             </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
