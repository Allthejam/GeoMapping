"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  Globe, 
  Save, 
  Search, 
  Loader2, 
  Layout, 
  Share2, 
  AlertTriangle,
  CheckCircle2,
  Twitter,
  Image as ImageIcon,
  Eye,
  Smartphone,
  MousePointer2,
  Upload,
  Camera,
  Layers,
  Sparkles,
  Info,
  Type,
  Home,
  BookOpen
} from "lucide-react"
import { useFirestore, useDoc, useUser, useStorage } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Footer } from "@/components/layout/Footer"
import Image from "next/image"

const MASTER_ADMIN_EMAIL = "allan_jamieson@outlook.com";

const ASSET_KEYS = [
  { id: 'landingHero', label: 'Landing Hero', hint: 'Main landing page background', group: 'home' },
  { id: 'featureAudit', label: 'Audit Feature', hint: 'Gross vs Net showcase image', group: 'home' },
  { id: 'featurePortfolio', label: 'Portfolio Feature', hint: 'Portfolio aggregation visual', group: 'home' },
  { id: 'featureAI', label: 'AI Insights', hint: 'Analysis showcase image', group: 'home' },
  { id: 'aboutMission', label: 'About Mission', hint: 'About page hero landscape', group: 'about' },
  { id: 'aboutGrossNet', label: 'About Gross/Net', hint: 'Productivity optimized audit visual', group: 'about' },
  { id: 'aboutHierarchy', label: 'About Hierarchy', hint: '3-Tier layout example', group: 'about' },
  { id: 'aboutTierAsset', label: 'Tier 1: Asset', hint: 'Asset perimeter / deed boundary', group: 'about' },
  { id: 'aboutTierWorking', label: 'Tier 2: Working', hint: 'Functional working area', group: 'about' },
  { id: 'aboutTierObstacle', label: 'Tier 3: Obstacle', hint: 'Internal exclusions / waste', group: 'about' },
  { id: 'aboutReporting', label: 'Audit Reporting', hint: 'Report generation visual', group: 'about' }
];

