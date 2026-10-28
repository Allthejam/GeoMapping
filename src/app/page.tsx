"use client"

import { useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  MapPin, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  Globe, 
  CheckCircle2, 
  TrendingUp,
  Check,
  X,
  CreditCard,
  AlertTriangle,
  Calculator,
  Zap
} from "lucide-react"
import { Footer } from "@/components/layout/Footer"
import { cn } from "@/lib/utils"
import { useFirestore, useDoc, useUser } from "@/firebase"
import { doc } from "firebase/firestore"
import { PaypalButton } from "@/components/billing/PaypalButton"
import { PlaceHolderImages } from "@/lib/placeholder-images"

export default function LandingPage() {
  const db = useFirestore()
  const { user } = useUser()
  
  const configRef = useMemo(() => (db ? doc(db, "config", "seo") : null), [db])
  const { data: configData } = useDoc(configRef)
  
  const pricingRef = useMemo(() => (db ? doc(db, "config", "pricing") : null), [db])
  const { data: pricingData } = useDoc(pricingRef)

  /**
   * Asset Resolution Logic: Firestore Assets > Local Defaults
   * Ensures src is null if no URL is found to prevent Next.js errors.
   */
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

  const heroImage = getAsset('landingHero', 'landing-hero');
  const auditImage = getAsset('featureAudit', 'feature-audit');
  const portfolioImage = getAsset('featurePortfolio', 'feature-portfolio');
  const aiImage = getAsset('featureAI', 'feature-ai');

  const pricingTiers = useMemo(() => [
    {
      id: "explorer",
      name: "Field Explorer",
      price: pricingData?.explorer ? `£${pricingData.explorer}` : "£0",
      description: "Perfect for quick, one-off measurements without cloud storage.",
      features: [
        { text: "Real-time GPS Tracking", included: true },
        { text: "Manual Free-Draw Mode", included: true },
        { text: "Satellite Imagery Access", included: true },
        { text: "Save to Cloud History", included: false },
        { text: "Hierarchical Audits", included: false },
        { text: "Estate-Scale Aggregation", included: false },
      ],
      buttonText: "Start Mapping Free",
      buttonHref: "/measure",
      variant: "ghost" as const
    },
    {
      id: "pro",
      name: "Professional",
      planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_PRO || "P-5PW20780KR577153WNI2D3FQ",
      price: pricingData?.professional ? `£${pricingData.professional}` : "£45",
      description: "Standard mapping capacity for active property agents.",
      features: [
        { text: "All Explorer Features", included: true },
        { text: "10 Nested Projects", included: true },
        { text: "Full Hierarchical Audits", included: true },
        { text: "Standard Cloud Storage", included: true },
        { text: "Basic Email Support", included: true },
        { text: "Estate-Scale Aggregation", included: false },
      ],
      buttonText: "Get Professional",
      buttonHref: "/register",
      variant: "outline" as const,
      popular: true
    },
    {
      id: "estate",
      name: "Estate Manager",
      planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ESTATE || "P-93R442660V685214KNI2D2MI",
      price: pricingData?.estate ? `£${pricingData.estate}` : "£110",
      description: "The complete precision mapping suite for total land management.",
      features: [
        { text: "Unlimited Nested Projects", included: true },
        { text: "Estate Portfolio Auditor", included: true },
        { text: "Aggregate Multi-Project Math", included: true },
        { text: "A4 PDF Audit Generation", included: true },
        { text: "AI Technical Characterization", included: true },
        { text: "Priority Field Support", included: true },
      ],
      buttonText: "Go Unlimited",
      buttonHref: "/register",
      variant: "default" as const
    }
  ], [pricingData])

  return (
    <div className="flex flex-col min-h-screen bg-background font-body overflow-auto">
      <header className="px-6 py-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-[100] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <MapPin className="h-5 w-5 text-white fill-current" />
          </div>
          <span className="font-black text-xl tracking-tight">GeoMapping</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/about" className="text-sm font-bold hover:text-primary transition-colors">How it Works</Link>
          <Link href="/install" className="text-sm font-bold hover:text-primary transition-colors">Install Platform</Link>
          <Link href="/login" className="text-sm font-bold hover:text-primary transition-colors">Sign In</Link>
        </nav>
        <Button asChild className="rounded-xl font-bold px-6 shadow-xl shadow-primary/20">
          <Link href="/measure">Launch Platform</Link>
        </Button>
      </header>

      <main className="flex-1">
        <section className="relative px-6 py-20 md:py-32">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest bg-primary/10 text-primary border-none mb-4">
                 Professional Land Audits V2.4 Stable
              </Badge>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter font-headline leading-[0.9] max-w-2xl mx-auto lg:mx-0">
                Map Your Land. <br /><span className="text-primary">Audit Your Efficiency.</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Professional-grade GPS measurement with hierarchical auditing. Differentiate between total ownership and actual productive land.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Button asChild size="lg" className="h-16 px-10 rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30">
                  <Link href="/measure">Initialize Mapping Engine <ArrowRight className="ml-2 h-6 w-6" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-16 px-10 rounded-2xl text-lg font-black uppercase tracking-widest">
                  <Link href="/register">Create Free Account</Link>
                </Button>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white group">
              {heroImage.imageUrl && (
                <Image 
                  src={heroImage.imageUrl} 
                  alt={heroImage.description || "GeoMapping Hero"} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  priority
                  data-ai-hint={heroImage.imageHint}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-white fill-current" />
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">Live Precision Rendering</span>
                  </div>
                  <Badge className="bg-white text-primary border-none text-[8px] font-black uppercase">EPSG:4326</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-32 px-6">
          <div className="max-w-6xl mx-auto space-y-24">
            <div className="text-center space-y-4">
               <h2 className="text-4xl font-black uppercase tracking-tight font-headline">Productivity Optimized</h2>
               <p className="text-muted-foreground font-medium max-w-xl mx-auto">GeoMapping combines precision geometry with nested project logic to deliver true net productive acreage data.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="flex flex-col bg-background rounded-[2.5rem] shadow-xl overflow-hidden group hover:border-primary border border-transparent transition-all">
                  <div className="relative h-48 w-full overflow-hidden">
                    {auditImage.imageUrl && (
                      <Image src={auditImage.imageUrl} alt="Audit" fill className="object-cover group-hover:scale-110 transition-transform duration-700" data-ai-hint={auditImage.imageHint} />
                    )}
                  </div>
                  <div className="p-10 space-y-4 flex-1">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
                       <TrendingUp className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-black">Gross vs. Net</h3>
                    <p className="text-muted-foreground font-medium text-sm leading-relaxed">Automatically calculate the difference between your total asset boundary and usable land after subtracting infrastructure waste.</p>
                  </div>
               </div>
               
               <div className="flex flex-col bg-background rounded-[2.5rem] shadow-xl overflow-hidden group hover:border-primary border border-transparent transition-all">
                  <div className="relative h-48 w-full overflow-hidden">
                    {portfolioImage.imageUrl && (
                      <Image src={portfolioImage.imageUrl} alt="Portfolio" fill className="object-cover group-hover:scale-110 transition-transform duration-700" data-ai-hint={portfolioImage.imageHint} />
                    )}
                  </div>
                  <div className="p-10 space-y-4 flex-1">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
                       <Calculator className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-black">Portfolio Audits</h3>
                    <p className="text-muted-foreground font-medium text-sm leading-relaxed">Exclusive for Estate Managers: Aggregate multiple project sites into a single grand total audit to manage entire portfolios.</p>
                  </div>
               </div>

               <div className="flex flex-col bg-background rounded-[2.5rem] shadow-xl overflow-hidden group hover:border-primary border border-transparent transition-all">
                  <div className="relative h-48 w-full overflow-hidden">
                    {aiImage.imageUrl && (
                      <Image src={aiImage.imageUrl} alt="AI" fill className="object-cover group-hover:scale-110 transition-transform duration-700" data-ai-hint={aiImage.imageHint} />
                    )}
                  </div>
                  <div className="p-10 space-y-4 flex-1">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
                       <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-black">AI Land Insights</h3>
                    <p className="text-muted-foreground font-medium text-sm leading-relaxed">Leverage technical site characterization. Our engine analyzes site geometry to provide topographic and utility overviews automatically.</p>
                  </div>
               </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-32 px-6">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest text-primary border-primary/20 mb-2">
                Professional Licensing
              </Badge>
              <h2 className="text-5xl font-black font-headline tracking-tighter leading-none">Choose Your Plan</h2>
              <p className="text-muted-foreground font-medium max-xl mx-auto">From individual surveyors to total estate management suites.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingTiers.map((tier) => (
                <Card 
                  key={tier.name} 
                  className={cn(
                    "relative flex flex-col border-none shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:scale-[1.02]",
                    tier.popular ? "bg-muted/50 border-2 border-primary/20" : "bg-background"
                  )}
                >
                  {tier.popular && (
                    <div className="absolute top-6 right-6">
                      <Badge className="bg-primary text-white font-black text-[8px] uppercase tracking-widest px-3">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="p-10 pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">{tier.name}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black font-headline tracking-tighter">{tier.price}</span>
                      <span className="text-muted-foreground font-bold">/ year</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium mt-4 leading-relaxed">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="p-10 pt-6 space-y-6 flex-1">
                    <div className="space-y-4">
                      {tier.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                          )}
                          <span className={cn(
                            "text-sm font-bold",
                            feature.included ? "text-foreground/80" : "text-muted-foreground/40"
                          )}>
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="p-10 pt-0">
                    {tier.id === 'explorer' ? (
                      <Button asChild variant={tier.variant} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg">
                        <Link href={tier.buttonHref}>{tier.buttonText}</Link>
                      </Button>
                    ) : (
                      user ? (
                        <div className="w-full space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground justify-center mb-2">
                             <CreditCard className="h-3 w-3" /> Pay with PayPal
                          </div>
                          <PaypalButton 
                            planId={tier.planId || ""} 
                            tierName={tier.id}
                            onSuccess={() => window.location.href = '/profile'}
                          />
                        </div>
                      ) : (
                        <Button asChild variant={tier.variant} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg">
                          <Link href={`/register?plan=${tier.id}`}>{tier.buttonText}</Link>
                        </Button>
                      )
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
