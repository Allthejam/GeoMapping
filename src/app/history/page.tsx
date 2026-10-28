
"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Ruler, 
  Map as MapIcon, 
  Calendar, 
  ChevronRight, 
  Loader2, 
  Navigation, 
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Printer,
  Mail,
  Search,
  Landmark,
  Rows,
  TrendingUp,
  ShieldCheck,
  LayoutDashboard,
  AlertTriangle,
  Zap,
  BarChart3,
  LayoutGrid,
  Grid3X3,
  Table as TableIcon,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Box,
  Clock,
  FolderInput,
  Plus,
  Save,
  X,
  Lock,
  CreditCard,
  FolderTree,
  Link as LinkIcon
} from "lucide-react"
import Image from "next/image"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, deleteDoc, doc, updateDoc, getDocs, where } from "firebase/firestore"
import { formatArea, formatDistance } from "@/lib/measure-utils"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Footer } from "@/components/layout/Footer"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

type ViewMode = 'grid' | 'compact' | 'table';
type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

const DEFAULT_FIELD_IMAGE = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop";

export default function HistoryPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  
  const [localDemoData, setLocalDemoData] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isGrouped, setIsGrouped] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")

  const userRef = useMemo(() => (db && user?.uid && user.uid !== 'demo-user-id' ? doc(db, "users", user.uid) : null), [db, user?.uid]);
  const { data: userProfile, loading: profileLoading } = useDoc(userRef);

  const [isTimedOut, setIsTimedOut] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setIsTimedOut(true), 4000)
    return () => clearTimeout(timer)
  }, [])

  const isExpired = useMemo(() => {
    if (!userProfile?.subscriptionExpiry) return false;
    if (userProfile.subscriptionStatus === 'free') return false; 
    if (userProfile.lastPaymentType !== 'one-time') return false; 
    return new Date().getTime() > new Date(userProfile.subscriptionExpiry).getTime();
  }, [userProfile]);

  const [itemToAssign, setItemToAssign] = useState<any>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState("")
  const [isNewSiteMode, setIsNewSiteMode] = useState(false)
  const [newSiteName, setNewSiteName] = useState("")
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const measurementsQuery = useMemo(() => {
    if (!db || !user?.uid || user.uid === 'demo-user-id' || isExpired) return null
    return query(
      collection(db, "users", user.uid, "measurements"),
      orderBy("timestamp", "desc"),
      limit(200)
    )
  }, [db, user?.uid, isExpired])

  const { data: cloudMeasurements, loading: cloudLoading } = useCollection(measurementsQuery)
  const isActuallyLoading = cloudLoading && !isTimedOut

  const rawData = useMemo(() => {
    if (isExpired) return [];
    return user?.uid === 'demo-user-id' ? [...localDemoData] : (cloudMeasurements ? [...cloudMeasurements] : [])
  }, [user, localDemoData, cloudMeasurements, isExpired])

  const processedData = useMemo(() => {
    let filtered = [...rawData];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(q) ||
        item.siteName?.toLowerCase().includes(q) ||
        item.locationLabel?.toLowerCase().includes(q) ||
        item.classification?.toLowerCase().includes(q) ||
        item.role?.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'all') filtered = filtered.filter(item => item.role === roleFilter);
    if (typeFilter !== 'all') filtered = filtered.filter(item => item.type === typeFilter);
    if (projectFilter !== 'all') filtered = filtered.filter(item => (item.siteName || "General") === projectFilter);

    filtered.sort((a, b) => {
      const aTime = new Date(a.timestamp?.toDate?.() || a.timestamp).getTime();
      const bTime = new Date(b.timestamp?.toDate?.() || b.timestamp).getTime();
      const aName = (a.title || "").toLowerCase();
      const bName = (b.title || "").toLowerCase();
      switch (sortBy) {
        case 'date-desc': return bTime - aTime;
        case 'date-asc': return aTime - bTime;
        case 'name-asc': return aName.localeCompare(bName);
        case 'name-desc': return bName.localeCompare(aName);
        default: return 0;
      }
    });
    return filtered;
  }, [rawData, searchQuery, sortBy, roleFilter, typeFilter, projectFilter])

  const projects = useMemo(() => {
    const uniqueSites = new Set<string>();
    rawData.forEach(item => { uniqueSites.add(item.siteName || "General"); });
    return Array.from(uniqueSites).sort();
  }, [rawData]);

  const groupedData = useMemo(() => {
    if (!isGrouped) return { "All Survey Records": processedData }
    const groups: Record<string, any[]> = {}
    processedData.forEach(item => {
      const site = item.siteName || "General"
      if (!groups[site]) groups[site] = []
      groups[site].push(item)
    })
    return groups
  }, [processedData, isGrouped])

  const calculateAudit = (items: any[]) => {
    const gross = items.filter(i => i.role === 'perimeter' && i.type === 'area').reduce((acc, i) => acc + i.value, 0);
    const working = items.filter(i => i.role === 'working' && i.type === 'area').reduce((acc, i) => acc + i.value, 0);
    const obstacle = items.filter(i => i.role === 'obstacle' && i.type === 'area').reduce((acc, i) => acc + i.value, 0);
    const netProductive = working > 0 ? Math.max(0, working - obstacle) : Math.max(0, gross - obstacle);
    const baseline = gross > 0 ? gross : working;
    const efficiency = baseline > 0 ? (netProductive / baseline) * 100 : 0;
    return { gross, working, obstacle, netProductive, efficiency };
  }

  const isLoading = authLoading || (profileLoading && !isTimedOut) || (user && user.uid !== 'demo-user-id' && isActuallyLoading)

  const handleDelete = (id: string) => {
    if (!confirm("Permanently delete this record?")) return;
    if (user?.uid === 'demo-user-id') {
      const filtered = localDemoData.filter(item => item.id !== id)
      setLocalDemoData(filtered)
      localStorage.setItem('geo_demo_measurements', JSON.stringify(filtered))
      return
    }
    if (!db || !user) return
    deleteDoc(doc(db, "users", user.uid, "measurements", id));
  }

  const openAssignGroup = (item: any) => {
    setItemToAssign(item)
    setSelectedSite(item.siteName || "")
    setNewSiteName("")
    setIsNewSiteMode(false)
    setIsAssignDialogOpen(true)
  }

  const handleAssignGroup = async () => {
    if (!itemToAssign || !user) return
    const finalSiteName = isNewSiteMode ? newSiteName : selectedSite
    setIsUpdatingGroup(true)
    if (user.uid === 'demo-user-id') {
      const updated = localDemoData.map(m => m.id === itemToAssign.id ? { ...m, siteName: finalSiteName } : m)
      setLocalDemoData(updated)
      localStorage.setItem('geo_demo_measurements', JSON.stringify(updated))
      setIsUpdatingGroup(false); setIsAssignDialogOpen(false);
      return
    }
    if (!db) return
    updateDoc(doc(db, "users", user.uid, "measurements", itemToAssign.id), { siteName: finalSiteName })
      .then(() => { setIsUpdatingGroup(false); setIsAssignDialogOpen(false); });
  }

  if (authLoading || (!user && !authLoading)) return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  if (isExpired) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background text-center space-y-12">
        <div className="relative">
           <div className="h-32 w-32 bg-red-100 rounded-[3rem] flex items-center justify-center text-red-600 shadow-2xl shadow-red-200 animate-in zoom-in duration-700">
              <Lock className="h-14 w-14" />
           </div>
        </div>
        <div className="space-y-4 max-md">
           <h1 className="text-4xl font-black font-headline tracking-tighter leading-tight uppercase">Technical Access Locked</h1>
           <p className="text-muted-foreground font-medium leading-relaxed">Your one-time professional license has expired. Establish a new license to resume estate management.</p>
        </div>
        <div className="flex flex-col w-full max-w-xs gap-3">
           <Button className="h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 gap-2" onClick={() => router.push('/profile')}>
              <CreditCard className="h-4 w-4" /> Establish New License
           </Button>
        </div>
      </div>
    )
  }

  const preferredUnit = userProfile?.preferredAreaUnits?.[0] || 'acres';

  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <header className="p-8 pt-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight font-headline">Survey History</h1>
            <p className="text-muted-foreground font-medium">Professional land audits and site characterization logs.</p>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-2xl border w-fit">
            <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="icon" className="h-10 w-10 rounded-xl" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'compact' ? "secondary" : "ghost"} size="icon" className="h-10 w-10 rounded-xl" onClick={() => setViewMode('compact')}><Grid3X3 className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'table' ? "secondary" : "ghost"} size="icon" className="h-10 w-10 rounded-xl" onClick={() => setViewMode('table')}><TableIcon className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
           <div className="lg:col-span-3 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search records..." className="h-12 pl-11 rounded-xl shadow-sm border bg-background" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
           </div>
           <div className="lg:col-span-9 flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" className={cn("h-12 rounded-xl font-bold gap-2 px-4", isGrouped && "bg-primary/10 text-primary border-primary/20")} onClick={() => setIsGrouped(!isGrouped)}><Landmark className="h-4 w-4" />{isGrouped ? "Grouped" : "Individual"}</Button>
              <Select value={projectFilter} onValueChange={setProjectFilter}><SelectTrigger className="h-12 w-48 rounded-xl font-bold bg-background"><SelectValue placeholder="All Projects" /></SelectTrigger><SelectContent>{projects.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="h-12 w-40 rounded-xl font-bold bg-background"><SelectValue placeholder="All Roles" /></SelectTrigger><SelectContent><SelectItem value="all">All Audit Roles</SelectItem><SelectItem value="perimeter">Perimeters</SelectItem><SelectItem value="working">Functional</SelectItem><SelectItem value="obstacle">Exclusions</SelectItem></SelectContent></Select>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}><SelectTrigger className="h-12 w-40 rounded-xl font-bold bg-background"><SelectValue placeholder="Sort" /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem></SelectContent></Select>
           </div>
        </div>
      </header>

      <main className="px-8 space-y-12 pb-24 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="font-black uppercase tracking-widest text-[10px]">Syncing Estate Database...</p></div>
        ) : processedData.length > 0 ? (
          Object.entries(groupedData).map(([groupName, items]) => {
            const audit = calculateAudit(items);
            const hasAreaRecords = items.some(i => i.type === 'area');
            return (
              <section key={groupName} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Landmark className="h-4 w-4" /></div>
                    <div><h2 className="text-xl font-black tracking-tight uppercase font-headline">{groupName}</h2><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{items.length} Components</p></div>
                  </div>
                </div>
                {isGrouped && (
                  <div className="grid grid-cols-1 gap-8 items-start">
                     <Card className={cn("border-none shadow-xl rounded-[2rem] bg-secondary text-secondary-foreground overflow-hidden", hasAreaRecords ? "w-full" : "w-full")}>
                        <CardContent className="p-8">
                           {hasAreaRecords ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="space-y-4">
                                   <div className="space-y-1">
                                      <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-primary-foreground/60 flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> Technical Audit</h3>
                                      <p className="text-2xl font-black font-headline tracking-tighter">Utilization Summary</p>
                                   </div>
                                   <div className="space-y-3">
                                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-80"><span>Net Productivity</span><span>{audit.efficiency.toFixed(1)}%</span></div>
                                      <Progress value={audit.efficiency} className="h-1.5 bg-white/10" />
                                   </div>
                                   <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-white/5 p-3 rounded-xl border border-white/10"><p className="text-[7px] font-black uppercase opacity-50">Gross</p><p className="text-xs font-black">{formatArea(audit.gross, preferredUnit as any)}</p></div>
                                      <div className="bg-primary p-3 rounded-xl shadow-xl"><p className="text-[7px] font-black uppercase text-white/70">Net</p><p className="text-xs font-black text-white">{formatArea(audit.netProductive, preferredUnit as any)}</p></div>
                                   </div>
                                </div>
                                <div className="space-y-4 md:border-l md:border-white/10 md:pl-8">
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Site Metrics</p>
                                   <div className="grid grid-cols-2 gap-4">
                                      <div><p className="text-[8px] font-black uppercase opacity-40">Functional</p><p className="text-sm font-bold">{formatArea(audit.working, preferredUnit as any)}</p></div>
                                      <div><p className="text-[8px] font-black uppercase text-red-400">Exclusions</p><p className="text-sm font-bold text-red-400">-{formatArea(audit.obstacle, preferredUnit as any)}</p></div>
                                   </div>
                                </div>
                             </div>
                           ) : <div className="flex items-center gap-4"><Box className="h-5 w-5 text-white/50" /><p className="text-sm font-bold opacity-60 uppercase">No area data defined.</p></div>}
                        </CardContent>
                     </Card>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                  {items.map((item: any) => (
                    <Card key={item.id} className="overflow-hidden group hover:border-primary transition-all shadow-xl rounded-[2.5rem] bg-background flex flex-col h-full">
                      <div className="relative h-64 w-full bg-muted">
                        <Image src={item.imageUrl || DEFAULT_FIELD_IMAGE} alt={item.title} fill className="object-cover" />
                        <div className="absolute top-4 right-4 z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><button className="h-10 w-10 bg-background/80 rounded-full flex items-center justify-center shadow-lg"><MoreVertical className="h-5 w-5" /></button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-3 shadow-2xl border-none">
                              <DropdownMenuItem asChild className="rounded-xl h-11 font-bold"><Link href={`/history/${item.id}`}><Eye className="h-4 w-4 mr-2" /> View Audit</Link></DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl h-11 font-bold" onClick={() => openAssignGroup(item)}><FolderInput className="h-4 w-4 mr-2" /> Assign Project</DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl h-11 font-bold text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete Record</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-8">
                           <h3 className="font-black text-2xl tracking-tight text-white truncate">{item.title}</h3>
                           <p className="text-[10px] font-bold text-white/70 uppercase">{item.type === 'area' ? formatArea(item.value, preferredUnit as any) : formatDistance(item.value, 'km')}</p>
                        </div>
                      </div>
                      <CardContent className="p-8 flex flex-col justify-between flex-1">
                        <p className="text-sm text-muted-foreground font-medium line-clamp-2 italic">"{item.description || 'No surveyor remarks.'}"</p>
                        <Button asChild variant="ghost" className="w-full mt-4 h-12 rounded-2xl"><Link href={`/history/${item.id}`} className="flex items-center justify-between px-4 w-full"><span className="font-black text-xs uppercase">Open Audit Details</span><ChevronRight className="h-5 w-5" /></Link></Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })
        ) : <div className="text-center py-32"><p className="text-muted-foreground font-bold uppercase text-[10px]">No records detected.</p></div>}
      </main>
      <Footer />
    </div>
  )
}