export default function AdminSEOPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState<string | null>(null)
  
  // Verify Admin Status
  const profileRef = useMemo(() => (db && user?.uid && user.uid !== 'demo-user-id') ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  
  const isActualAdmin = profile?.role === 'admin' || user?.uid === 'demo-user-id' || user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
  const isSyncing = authLoading || profileLoading

  useEffect(() => {
    if (!isSyncing && !isActualAdmin) {
      router.push("/measure")
    }
  }, [isSyncing, isActualAdmin, router])

  const seoRef = useMemo(() => db ? doc(db, "config", "seo") : null, [db])
  const { data: seoData, loading: seoLoading } = useDoc(seoRef)

  const [seoFields, setSeoFields] = useState({
    title: "GeoMapping - Professional GPS Land Mapping & Auditing",
    description: "Surveyor-grade GPS measurement for agriculture and property management. Differentiate between total ownership and net productive land.",
    keywords: "GPS mapping, land measurement, acreage calculator, agriculture tech, field survey",
    ogImage: "https://picsum.photos/seed/geo-og/1200/630",
    ogImageAlt: "GeoMapping professional mapping interface showing land utilization audit",
    twitterHandle: "@geomapping",
    twitterCard: "summary_large_image"
  })

  const [assets, setAssets] = useState<Record<string, any>>({})

  useEffect(() => {
    if (seoData) {
      setSeoFields({
        title: seoData.title || seoFields.title,
        description: seoData.description || seoFields.description,
        keywords: seoData.keywords || seoFields.keywords,
        ogImage: seoData.ogImage || seoFields.ogImage,
        ogImageAlt: seoData.ogImageAlt || seoFields.ogImageAlt,
        twitterHandle: seoData.twitterHandle || seoFields.twitterHandle,
        twitterCard: seoData.twitterCard || seoFields.twitterCard
      })
      if (seoData.assets) {
        setAssets(seoData.assets)
      }
    }
  }, [seoData])

  const handleSaveSEO = () => {
    if (!db) return
    setIsSaving(true)

    const updateData = {
      ...seoFields,
      assets,
      updatedAt: new Date().toISOString()
    }

    setDoc(doc(db, "config", "seo"), updateData, { merge: true })
      .then(() => {
        setIsSaving(false)
        toast({ title: "Infrastructure Updated", description: "Global metadata and platform assets synchronized." })
      })
      .catch(async (e) => {
        setIsSaving(false)
        const permissionError = new FirestorePermissionError({
          path: "/config/seo",
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleFileUpload = async (key: string, file: File) => {
    if (!storage || !user) return;
    setIsUploading(key);

    try {
      const path = `platform/assets/${key}_${Date.now()}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);

      setAssets(prev => ({
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          url,
          hint: prev[key]?.hint || ASSET_KEYS.find(a => a.id === key)?.hint || 'field survey'
        }
      }));

      toast({ title: "Upload Complete", description: `${key} asset uploaded to storage.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Storage connection error." });
    } finally {
      setIsUploading(null);
    }
  };

  const updateAssetMeta = (key: string, field: string, value: string) => {
    setAssets(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value
      }
    }));
  };

  if (isSyncing) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isActualAdmin) return null;

  const renderAssetGrid = (group: 'home' | 'about') => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
        {ASSET_KEYS.filter(a => a.group === group).map((asset) => {
          const data = assets[asset.id] || {};
          return (
            <Card key={asset.id} className="border-none shadow-xl rounded-[2.5rem] bg-muted/30 overflow-hidden flex flex-col">
              <div className="relative h-48 w-full bg-black/10 group">
                {data.url ? (
                  <Image src={data.url} alt={asset.label} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
                     <Camera className="h-10 w-10 opacity-20" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No Custom Image</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Label htmlFor={`upload-${asset.id}`} className="h-12 w-12 bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-xl">
                      {isUploading === asset.id ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-primary" />}
                   </Label>
                   <input 
                     id={`upload-${asset.id}`} 
                     type="file" 
                     className="hidden" 
                     accept="image/*"
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) handleFileUpload(asset.id, file);
                     }}
                   />
                </div>
              </div>
              <CardContent className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                 <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{asset.label}</p>
                      <h4 className="text-lg font-black">{asset.hint}</h4>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Asset Description (Alt Text)</Label>
                       <Textarea 
                         value={data.description || ""} 
                         onChange={(e) => updateAssetMeta(asset.id, 'description', e.target.value)}
                         placeholder="High-fidelity field survey visual..."
                         className="min-h-[80px] rounded-xl bg-background border-none text-xs"
                       />
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest ml-1">AI Image Hint (Keywords)</Label>
                       <input 
                         value={data.hint || ""} 
                         onChange={(e) => updateAssetMeta(asset.id, 'hint', e.target.value)}
                         placeholder="e.g. farmland aerial"
                         className="flex h-10 w-full rounded-xl bg-background border-none px-3 py-2 text-xs font-bold" 
                       />
                    </div>
                 </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <header className="p-8 pt-12 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground shadow-lg">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight font-headline">Platform Back Office</h1>
            <p className="text-muted-foreground font-medium">Control global indexing, social tags, and marketing assets.</p>
          </div>
        </div>
      </header>

      <main className="px-8 pb-24 max-w-7xl space-y-12">
        <Tabs defaultValue="metadata" className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger value="metadata" className="rounded-xl font-black text-xs uppercase tracking-widest px-8">SEO Metadata</TabsTrigger>
            <TabsTrigger value="assets" className="rounded-xl font-black text-xs uppercase tracking-widest px-8">Platform Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="metadata" className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 space-y-8">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-muted/30 overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Layout className="h-4 w-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">Core Metadata</span>
                    </div>
                    <CardTitle className="text-2xl font-black uppercase">Search Indexing</CardTitle>
                    <CardDescription>Primary data consumed by Google and Bing crawlers.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-2 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Meta Title</Label>
                      <input 
                        value={seoFields.title} 
                        onChange={(e) => setSeoFields({ ...seoFields, title: e.target.value })}
                        className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Meta Description</Label>
                      <Textarea 
                        value={seoFields.description} 
                        onChange={(e) => setSeoFields({ ...seoFields, description: e.target.value })}
                        className="rounded-xl min-h-[100px] font-medium leading-relaxed" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Crawler Keywords</Label>
                      <input 
                        value={seoFields.keywords} 
                        onChange={(e) => setSeoFields({ ...seoFields, keywords: e.target.value })}
                        className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium" 
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[2.5rem] bg-muted/30 overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Share2 className="h-4 w-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">Social Integration</span>
                    </div>
                    <CardTitle className="text-2xl font-black uppercase">OpenGraph & Twitter</CardTitle>
                    <CardDescription>Configuration for platform sharing on Facebook, LinkedIn, and X.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Twitter Handle</Label>
                        <input 
                          value={seoFields.twitterHandle} 
                          onChange={(e) => setSeoFields({ ...seoFields, twitterHandle: e.target.value })}
                          className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Twitter Card Style</Label>
                        <Select value={seoFields.twitterCard} onValueChange={(v) => setSeoFields({ ...seoFields, twitterCard: v })}>
                          <SelectTrigger className="h-12 rounded-xl font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-2xl border-none">
                            <SelectItem value="summary">Standard Summary</SelectItem>
                            <SelectItem value="summary_large_image">Large Image Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Sharing Image URL (1200x630)</Label>
                          <input 
                            value={seoFields.ogImage} 
                            onChange={(e) => setSeoFields({ ...seoFields, ogImage: e.target.value })}
                            className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium" 
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Image Alt Text (Accessibility)</Label>
                          <input 
                            value={seoFields.ogImageAlt} 
                            onChange={(e) => setSeoFields({ ...seoFields, ogImageAlt: e.target.value })}
                            placeholder="Descriptive text for the sharing image..."
                            className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium" 
                          />
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-5 space-y-8">
                <div className="sticky top-8 space-y-8">
                   {/* Search Engine Preview */}
                   <Card className="border-none shadow-xl rounded-[2.5rem] bg-background overflow-hidden">
                      <CardHeader className="p-8 pb-4">
                        <div className="flex items-center gap-2">
                           <Search className="h-4 w-4 text-muted-foreground" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Google Snippet Preview</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 pt-0">
                         <div className="space-y-1">
                            <p className="text-[#1a0dab] text-xl font-medium truncate leading-tight">{seoFields.title}</p>
                            <p className="text-[#006621] text-sm truncate">https://www.gps-mapping.allthejam.co.uk</p>
                            <p className="text-[#545454] text-sm line-clamp-2 leading-relaxed">{seoFields.description}</p>
                         </div>
                      </CardContent>
                   </Card>

                   {/* Social Card Preview */}
                   <Card className="border-none shadow-xl rounded-[2.5rem] bg-background overflow-hidden">
                      <CardHeader className="p-8 pb-4">
                        <div className="flex items-center gap-2">
                           <Share2 className="h-4 w-4 text-muted-foreground" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Social Card Preview</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 pt-0">
                         <div className="rounded-2xl border overflow-hidden bg-muted/10 group cursor-default">
                            <div className="relative aspect-[1.91/1] w-full bg-muted">
                               {seoFields.ogImage ? (
                                  <Image src={seoFields.ogImage} alt="Social" fill className="object-cover" />
                               ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30"><ImageIcon className="h-8 w-8" /></div>
                               )}
                            </div>
                            <div className="p-4 space-y-1">
                               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">GEOMAPPING PLATFORM</p>
                               <p className="font-bold text-sm line-clamp-1">{seoFields.title}</p>
                               <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">{seoFields.description}</p>
                            </div>
                         </div>
                      </CardContent>
                   </Card>

                   <Card className="border-none shadow-2xl rounded-[3rem] bg-secondary text-secondary-foreground overflow-hidden">
                      <CardContent className="p-10 space-y-6">
                         <h3 className="text-xl font-black uppercase tracking-tight">Configuration Status</h3>
                         <div className="space-y-4">
                            <div className="flex items-center gap-3">
                               <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                               <p className="text-xs font-bold opacity-80">Synchronized with Next.js Metadata API</p>
                            </div>
                         </div>
                         <Button 
                            className="w-full h-16 rounded-2xl bg-white text-secondary font-black uppercase tracking-widest text-xs hover:bg-white/90 shadow-2xl transition-all" 
                            onClick={handleSaveSEO} 
                            disabled={isSaving || seoLoading}
                          >
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Save className="h-5 w-5 mr-3" />}
                            Commit Platform Config
                          </Button>
                      </CardContent>
                   </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Tabs defaultValue="home" className="w-full">
              <TabsList className="bg-muted/30 p-1 rounded-xl h-12 mb-8 inline-flex">
                <TabsTrigger value="home" className="rounded-lg font-black text-[10px] uppercase tracking-widest px-6 gap-2">
                   <Home className="h-3 w-3" /> Home Page
                </TabsTrigger>
                <TabsTrigger value="about" className="rounded-lg font-black text-[10px] uppercase tracking-widest px-6 gap-2">
                   <BookOpen className="h-3 w-3" /> About Page
                </TabsTrigger>
              </TabsList>

              <TabsContent value="home" className="mt-0">
                {renderAssetGrid('home')}
              </TabsContent>

              <TabsContent value="about" className="mt-0">
                {renderAssetGrid('about')}
              </TabsContent>
            </Tabs>

            <Card className="border-none shadow-2xl rounded-[3rem] bg-primary text-white p-10 mt-12 overflow-hidden relative">
               <Sparkles className="absolute -right-6 -bottom-6 h-32 w-32 opacity-10" />
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                  <div className="space-y-4">
                     <h3 className="text-3xl font-black font-headline tracking-tighter uppercase">Dynamic Asset Logic</h3>
                     <p className="text-lg font-medium opacity-80 leading-relaxed">
                        Uploaded assets are automatically integrated into the public-facing pages. Fallback logic ensures the platform remains visually consistent even if custom captures are removed.
                     </p>
                  </div>
                  <div className="flex justify-end">
                     <Button 
                       className="h-16 px-12 rounded-2xl bg-white text-primary font-black uppercase tracking-widest text-xs hover:bg-white/90 shadow-2xl gap-3"
                       onClick={handleSaveSEO}
                       disabled={isSaving}
                     >
                       {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                       Commit Platform Assets
                     </Button>
                  </div>
               </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}
