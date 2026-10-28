
"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import { useUser, useFirestore, useAuth, useDoc } from "@/firebase"
import { doc, setDoc, collection, getDocs } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings, 
  LogOut, 
  Mail, 
  MapPin, 
  Briefcase, 
  User as UserIcon, 
  Map as MapIcon, 
  Pencil, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Box, 
  Calendar, 
  RefreshCcw, 
  Clock, 
  HelpCircle, 
  X, 
  Check, 
  Lock, 
  AlertTriangle,
  Factory,
  ShieldAlert,
  Search,
  Zap,
  Ruler,
  Layers
} from "lucide-react"
import { signOut, updateProfile } from "firebase/auth"
import { Footer } from "@/components/layout/Footer"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { PaypalButton } from "@/components/billing/PaypalButton"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const MapPicker = dynamic(() => import('@/components/measure/InteractiveMap'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-muted rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest">Loading Location Map...</div>
})

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  
  const userDocRef = useMemo(() => {
    if (!db || !user || user.uid === 'demo-user-id') return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: dbProfile, loading: dbLoading } = useDoc(userDocRef)

  // Dynamic Pricing Sync
  const pricingRef = useMemo(() => (db ? doc(db, "config", "pricing") : null), [db]);
  const { data: pricingData } = useDoc(pricingRef);
  
  const [stats, setStats] = useState({ count: 0, totalArea: 0, totalDist: 0, projectCount: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false)
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)
  
  const [editName, setEditName] = useState("")
  const [editBio, setEditBio] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [editPhotoURL, setEditPhotoURL] = useState("")
  const [editBackdropURL, setEditBackdropURL] = useState("")
  const [editUsageType, setEditUsageType] = useState<"personal" | "professional">("personal")
  const [editIndustry, setEditIndustry] = useState("")
  const [editAreaUnits, setEditAreaUnits] = useState<string[]>(['acres', 'hectares', 'sqm', 'sqft', 'sqmi'])
  const [editDistUnits, setEditDistUnits] = useState<string[]>(['km', 'miles', 'meters'])
  const [editPinType, setEditPinType] = useState<"standard" | "footprints" | "car">("standard")
  const [editPinColor, setEditPinColor] = useState("#FF4D00")
  const [isUpdating, setIsUpdating] = useState(false)

  const [searchPostcode, setSearchPostcode] = useState("")
  const [searchHouseNum, setSearchHouseNum] = useState("")
  const [addressResults, setAddressResults] = useState<any[]>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [useManualMap, setUseManualMap] = useState(false)
  const [manualCoords, setManualCoords] = useState<{lat: number, lng: number} | null>(null)
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null)

  const profile = useMemo(() => {
    if (user?.uid === 'demo-user-id') {
      return {
        displayName: 'Demo Professional',
        baseLocation: '123 Tech Way, Silicon Valley, CA 94025',
        role: 'user',
        subscriptionStatus: 'free',
        usageType: 'professional',
        industry: 'Land Surveying',
        preferredAreaUnits: ['sqm', 'sqft'],
        preferredDistanceUnits: ['km', 'meters'],
        pinType: 'standard',
        pinColor: '#FF4D00',
        photoURL: `https://picsum.photos/seed/demo-user/200/200`,
        backdropURL: 'https://picsum.photos/seed/map/1200/400'
      }
    }
    return dbProfile
  }, [user, dbProfile])

  const isExpired = useMemo(() => {
    if (!profile?.subscriptionExpiry) return false;
    if (profile.subscriptionStatus === 'free') return false; 
    if (profile.lastPaymentType !== 'one-time') return false; 
    
    return new Date().getTime() > new Date(profile.subscriptionExpiry).getTime();
  }, [profile]);

  const daysRemaining = useMemo(() => {
    if (!profile?.subscriptionExpiry) return null;
    const expiry = new Date(profile.subscriptionExpiry).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [profile?.subscriptionExpiry]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.displayName || user?.displayName || "")
      setEditBio(profile.bio || "")
      setEditLocation(profile.baseLocation || "")
      setEditPhotoURL(profile.photoURL || user?.photoURL || "")
      setEditBackdropURL(profile.backdropURL || "")
      setEditUsageType(profile.usageType || "personal")
      setEditIndustry(profile.industry || "")
      setEditAreaUnits(profile.preferredAreaUnits || ['acres', 'hectares', 'sqm', 'sqft', 'sqmi'])
      setEditDistUnits(profile.preferredDistanceUnits || ['km', 'miles', 'meters'])
      setEditPinType(profile.pinType || "standard")
      setEditPinColor(profile.pinColor || "#FF4D00")

      const coordMatch = profile.baseLocation?.match(/([-+]?\d{1,2}\.?\d*),\s*([-+]?\d{1,3}\.?\d*)/)
      if (coordMatch) {
        const initialCoords = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) }
        setManualCoords(initialCoords)
        setMapCenter(initialCoords)
      }
    }
  }, [profile, user])

  useEffect(() => {
    if (!user) return

    if (user.uid === 'demo-user-id') {
      setStats({ count: 12, totalArea: 45000, totalDist: 15.5, projectCount: 1 })
      setStatsLoading(false)
      return
    }

    if (db) {
      const fetchStats = async () => {
        try {
          const mRef = collection(db, "users", user.uid, "measurements")
          const mSnap = await getDocs(mRef)
          
          let count = 0
          let area = 0
          let dist = 0
          const uniqueSites = new Set<string>()
          
          mSnap.forEach((doc) => {
            const data = doc.data()
            count++
            if (data.type === 'area') area += data.value
            else if (data.type === 'line') dist += data.value
            if (data.siteName) uniqueSites.add(data.siteName)
          })
          
          setStats({ count, totalArea: area, totalDist: dist, projectCount: uniqueSites.size })
        } catch (e) {
          console.error(e)
        } finally {
          setStatsLoading(false)
        }
      }
      fetchStats()
    }
  }, [user, db])

  const handleSearchAddress = async () => {
    if (!searchPostcode) {
      toast({ title: "Postcode Required", description: "Please enter a postcode to search.", variant: "destructive" });
      return;
    }

    setIsSearchingAddress(true);
    setAddressResults([]);

    try {
      const queryStr = `${searchHouseNum} ${searchPostcode}`.trim();
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&addressdetails=1&limit=5`);
      const data = await res.json();
      setAddressResults(data);
      
      if (data.length > 0) {
        const firstResult = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setMapCenter(firstResult);
        if (!manualCoords) {
          setManualCoords(firstResult);
        }
      } else {
        toast({ title: "No Addresses Found", description: "Try searching with just the postcode.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Search Error", description: "Could not connect to the address database.", variant: "destructive" });
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const selectAddress = (addr: any) => {
    const newCoords = { lat: parseFloat(addr.lat), lng: parseFloat(addr.lon) };
    setEditLocation(`${addr.display_name} (${newCoords.lat}, ${newCoords.lng})`);
    setManualCoords(newCoords);
    setMapCenter(newCoords);
    setAddressResults([]);
    toast({ title: "Address Verified", description: "Your base location has been updated." });
  };

  const handleMapClick = (coord: {lat: number, lng: number}) => {
    setManualCoords(coord);
    setMapCenter(coord);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coord.lat}&lon=${coord.lng}`)
      .then(r => r.json())
      .then(data => {
        const addrName = data.display_name || "Custom Point";
        setEditLocation(`${addrName} (${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)})`);
        toast({ title: "Pin Dropped", description: "Precise location updated." });
      });
  };

  const toggleAreaUnit = (unit: string) => {
    setEditAreaUnits(prev => prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]);
  }

  const toggleDistUnit = (unit: string) => {
    setEditDistUnits(prev => prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]);
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    setIsUpdating(true)

    const finalLocation = manualCoords 
      ? `${editLocation.split('(')[0].trim()} (${manualCoords.lat}, ${manualCoords.lng})`
      : editLocation;

    const updateData = {
      displayName: editName,
      bio: editBio,
      baseLocation: finalLocation,
      photoURL: editPhotoURL,
      backdropURL: editBackdropURL,
      usageType: editUsageType,
      industry: editIndustry,
      preferredAreaUnits: editAreaUnits,
      preferredDistanceUnits: editDistUnits,
      pinType: editPinType,
      pinColor: editPinColor
    };

    if (user.uid === 'demo-user-id') {
      toast({ title: "Demo Mode", description: "Identity updates are simulated in demo mode." });
      setIsUpdating(false);
      setIsEditDialogOpen(false);
      return;
    }

    if (!db) {
       setIsUpdating(false);
       return;
    }

    try {
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: editName,
          photoURL: editPhotoURL
        })
      }

      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, updateData, { merge: true })

      toast({ title: "Identity Finalized", description: "Your professional profile has been securely updated." })
      setIsEditDialogOpen(false)
    } catch (e: any) {
      toast({ title: "Update Failed", description: e.message, variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSignOut = async () => {
    localStorage.removeItem('geo_demo_user');
    if (auth) {
      await signOut(auth)
    }
    router.push("/")
  }

  if (authLoading || dbLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          Synchronizing Professional Profile...
        </div>
      </div>
    )
  }

  const industries = [
    "Agriculture & Farming",
    "Land Surveying",
    "Construction & Development",
    "Real Estate & Planning",
    "Forestry & Timber",
    "Environmental Science",
    "Other Professional"
  ];

  const planInfo = {
    free: { name: "Field Explorer", limit: 1, color: "text-slate-500", bg: "bg-slate-100" },
    pro: { name: "Professional Plan", limit: 10, color: "text-primary", bg: "bg-primary/10" },
    estate: { name: "Estate Manager Unlimited", limit: Infinity, color: "text-green-600", bg: "bg-green-100" }
  };

  const currentPlan = (profile?.subscriptionStatus as 'free' | 'pro' | 'estate') || 'free';
  const plan = planInfo[currentPlan];

  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <div className="relative h-80 bg-muted overflow-hidden">
        {profile?.backdropURL ? (
          <Image 
            src={profile.backdropURL} 
            alt="Backdrop" 
            fill 
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-secondary flex flex-col items-center justify-center text-secondary-foreground opacity-20">
            <svg width="100%" height="100%"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />

        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center z-20">
          <div className="relative group mb-4">
            <Avatar className="h-40 w-40 border-8 border-background shadow-2xl">
              <AvatarImage src={profile?.photoURL || user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200/200`} alt="User Profile" />
              <AvatarFallback className="font-headline text-4xl font-black">{profile?.displayName?.[0] || user?.email?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <button 
              onClick={() => setIsEditDialogOpen(true)}
              className="absolute bottom-2 right-2 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
            >
              <Pencil className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-4xl font-black font-headline tracking-tighter">{profile?.displayName || user?.displayName || 'User'}</h2>
              {profile?.usageType === 'professional' ? (
                <Badge className="bg-primary text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                  <Briefcase className="h-3 w-3 mr-1" /> Business
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-muted-foreground/30">
                  <UserIcon className="h-3 w-3 mr-1" /> Personal
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-sm opacity-80 font-bold uppercase tracking-widest">
                {profile?.industry ? `${profile.industry} Specialist` : 'GeoMeasure Field Agent'}
              </p>
              <div className="h-4 w-px bg-muted mx-1" />
              <Badge variant="secondary" className={cn("font-black text-[9px] uppercase tracking-widest", isExpired ? "bg-red-100 text-red-600" : cn(plan.bg, plan.color))}>
                 {isExpired ? "Access Expired" : plan.name}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto w-full p-8 space-y-10 flex-1">
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center shadow-xl border-none bg-background rounded-3xl">
            <CardContent className="p-6">
              <p className="text-3xl font-black font-headline text-primary">{stats.count}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Survey Records</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-xl border-none bg-background rounded-3xl">
            <CardContent className="p-6">
              <p className="text-3xl font-black font-headline text-primary">{(stats.totalArea * 0.000247105).toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Acres</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-xl border-none bg-background rounded-3xl">
            <CardContent className="p-6">
              <p className="text-3xl font-black font-headline text-primary">{(stats.totalDist * 0.621371).toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Miles Mapped</p>
            </CardContent>
          </Card>
        </div>

        {/* Plan & Usage Audit */}
        <Card className={cn(
          "border-none shadow-2xl rounded-[2.5rem] bg-background overflow-hidden border",
          isExpired && "ring-2 ring-red-500"
        )}>
           <CardHeader className="bg-muted/30 p-8">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                       Technical Entitlement 
                       <button onClick={() => setIsInfoDialogOpen(true)} className="hover:text-primary transition-colors">
                          <HelpCircle className="h-3 w-3" />
                       </button>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                       <h3 className={cn("text-2xl font-black font-headline tracking-tight", isExpired ? "text-red-600" : plan.color)}>
                         {isExpired ? "Technical Access Locked" : plan.name}
                       </h3>
                       {profile?.lastPaymentType === 'one-time' && (
                         <Badge variant="outline" className={cn("text-[9px] font-black uppercase", isExpired ? "border-red-200 text-red-600" : "border-primary/20 text-primary")}>
                           {isExpired ? "Expired License" : "Limited License"}
                         </Badge>
                       )}
                    </div>
                 </div>
                 <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", isExpired ? "bg-red-50 text-red-600" : cn(plan.bg, plan.color))}>
                    {isExpired ? <Lock className="h-6 w-6" /> : (currentPlan !== 'free' ? <ShieldCheck className="h-6 w-6" /> : <Zap className="h-6 w-6" />)}
                 </div>
              </div>
           </CardHeader>
           <CardContent className="p-8 space-y-8">
              {profile?.lastPaymentType === 'one-time' && daysRemaining !== null && (
                 <div className={cn(
                   "p-6 rounded-2xl border-2 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500",
                   daysRemaining <= 14 ? (isExpired ? "bg-red-100 border-red-300 text-red-900" : "bg-red-50 border-red-200 text-red-900") : "bg-primary/5 border-primary/10 text-primary"
                 )}>
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      daysRemaining <= 14 ? "bg-red-600 text-white" : "bg-primary text-white"
                    )}>
                       {isExpired ? <ShieldAlert className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                    </div>
                    <div className="space-y-1 flex-1">
                       <h4 className="text-sm font-black uppercase tracking-tight">
                         {isExpired ? "Access Revoked" : "Access Control Warning"}
                       </h4>
                       <p className="text-xs font-bold opacity-80 leading-relaxed">
                          {isExpired 
                            ? "Your technical license expired on " + (profile.subscriptionExpiry ? new Date(profile.subscriptionExpiry).toLocaleDateString() : 'the scheduled date') + ". Establish a new license or subscription to unlock your survey history."
                            : "Your one-time technical license expires in " + daysRemaining + " days. Ensure your account is transitioned to a subscription to maintain uninterrupted estate records."
                          }
                       </p>
                       {isExpired && (
                         <Button 
                           variant="link" 
                           className="p-0 h-auto text-xs font-black uppercase text-red-700 underline"
                           onClick={() => setIsUpgradeDialogOpen(true)}
                         >
                           Renew Technical Access Now
                         </Button>
                       )}
                    </div>
                 </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between mb-1">
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Project Capacity</p>
                       <p className="text-xs font-bold">
                          {stats.projectCount} / {plan.limit === Infinity ? 'Unlimited' : plan.limit}
                       </p>
                    </div>
                    {plan.limit === Infinity ? (
                       <div className={cn(
                         "flex items-center gap-2 px-3 py-2 rounded-xl border",
                         isExpired ? "bg-muted/50 text-muted-foreground border-muted" : "bg-green-500/10 text-green-700 border-green-200"
                       )}>
                          {isExpired ? <Lock className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {isExpired ? "Capacity Restricted" : "Unrestricted Capacity"}
                          </span>
                       </div>
                    ) : (
                       <Progress value={(stats.projectCount / plan.limit) * 100} className="h-2" />
                    )}
                    <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                       {isExpired ? "Access to project hierarchies is currently locked. Renew your professional license to resume multi-layered estate mapping." : 
                        (currentPlan === 'free' ? "Field Explorer allows for individual measurements. Upgrade to group records into professional project perimeters." : 
                         currentPlan === 'pro' ? `Professional Plan includes up to ${plan.limit} separate nested projects. Upgrade to Estate for unlimited capacity.` :
                         "Professional access grants you unrestricted project capacity. Create as many estate-scale layered maps as required.")
                       }
                    </p>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Capabilities</p>
                    <div className="space-y-2">
                       {[
                         { name: "Hierarchical Audits", active: !isExpired && currentPlan !== 'free' },
                         { name: "A4 PDF Reporting", active: !isExpired && currentPlan === 'estate' },
                         { name: "AI Site Characterization", active: !isExpired && currentPlan === 'estate' },
                         { name: "Global Cloud Backup", active: !isExpired && currentPlan !== 'free' }
                       ].map(cap => (
                         <div key={cap.name} className="flex items-center gap-2">
                            {cap.active ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : (isExpired ? <Lock className="h-3.5 w-3.5 text-muted-foreground/30" /> : <Box className="h-3.5 w-3.5 text-muted-foreground/30" />)}
                            <span className={cn("text-xs font-bold", cap.active ? "text-foreground" : "text-muted-foreground/50")}>{cap.name}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {(currentPlan !== 'estate' || isExpired) && (
                 <div className="pt-4 border-t border-dashed">
                    <Button 
                      className={cn(
                        "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl gap-2",
                        isExpired ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"
                      )}
                      onClick={() => setIsUpgradeDialogOpen(true)}
                    >
                       {isExpired ? <RefreshCcw className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                       {isExpired ? 'Re-Establish Professional License' : (currentPlan === 'free' ? 'Unlock Professional Capacity' : 'Unlock Estate Management Suite')}
                    </Button>
                 </div>
              )}
           </CardContent>
        </Card>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-none bg-muted/30 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-headline">Agent Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Verified Email</p>
                  <p className="font-bold truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Factory className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Industry</p>
                  <p className="font-bold text-sm">{profile?.industry || 'Not Specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-muted/30 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-headline">Measurement Units</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MapIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Area Recording</p>
                  <p className="font-bold text-xs uppercase tracking-tighter">
                    {profile?.preferredAreaUnits?.join(', ') || 'Standard (All)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Ruler className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Distance Recording</p>
                  <p className="font-bold text-xs uppercase tracking-tighter">
                    {profile?.preferredDistanceUnits?.join(', ') || 'Standard (All)'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-12">
          <Button 
            variant="outline" 
            className="h-16 justify-start px-6 gap-3 shadow-sm font-black uppercase text-xs tracking-widest rounded-2xl"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Pencil className="h-4 w-4" /> Edit Mapping Identity
          </Button>
          <Button 
            variant="outline" 
            className="h-16 justify-start px-6 gap-3 text-destructive hover:text-destructive shadow-sm font-black uppercase text-xs tracking-widest rounded-2xl" 
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" /> Sign Out from Cloud
          </Button>
        </div>
      </main>

      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
         <DialogContent className="rounded-[2.5rem] p-10 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-4">
               <DialogTitle className="text-3xl font-black font-headline tracking-tighter uppercase">Technical Comparison</DialogTitle>
               <DialogDescription className="font-medium text-md">Compare available capabilities across our professional tiers.</DialogDescription>
            </DialogHeader>

            <div className="py-8">
               <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-muted/20">
                  <Table>
                     <TableHeader className="bg-background">
                        <TableRow className="border-muted hover:bg-transparent">
                           <TableHead className="font-black uppercase text-[10px] tracking-widest">Feature Capability</TableHead>
                           <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Explorer</TableHead>
                           <TableHead className="text-center font-black uppercase text-[10px] tracking-widest text-primary">Pro</TableHead>
                           <TableHead className="text-center font-black uppercase text-[10px] tracking-widest text-green-600">Estate</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {[
                          { name: "Real-time GPS Mapping", f: true, p: true, e: true },
                          { name: "Manual Drawing Mode", f: true, p: true, e: true },
                          { name: "Satellite Data Feed", f: true, p: true, e: true },
                          { name: "Save to Cloud History", f: false, p: true, e: true },
                          { name: "Nested Projects", f: "No", p: "Up to 10", e: "Unlimited" },
                          { name: "Hierarchical Auditing", f: false, p: true, e: true },
                          { name: "A4 PDF Report Engine", f: false, p: false, e: true },
                          { name: "AI Site Characterization", f: false, p: false, e: true },
                          { name: "Priority Technical Support", f: false, p: false, e: true },
                        ].map((row) => (
                          <TableRow key={row.name} className="border-muted hover:bg-background/40 transition-colors">
                             <TableCell className="font-bold text-xs">{row.name}</TableCell>
                             <TableCell className="text-center">
                               {typeof row.f === 'boolean' ? (row.f ? <Check className="h-4 w-4 mx-auto text-slate-400" /> : <X className="h-4 w-4 mx-auto text-slate-200" />) : <span className="text-[10px] font-bold opacity-50">{row.f}</span>}
                             </TableCell>
                             <TableCell className="text-center">
                               {typeof row.p === 'boolean' ? (row.p ? <Check className="h-4 w-4 mx-auto text-primary" /> : <X className="h-4 w-4 mx-auto text-slate-200" />) : <span className="text-[10px] font-bold text-primary">{row.p}</span>}
                             </TableCell>
                             <TableCell className="text-center">
                               {typeof row.e === 'boolean' ? (row.e ? <Check className="h-4 w-4 mx-auto text-green-600" /> : <X className="h-4 w-4 mx-auto text-slate-200" />) : <span className="text-[10px] font-bold text-green-600">{row.e}</span>}
                             </TableCell>
                          </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </Card>
            </div>

            <DialogFooter>
               <Button className="w-full h-12 rounded-xl font-bold" onClick={() => setIsInfoDialogOpen(false)}>Close Comparison</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader className="space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-2">
                 <ShieldCheck className="h-8 w-8" />
              </div>
              <DialogTitle className="text-4xl font-black font-headline tracking-tighter text-center uppercase">
                {isExpired ? "Renew Technical Access" : "Upgrade Technical Suite"}
              </DialogTitle>
              <DialogDescription className="text-center text-md font-medium px-4">
                 Choose the billing logic that fits your estate management requirements.
              </DialogDescription>
           </DialogHeader>

           <div className="py-8 space-y-10">
              <div className="space-y-4">
                 <div className="flex items-center justify-between border-b pb-4">
                    <div>
                       <h4 className="text-xl font-black uppercase tracking-tight text-primary">Professional Plan</h4>
                       <p className="text-xs font-bold text-muted-foreground">Up to 10 Nested Projects • Professional Auditing</p>
                    </div>
                    <p className="text-2xl font-black">£{pricingData?.professional || "45.00"}</p>
                 </div>
                 
                 <Tabs defaultValue="subscription" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1 mb-4">
                       <TabsTrigger value="subscription" className="rounded-lg font-black text-[10px] uppercase tracking-widest gap-2">
                          <RefreshCcw className="h-3 w-3" /> Yearly Subscription
                       </TabsTrigger>
                       <TabsTrigger value="one-time" className="rounded-lg font-black text-[10px] uppercase tracking-widest gap-2">
                          <Calendar className="h-3 w-3" /> 1-Year Access
                       </TabsTrigger>
                    </TabsList>
                    <TabsContent value="subscription" className="mt-0">
                       <div className="space-y-3">
                          <p className="text-[10px] font-bold text-center text-muted-foreground uppercase">Automatic Annual Billing</p>
                          <PaypalButton 
                            isSubscription={true}
                            planId={process.env.NEXT_PUBLIC_PAYPAL_PLAN_PRO || "P-5PW20780KR577153WNI2D3FQ"} 
                            tierName="pro"
                            onSuccess={() => window.location.reload()}
                          />
                       </div>
                    </TabsContent>
                    <TabsContent value="one-time" className="mt-0">
                       <div className="space-y-3">
                          <p className="text-[10px] font-bold text-center text-muted-foreground uppercase">No Renewal • Expire in 12 Months</p>
                          <PaypalButton 
                            isSubscription={false}
                            amount={pricingData?.professional || "45.00"} 
                            tierName="pro"
                            onSuccess={() => window.location.reload()}
                          />
                       </div>
                    </TabsContent>
                 </Tabs>
              </div>

              <div className="space-y-4 pt-4 border-t border-dashed">
                 <div className="flex items-center justify-between border-b pb-4">
                    <div>
                       <h4 className="text-xl font-black uppercase tracking-tight text-green-700">Estate Manager</h4>
                       <p className="text-xs font-bold text-green-600">Full Auditing Suite • AI Site Analysis</p>
                    </div>
                    <p className="text-2xl font-black text-green-700">£{pricingData?.estate || "110.00"}</p>
                 </div>

                 <Tabs defaultValue="subscription" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-green-50 p-1 mb-4">
                       <TabsTrigger value="subscription" className="rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                          <RefreshCcw className="h-3 w-3" /> Yearly Subscription
                       </TabsTrigger>
                       <TabsTrigger value="one-time" className="rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                          <Calendar className="h-3 w-3" /> 1-Year Access
                       </TabsTrigger>
                    </TabsList>
                    <TabsContent value="subscription" className="mt-0">
                       <div className="space-y-3">
                          <p className="text-[10px] font-bold text-center text-muted-foreground uppercase">Automatic Annual Billing</p>
                          <PaypalButton 
                            isSubscription={true}
                            planId={process.env.NEXT_PUBLIC_PAYPAL_PLAN_ESTATE || "P-93R442660V685214KNI2D2MI"} 
                            tierName="estate"
                            onSuccess={() => window.location.reload()}
                          />
                       </div>
                    </TabsContent>
                    <TabsContent value="one-time" className="mt-0">
                       <div className="space-y-3">
                          <p className="text-[10px] font-bold text-center text-muted-foreground uppercase">No Renewal • Expire in 12 Months</p>
                          <PaypalButton 
                            isSubscription={false}
                            amount={pricingData?.estate || "110.00"} 
                            tierName="estate"
                            onSuccess={() => window.location.reload()}
                          />
                       </div>
                    </TabsContent>
                 </Tabs>
              </div>
           </div>
           
           <DialogFooter>
              <Button variant="ghost" className="w-full font-bold h-12 rounded-xl" onClick={() => setIsUpgradeDialogOpen(false)}>Return to Profile</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-2xl overflow-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black font-headline tracking-tight uppercase">Edit Mapping Identity</DialogTitle>
            <DialogDescription>Customize your technical preferences and property location.</DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-4">
            
            <section className="space-y-4 p-6 bg-primary/5 rounded-3xl border border-primary/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Property Location
                </h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="manual-mode" className="text-[10px] font-black uppercase">Manual Pin Mode</Label>
                  <Switch id="manual-mode" checked={useManualMap} onCheckedChange={setUseManualMap} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">House Number</Label>
                    <Input value={searchHouseNum} onChange={e => setSearchHouseNum(e.target.value)} placeholder="e.g. 10" className="h-11 rounded-xl bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Postcode</Label>
                    <Input value={searchPostcode} onChange={e => setSearchPostcode(e.target.value)} placeholder="e.g. SW1A 1AA" className="h-11 rounded-xl bg-background" />
                  </div>
                </div>
                <Button onClick={handleSearchAddress} className="w-full h-11 rounded-xl gap-2 font-bold" disabled={isSearchingAddress}>
                  {isSearchingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Find Verified Address
                </Button>

                {!useManualMap && addressResults.length > 0 && (
                  <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-[10px] font-black uppercase opacity-50 ml-1">Select your address:</p>
                    {addressResults.map((addr, i) => (
                      <button 
                        key={i}
                        onClick={() => selectAddress(addr)}
                        className="w-full p-3 text-left text-xs font-bold hover:bg-primary/10 rounded-xl border border-transparent hover:border-primary/20 transition-all bg-background shadow-sm"
                      >
                        {addr.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {useManualMap && (
                <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="h-64 rounded-2xl overflow-hidden border border-primary/20 shadow-inner relative">
                    <MapPicker 
                      centerPos={mapCenter}
                      currentPos={manualCoords}
                      coords={[]}
                      mode="line"
                      isManualMode={true}
                      onMapClick={handleMapClick}
                      pinType="standard"
                      pinColor={editPinColor}
                    />
                    <div className="absolute bottom-2 left-2 z-50 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black uppercase border shadow-sm">
                      Click map to place home pin
                    </div>
                  </div>
                </div>
              )}

              {editLocation && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-green-700">Current Verified Base:</p>
                    <p className="text-[10px] font-bold text-green-800 line-clamp-2">{editLocation.split('(')[0]}</p>
                    {manualCoords && (
                      <p className="text-[8px] font-mono text-green-600 mt-0.5">{manualCoords.lat.toFixed(6)}, {manualCoords.lng.toFixed(6)}</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Display Name</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Professional Industry</Label>
                <Select value={editIndustry} onValueChange={setEditIndustry}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {industries.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <section className="space-y-6 p-6 bg-muted/30 rounded-3xl border">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" /> Dimension Preferences
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase ml-1">Preferred Area Units</Label>
                   <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'sqm', label: 'Square Meters' },
                        { id: 'sqft', label: 'Square Feet' },
                        { id: 'acres', label: 'Acres' },
                        { id: 'hectares', label: 'Hectares' },
                        { id: 'sqmi', label: 'Square Miles' }
                      ].map(unit => (
                        <div key={unit.id} className="flex items-center space-x-3 bg-background p-3 rounded-xl border">
                          <Checkbox 
                            id={`area-${unit.id}`} 
                            checked={editAreaUnits.includes(unit.id)} 
                            onCheckedChange={() => toggleAreaUnit(unit.id)}
                          />
                          <Label htmlFor={`area-${unit.id}`} className="text-xs font-bold cursor-pointer">{unit.label}</Label>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-3 pt-2">
                   <Label className="text-[10px] font-black uppercase ml-1">Preferred Distance Units</Label>
                   <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'meters', label: 'Meters' },
                        { id: 'km', label: 'Kilometers' },
                        { id: 'miles', label: 'Miles' }
                      ].map(unit => (
                        <div key={unit.id} className="flex items-center space-x-3 bg-background p-3 rounded-xl border">
                          <Checkbox 
                            id={`dist-${unit.id}`} 
                            checked={editDistUnits.includes(unit.id)} 
                            onCheckedChange={() => toggleDistUnit(unit.id)}
                          />
                          <Label htmlFor={`dist-${unit.id}`} className="text-xs font-bold cursor-pointer">{unit.label}</Label>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/30 rounded-3xl">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Map Pin Style</Label>
                <Select value={editPinType} onValueChange={(v: any) => setEditPinType(v)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Pin style" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="standard" className="rounded-lg">Standard Stake</SelectItem>
                    <SelectItem value="footprints" className="rounded-lg">Footprints (Walking)</SelectItem>
                    <SelectItem value="car" className="rounded-lg">Car (Driving)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Pin/Path Color</Label>
                <div className="flex gap-3 items-center">
                  <Input type="color" value={editPinColor} onChange={e => setEditPinColor(e.target.value)} className="h-12 w-16 p-1 rounded-xl cursor-pointer" />
                  <span className="text-xs font-mono font-bold">{editPinColor}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Profile Photo URL</Label>
              <Input value={editPhotoURL} onChange={e => setEditPhotoURL(e.target.value)} className="h-12 rounded-xl" placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Backdrop Image URL</Label>
              <Input value={editBackdropURL} onChange={e => setEditBackdropURL(e.target.value)} className="h-12 rounded-xl" placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Bio / Agent Notes</Label>
              <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="rounded-xl min-h-[100px]" placeholder="Brief professional summary..." />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <Button className="w-full h-14 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl" onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Finalize Identity Updates
            </Button>
            <Button variant="ghost" className="w-full h-12 font-bold" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  )
}
