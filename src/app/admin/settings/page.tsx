"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  Settings, 
  Save, 
  CheckCircle2, 
  Globe, 
  Lock, 
  Loader2,
  Database
} from "lucide-react"
import { useFirestore, useDoc, useUser } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"

const MASTER_ADMIN_EMAIL = "allan_jamieson@outlook.com";

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  
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

  const pricingRef = useMemo(() => {
    if (!db) return null
    return doc(db, "config", "pricing")
  }, [db])

  const { data: pricingData, loading: pricingLoading } = useDoc(pricingRef)

  const [prices, setPrices] = useState({
    explorer: "0",
    professional: "45",
    estate: "110"
  })

  useEffect(() => {
    if (pricingData) {
      setPrices({
        explorer: pricingData.explorer || "0",
        professional: pricingData.professional || "45",
        estate: pricingData.estate || "110"
      })
    }
  }, [pricingData])

  const handleSavePrices = () => {
    if (!db) return
    setIsSaving(true)

    const updateData = {
      ...prices,
      updatedAt: new Date().toISOString()
    }

    setDoc(doc(db, "config", "pricing"), updateData, { merge: true })
      .then(() => {
        setIsSaving(false)
        toast({ title: "Pricing Updated", description: "Changes will reflect on the landing page instantly." })
      })
      .catch(async (e) => {
        setIsSaving(false)
        const permissionError = new FirestorePermissionError({
          path: "/config/pricing",
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const tiers = [
    { key: "explorer" as const, name: "Field Explorer", color: "bg-slate-100 text-slate-700", description: "Entry Level" },
    { key: "professional" as const, name: "Professional", color: "bg-primary/10 text-primary", description: "Standard Business" },
    { key: "estate" as const, name: "Estate Manager", color: "bg-green-100 text-green-700", description: "Unlimited Access" },
  ]

  if (isSyncing) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isActualAdmin) return null;

  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <header className="p-8 pt-12 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground shadow-lg">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight font-headline">Price Settings</h1>
            <p className="text-muted-foreground font-medium">Manage licensing tiers and feature availability.</p>
          </div>
        </div>
      </header>

      <main className="px-8 pb-20 max-w-5xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <Card key={tier.key} className="border-none shadow-xl rounded-[2.5rem] bg-muted/30 overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <Badge className={cn("w-fit font-black text-[8px] uppercase tracking-widest px-3 mb-2", tier.color)}>
                  {tier.name}
                </Badge>
                <CardTitle className="text-2xl font-black">Licensing</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-2 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Annual Price (£)</Label>
                  <Input 
                    value={prices[tier.key]} 
                    onChange={(e) => setPrices({ ...prices, [tier.key]: e.target.value })}
                    className="h-12 rounded-xl font-bold text-lg" 
                    placeholder="e.g. 45"
                  />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tier Capability</p>
                  <div className="space-y-3">
                    {["GPS Tracking", "A4 Reporting", "AI Insights", "Cloud Storage"].map((feature) => (
                      <div key={feature} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{feature}</span>
                        <div className="h-5 w-5 bg-background rounded-md border border-black/5 flex items-center justify-center text-primary">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] bg-secondary text-secondary-foreground overflow-hidden">
          <CardContent className="p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black font-headline tracking-tighter">Database Synchronization</h3>
                  <p className="font-medium opacity-80">Global platform variables and public pricing constraints.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <Globe className="h-5 w-5 opacity-70" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Visibility</p>
                      <p className="text-sm font-bold">Public Prices Active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <Database className="h-5 w-5 opacity-70" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Source</p>
                      <p className="text-sm font-bold">Firestore /config/pricing</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 p-8 rounded-[2rem] border border-white/20 space-y-6">
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Platform Status Message</Label>
                   <textarea 
                     className="w-full bg-transparent border border-white/20 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-white/40 min-h-[100px]"
                     defaultValue="Public pricing tiers are synced via Firestore. Updates reflect on the landing page in real-time."
                   />
                </div>
                <Button 
                  className="w-full h-14 rounded-2xl bg-white text-secondary font-black uppercase tracking-widest text-xs hover:bg-white/90 shadow-2xl" 
                  onClick={handleSavePrices} 
                  disabled={isSaving || pricingLoading}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Finalize Platform Updates
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
