
"use client"

import { useMemo, useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import dynamic from 'next/dynamic'
import { 
  ChevronLeft, 
  Loader2, 
  Printer, 
  Trash2, 
  Pencil, 
  Save, 
  X, 
  MapPin, 
  ShieldCheck, 
  Layout, 
  Maximize2, 
  Minimize2, 
  Plus, 
  Minus, 
  Landmark, 
  Layers, 
  Sparkles, 
  Zap, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  ImageIcon, 
  Target, 
  AlertTriangle, 
  LayoutDashboard, 
  RotateCcw, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Type, 
  TrendingUp,
  ChevronRight,
  Link as LinkIcon,
  ArrowUpDown,
  FolderTree,
  ClipboardList,
  Lock,
  Unlock,
  BadgeInfo,
  AlignLeft,
  History,
  MessageSquare,
  Archive,
  CloudUpload
} from "lucide-react"
import { useUser, useFirestore, useDoc, useCollection, useStorage } from "@/firebase"
import { doc, updateDoc, deleteDoc, collection, query, where, getDoc, setDoc, addDoc, limit, getDocs } from "firebase/firestore"
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { formatArea, formatDistance, Coordinate, calculateCentroid, calculateArea, calculateDistance } from "@/lib/measure-utils"
import { toast } from "@/hooks/use-toast"
import { Footer } from "@/components/layout/Footer"
import { cn } from "@/lib/utils"
import { generateSiteOverview } from "@/ai/flows/generate-site-overview-flow"
import { toPng } from "html-to-image"

const InteractiveMap = dynamic(() => import('@/components/measure/InteractiveMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted flex items-center justify-center font-black uppercase text-[10px] animate-pulse">Initializing Mapping Engine...</div>
})

const COLOR_PALETTE = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#94a3b8' },
  { name: 'Blue', hex: '#2D5BFF' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Black', hex: '#000000' }
];

export default function MeasurementDetailPage() {
  const params = useParams()
  const initialId = Array.isArray(params.id) ? params.id[0] : params.id
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  
  const isLockedRef = useRef(false); 

  const [activeRecordId, setActiveRecordId] = useState<string>(initialId as string)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showReportPreview, setShowReportPreview] = useState(false)
  const [reportImage, setReportImage] = useState<string | null>(null)
  const [isCapturingReport, setIsCapturingReport] = useState(false)
  
  const [mapZoom, setMapZoom] = useState(18)
  const [mapType, setMapType] = useState<'satellite' | 'terrain'>('satellite')
  const [showLabels, setShowLabels] = useState(true)
  const [visibleLayerIds, setVisibleLayerIds] = useState<string[]>([initialId as string])
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number, key: number} | null>(null)
  const [hasInitializedLayers, setHasInitializedLayers] = useState(false)
  const [hierarchySortBy, setHierarchySortBy] = useState<string>("date-desc")

  const [liveViewport, setLiveViewport] = useState<{lat: number, lng: number, zoom: number} | null>(null)
  const [lockedViewport, setLockedViewport] = useState<{lat: number, lng: number, zoom: number} | null>(null)

  const [isManualMode, setIsManualMode] = useState(searchParams.get('edit') === 'true')
  const [editTitle, setEditTitle] = useState("")
  const [editSiteName, setEditSiteName] = useState("")
  const [editDescription, setEditDescription] = useState("") 
  const [editRole, setEditRole] = useState<"perimeter" | "working" | "obstacle">("working")
  const [editClassification, setEditClassification] = useState("")
  const [editColor, setEditColor] = useState("#2D5BFF")
  const [editCoords, setEditCoords] = useState<Coordinate[]>([])
  const [labelPos, setLabelPos] = useState<Coordinate | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isInternalSyncing, setIsInternalSyncing] = useState(false)

  const [currentUsage, setCurrentUsage] = useState("")
  const [managementIntent, setManagementIntent] = useState("")
  const [technicianNotes, setTechnicianNotes] = useState("")
  const [professionalOverview, setProfessionalOverview] = useState("")
  const [subProjectTitle, setSubProjectTitle] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingSummary, setIsSavingSummary] = useState(false)

  const docRef = useMemo(() => (db && user && activeRecordId) ? doc(db, "users", user.uid, "measurements", activeRecordId) : null, [db, user, activeRecordId]);
  const { data: item, loading } = useDoc(docRef);

  const layersQuery = useMemo(() => (db && user && item?.siteName) ? query(collection(db, "users", user.uid, "measurements"), where("siteName", "==", item.siteName)) : null, [db, user, item?.siteName]);
  const { data: projectLayers } = useCollection(layersQuery as any);

  const visibleAudit = useMemo(() => {
    const layers = projectLayers?.filter(l => visibleLayerIds.includes(l.id)) || [];
    const gross = layers.filter(l => l.role === 'perimeter' && l.type === 'area').reduce((acc, l) => acc + l.value, 0);
    const working = layers.filter(l => l.role === 'working' && l.type === 'area').reduce((acc, l) => acc + l.value, 0);
    const obstacle = layers.filter(l => l.role === 'obstacle' && l.type === 'area').reduce((acc, l) => acc + l.value, 0);
    
    const net = working > 0 ? Math.max(0, working - obstacle) : Math.max(0, gross - obstacle);
    const baseline = gross > 0 ? gross : working;
    const efficiency = baseline > 0 ? (net / baseline) * 100 : 0;

    return { gross, working, obstacle, net, efficiency, items: layers };
  }, [projectLayers, visibleLayerIds]);

  const sortedLayers = useMemo(() => {
    if (!projectLayers) return [];
    const layers = [...projectLayers];
    return layers.sort((a, b) => {
      const aTime = new Date(a.timestamp?.toDate?.() || a.timestamp).getTime();
      const bTime = new Date(b.timestamp?.toDate?.() || b.timestamp).getTime();
      const aName = (a.title || "").toLowerCase();
      const bName = (b.title || "").toLowerCase();
      const aColor = (a.boundaryColor || "").toLowerCase();
      const bColor = (b.boundaryColor || "").toLowerCase();

      switch (hierarchySortBy) {
        case 'title-asc': return aName.localeCompare(bName);
        case 'date-asc': return aTime - bTime;
        case 'color': return aColor.localeCompare(bColor);
        case 'date-desc':
        default: return bTime - aTime;
      }
    });
  }, [projectLayers, hierarchySortBy]);

  useEffect(() => {
    if (item && !isInternalSyncing) {
      setEditTitle(item.title || "")
      setEditSiteName(item.siteName || "")
      setEditDescription(item.description || "") 
      setEditRole(item.role || "working")
      setEditClassification(item.classification || "")
      setEditColor(item.boundaryColor || "#2D5BFF")
      setEditCoords(item.coords || [])
      
      if (item.labelLat && item.labelLng) {
        setLabelPos({ lat: item.labelLat, lng: item.labelLng });
      } else if (item.coords?.length > 0) {
        setLabelPos(calculateCentroid(item.coords));
      }

      if (!isLockedRef.current && !hasInitializedLayers) {
        if (item.viewLat && item.viewLng && item.viewZoom) {
          const lock = { lat: item.viewLat, lng: item.viewLng, zoom: item.viewZoom };
          setLockedViewport(lock);
          setMapCenter({ ...lock, key: Date.now() });
          setMapZoom(lock.zoom);
        } else if (item.coords?.length > 0) {
          setMapCenter({ ...calculateCentroid(item.coords), key: Date.now() }); 
        }
        setHasInitializedLayers(true);
      }
    }
  }, [item, isInternalSyncing, hasInitializedLayers, activeRecordId]);

  useEffect(() => {
    if (visibleLayerIds.length === 1 && db && user && user.uid !== 'demo-user-id') {
       const targetId = visibleLayerIds[0];
       const target = projectLayers?.find(l => l.id === targetId);
       if (target) {
          const summaryId = `${target.siteName}_${target.title}`.replace(/[^a-zA-Z0-9]/g, '_');
          getDoc(doc(db, "users", user.uid, "siteSummaries", summaryId)).then(snap => {
            if (snap.exists()) {
              const data = snap.data();
              setCurrentUsage(data.currentUsage || "");
              setManagementIntent(data.managementIntent || "");
              setProfessionalOverview(data.professionalOverview || "");
            }
          });
       }
    }
  }, [visibleLayerIds.length, db, user, projectLayers]);

  const handleUpdateRecord = async () => {
    if (!db || !user || !activeRecordId) return;
    setIsSaving(true);
    setIsInternalSyncing(true);
    try {
      let finalValue = item?.value || 0;
      if (editCoords.length > 0) {
        if (item?.type === 'area') finalValue = calculateArea(editCoords);
        else {
          let d = 0;
          for (let i = 0; i < editCoords.length - 1; i++) d += calculateDistance(editCoords[i], editCoords[i+1]);
          finalValue = d;
        }
      }
      await updateDoc(doc(db, "users", user.uid, "measurements", activeRecordId), {
        title: editTitle, siteName: editSiteName, description: editDescription,
        role: editRole, classification: editClassification, boundaryColor: editColor,
        coords: editCoords, labelLat: labelPos?.lat || null, labelLng: labelPos?.lng || null,
        viewLat: lockedViewport?.lat || null, viewLng: lockedViewport?.lng || null, viewZoom: lockedViewport?.zoom || null,
        value: finalValue, updatedAt: new Date().toISOString()
      });
      toast({ title: "Record Saved" });
      setIsManualMode(false);
    } finally { 
      setIsSaving(false); 
      setTimeout(() => setIsInternalSyncing(false), 800);
    }
  };

  const handleLabelMove = async (recordId: string, coord: Coordinate) => {
    if (!db || !user) return;
    setIsInternalSyncing(true);
    if (activeRecordId !== recordId) setActiveRecordId(recordId);
    setLabelPos(coord);
    const rRef = doc(db, "users", user.uid, "measurements", recordId);
    updateDoc(rRef, {
      labelLat: coord.lat,
      labelLng: coord.lng,
      updatedAt: new Date().toISOString()
    }).then(() => {
       setTimeout(() => { setIsInternalSyncing(false); }, 800);
    }).catch(() => { setIsInternalSyncing(false); });
  };

  const handleSaveSummary = async (showToast = true) => {
    if (!db || !user || !item) return;

    if (visibleLayerIds.length > 1 && !subProjectTitle.trim()) {
      toast({ variant: "destructive", title: "Title Required", description: "Audit summaries require a linked category title." });
      return;
    }

    setIsSavingSummary(true);
    try {
      const viewportData = lockedViewport ? { viewLat: lockedViewport.lat, viewLng: lockedViewport.lng, viewZoom: lockedViewport.zoom } : {};

      if (visibleLayerIds.length === 1) {
        const targetId = visibleLayerIds[0];
        const target = projectLayers?.find(l => l.id === targetId);
        if (target) {
          const summaryId = `${target.siteName}_${target.title}`.replace(/[^a-zA-Z0-9]/g, '_');
          await setDoc(doc(db, "users", user.uid, "siteSummaries", summaryId), {
            siteName: target.siteName, title: target.title,
            currentUsage, managementIntent, professionalOverview,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          if (lockedViewport) {
             await updateDoc(doc(db, "users", user.uid, "measurements", targetId), viewportData);
          }
          if (showToast) toast({ title: "Site Profile Updated" });
        }
      }
    } finally { setIsSavingSummary(false); }
  };

  const handleGenerateOverview = async () => {
    if (!item) return;
    setIsGenerating(true);
    try {
      const res = await generateSiteOverview({
        siteName: subProjectTitle || item.siteName || "This Site",
        totalArea: formatArea(visibleAudit.net, 'acres'), efficiency: visibleAudit.efficiency,
        currentUsage, managementIntent,
        layerDetails: visibleAudit.items.map(l => `${l.title} (${l.role})`)
      });
      setProfessionalOverview(res.professionalOverview);
    } finally { setIsGenerating(false); }
  };

  const toggleLayer = (layerId: string) => {
    setVisibleLayerIds(prev => {
      const isVisible = prev.includes(layerId);
      const next = isVisible ? prev.filter(lid => lid !== layerId) : [...prev, layerId];
      if (isVisible && layerId === activeRecordId && next.length > 0) {
        setActiveRecordId(next[next.length - 1]);
      }
      return next;
    });
  };

  const selectActiveRecord = (recordId: string) => {
    setActiveRecordId(recordId);
    if (!visibleLayerIds.includes(recordId)) setVisibleLayerIds(prev => [...prev, recordId]);
  };

  const handleLockView = () => {
    if (liveViewport) {
      setLockedViewport(liveViewport);
      toast({ title: "Viewport Locked", description: "Map center and zoom saved for this audit." });
    }
  };

  const handleRecenter = () => {
    if (lockedViewport) {
      setMapCenter({ lat: lockedViewport.lat, lng: lockedViewport.lng, key: Date.now() });
      setMapZoom(lockedViewport.zoom);
      toast({ title: "Restored Locked View" });
    } else {
      const center = calculateCentroid(visibleAudit.items.flatMap(i => i.coords));
      setMapCenter({ ...center, key: Date.now() });
      toast({ title: "Auto-Fit View" });
    }
  };

  if (loading || !item) return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const classifications = ["Arable Land", "Pasture", "Silage", "Wheat", "Barley", "Woodland", "Water Body", "Building Footprint", "Access Road", "Development Site", "Commercial Unit", "Car Parking", "Other"];

  return (
    <div className={cn("flex-1 bg-background overflow-auto flex flex-col relative pb-20", isFullScreen && "fixed inset-0 z-[100] h-screen w-screen bg-background")}>
      <header className="p-4 flex items-center justify-between border-b bg-background/90 backdrop-blur-xl z-[110] print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/history")} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex flex-col">
             <div className="flex items-center gap-2"><Landmark className="h-3.5 w-3.5 text-primary" /><span className="font-black text-[10px] uppercase tracking-widest text-primary">{item.siteName}</span></div>
             <h1 className="font-black text-xl tracking-tight leading-tight uppercase">{item.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant={isManualMode ? "default" : "outline"} className="rounded-xl h-10 gap-2 font-black uppercase text-[10px]" onClick={() => setIsManualMode(!isManualMode)}><Pencil className="h-4 w-4" /> {isManualMode ? "Exit Edit" : "Precision Edit"}</Button>
           <Button variant={showReportPreview ? "default" : "outline"} className="rounded-xl h-10 gap-2 font-black uppercase text-[10px]" onClick={async () => {
              if (!showReportPreview && mapContainerRef.current) {
                setIsCapturingReport(true);
                if (lockedViewport) {
                  setMapCenter({ ...lockedViewport, key: Date.now() });
                  setMapZoom(lockedViewport.zoom);
                  await new Promise(resolve => setTimeout(resolve, 800));
                }
                const dataUrl = await toPng(mapContainerRef.current, { quality: 1, pixelRatio: 2, fontEmbedCSS: '' });
                setReportImage(dataUrl);
                setShowReportPreview(true);
                setIsCapturingReport(false);
              } else {
                setShowReportPreview(false);
              }
           }} disabled={isCapturingReport}>
             {isCapturingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layout className="h-4 w-4" />}
             {showReportPreview ? "Hide Report" : "Generate Report"}
           </Button>
           <Button variant="outline" size="icon" className="rounded-xl h-10 w-10" onClick={() => setIsFullScreen(!isFullScreen)}>{isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</Button>
        </div>
      </header>

      <div className="flex-1 relative">
        {!showReportPreview ? (
          <main className="flex-1 flex flex-col">
             <div className={cn("relative w-full aspect-[21/9] min-h-[600px] bg-muted border-b overflow-hidden", isFullScreen && "fixed inset-0 z-[100] h-screen w-screen")}>
                <div className="absolute inset-0" ref={mapContainerRef}>
                   <InteractiveMap 
                     activeRecordId={activeRecordId} centerPos={mapCenter} coords={visibleLayerIds.includes(activeRecordId) ? editCoords : []} 
                     mode={item.type} mapType={mapType} zoom={mapZoom} onZoomChange={setMapZoom} 
                     showHistory={true} historyOverlays={projectLayers || []} visibleLayerIds={visibleLayerIds} 
                     pinColor={editColor} isManualMode={isManualMode} showLabels={showLabels}
                     onMarkerMove={(i, c) => setEditCoords(prev => { const n = [...prev]; n[i] = c; return n; })}
                     onMarkerDelete={(i) => setEditCoords(prev => prev.filter((_, idx) => idx !== i))}
                     onVertexInsert={(i, c) => setEditCoords(prev => { const n = [...prev]; n.splice(i, 0, c); return n; })}
                     onLabelMove={handleLabelMove} labelPos={labelPos} onRecordClick={(rid) => selectActiveRecord(rid)}
                     onViewportChange={(lat, lng, zoom) => setLiveViewport({ lat, lng, zoom })}
                   />
                </div>
                <div className="absolute top-6 right-6 z-[500] pointer-events-none flex flex-col items-end gap-2">
                   <Button variant={lockedViewport ? "default" : "secondary"} size="icon" className="h-12 w-12 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto" onClick={handleRecenter} title={lockedViewport ? "Recenter to Lock" : "Auto-Fit"}>
                      <Target className={cn("h-6 w-6", lockedViewport && "text-primary-foreground")} />
                   </Button>
                   <Button variant={lockedViewport ? "default" : "secondary"} size="icon" className="h-12 w-12 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto" onClick={handleLockView} title="Lock Current Map View">
                      {lockedViewport ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
                   </Button>
                   <div className="h-2" />
                   <Button variant={showLabels ? "default" : "secondary"} size="icon" className="h-12 w-12 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto" onClick={() => setShowLabels(!showLabels)}><Type className="h-6 w-6" /></Button>
                   <Button variant="secondary" size="icon" className="h-12 w-12 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto" onClick={() => setMapType(mapType === 'satellite' ? 'terrain' : 'satellite')}>{mapType === 'satellite' ? <Layers className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}</Button>
                </div>
                {lockedViewport && (
                  <div className="absolute top-6 left-6 z-[500] pointer-events-none">
                     <Badge className="bg-primary/90 text-white backdrop-blur-md border-none px-4 py-1.5 font-black uppercase text-[9px] tracking-widest flex items-center gap-2 shadow-2xl">
                        <Lock className="h-3 w-3" /> View Locked
                     </Badge>
                  </div>
                )}
             </div>

             <div className="max-w-7xl mx-auto w-full px-6 py-12 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                   <div className="lg:col-span-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Project Hierarchy</h3>
                        <div className="flex items-center gap-2">
                          <Select value={hierarchySortBy} onValueChange={setHierarchySortBy}>
                            <SelectTrigger className="h-9 rounded-xl font-bold bg-muted/30 border-none text-[10px] uppercase w-40">
                              <div className="flex items-center gap-2"><ArrowUpDown className="h-3 w-3" /><SelectValue /></div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                              <SelectItem value="date-desc">Newest First</SelectItem>
                              <SelectItem value="date-asc">Oldest First</SelectItem>
                              <SelectItem value="title-asc">Title A-Z</SelectItem>
                              <SelectItem value="color">Category Color</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Card className="border-none shadow-xl rounded-[2.5rem] bg-muted/30 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedLayers.map(layer => {
                          const inAudit = visibleLayerIds.includes(layer.id);
                          return (
                            <div 
                              key={layer.id} 
                              className={cn(
                                "flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer", 
                                inAudit ? "bg-background shadow-lg border-primary/20 scale-[1.02]" : "bg-transparent opacity-50", 
                                activeRecordId === layer.id && "ring-2 ring-primary"
                              )} 
                              onClick={() => selectActiveRecord(layer.id)}
                            >
                               <div className="flex items-center gap-4">
                                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: activeRecordId === layer.id ? editColor : (layer.boundaryColor || '#2D5BFF') }} />
                                  <div>
                                     <p className="text-xs font-black truncate max-w-[120px] uppercase">{layer.title}</p>
                                     <p className="text-[8px] font-bold text-muted-foreground">{layer.role}</p>
                                  </div>
                               </div>
                               <button onClick={(e) => { e.stopPropagation(); toggleLayer(layer.id); }} className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-colors", inAudit ? "bg-primary/10 text-primary" : "hover:bg-muted")}>
                                  {inAudit ? <CheckCircle2 className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                               </button>
                            </div>
                          );
                        })}
                      </Card>
                   </div>
                   <div className="lg:col-span-4 space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Site Productivity</h3>
                      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-secondary text-secondary-foreground p-10 flex flex-col justify-between h-[300px] relative overflow-hidden">
                         <div className="relative z-10 space-y-6">
                            <p className="text-[11px] font-black uppercase tracking-widest text-primary-foreground/60">Net Functional Area</p>
                            <h4 className="text-5xl font-black font-headline tracking-tighter">{formatArea(Math.abs(visibleAudit.net), 'acres')}</h4>
                            <Progress value={visibleAudit.efficiency} className="h-1.5 bg-white/10" />
                         </div>
                         <TrendingUp className="absolute -right-6 -bottom-6 h-32 w-32 opacity-10" />
                      </Card>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><LayoutDashboard className="h-4 w-4 text-primary" /> Sub-Project Synthesis</h2>
                      </div>
                   </div>
                   <Card className="border-none shadow-2xl rounded-[3rem] bg-background p-10 space-y-8">
                      {visibleLayerIds.length > 1 && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                           <div className="flex items-center justify-between mb-2">
                              <Label className="text-[11px] font-black uppercase text-primary ml-1 flex items-center gap-2">Linked Category Title</Label>
                              {lockedViewport && <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/30 text-primary">Map Frame Locked</Badge>}
                           </div>
                           <Input value={subProjectTitle} onChange={e => setSubProjectTitle(e.target.value)} className="h-14 rounded-2xl text-xl font-black bg-primary/5 border-primary/20 uppercase" placeholder="e.g. Field 8 North Audit" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Current Usage Status</Label><Textarea value={currentUsage} onChange={e => setCurrentUsage(e.target.value)} placeholder="Summarize operations..." className="min-h-[200px] rounded-2xl bg-muted/40 font-bold p-8 text-lg" /></div>
                         <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Strategic Intent</Label><Textarea value={managementIntent} onChange={e => setManagementIntent(e.target.value)} placeholder="Future goals..." className="min-h-[200px] rounded-2xl bg-muted/40 font-bold p-8 text-lg" /></div>
                      </div>
                      <div className="space-y-4">
                         <Label className="text-[11px] font-black uppercase tracking-widest text-primary">AI Professional Summary</Label>
                         <Textarea value={professionalOverview} onChange={e => setProfessionalOverview(e.target.value)} className="min-h-[200px] rounded-[2.5rem] bg-primary/5 p-10 italic text-lg shadow-inner" />
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button variant="outline" className="h-16 rounded-2xl font-black uppercase text-xs gap-3 border-primary/20 text-primary hover:bg-primary/5" onClick={handleGenerateOverview} disabled={isGenerating}>{isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />} Synthesize Profile</Button>
                            <Button className="h-16 rounded-2xl font-black uppercase text-xs gap-3 shadow-2xl" onClick={() => handleSaveSummary()} disabled={isSavingSummary}>{isSavingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} Commit to Site Profile</Button>
                         </div>
                      </div>
                   </Card>
                </div>

                <div className="space-y-8">
                   <div className="flex items-center justify-between"><h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Pencil className="h-4 w-4 text-primary" /> Survey Record Management</h2><div className="flex gap-2"><Button variant="outline" className="rounded-xl h-11 font-bold px-6 text-destructive" onClick={async () => { if (!confirm("Permanently delete component?")) return; await deleteDoc(docRef!); router.push("/history"); }}><Trash2 className="h-4 w-4 mr-2" /> Delete Record</Button><Button className="rounded-xl h-11 font-black uppercase text-[11px] px-10" onClick={handleUpdateRecord} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Finalize Record</Button></div></div>
                   <Card className="border-none shadow-xl rounded-[2.5rem] bg-muted/30 p-10 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60">Survey Title</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-14 rounded-2xl text-xl font-black uppercase" /></div>
                         <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60">Project Site Reference</Label><Input value={editSiteName} onChange={e => setEditSiteName(e.target.value)} className="h-14 rounded-2xl font-bold uppercase" /></div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                         <RadioGroup value={editRole} onValueChange={(v: any) => setEditRole(v)} className="grid grid-cols-1 gap-2">
                            {['perimeter', 'working', 'obstacle'].map(r => (
                              <Label key={r} className={cn("flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer bg-background", editRole === r ? "border-primary shadow-md" : "opacity-60")}>
                                 <div className="flex items-center gap-4"><div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white", r === 'perimeter' ? 'bg-black' : r === 'working' ? 'bg-green-600' : 'bg-red-600')}>{r === 'perimeter' ? <ShieldCheck className="h-5 w-5" /> : r === 'working' ? <LayoutDashboard className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}</div><span className="text-xs font-black uppercase">{r} area</span></div>
                                 <RadioGroupItem value={r} className="sr-only" />
                              </Label>
                            ))}
                         </RadioGroup>
                         <div className="space-y-8">
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60">Land Classification</Label><Select value={editClassification} onValueChange={setEditClassification}><SelectTrigger className="h-14 rounded-2xl font-bold"><SelectValue /></SelectTrigger><SelectContent>{classifications.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                            <div className="grid grid-cols-4 gap-3">{COLOR_PALETTE.map(c => <button key={c.hex} onClick={() => setEditColor(c.hex)} className={cn("h-12 rounded-xl border-2 shadow-md", editColor === c.hex ? "border-primary scale-95" : "border-white")} style={{ backgroundColor: c.hex }}>{editColor === c.hex && <ShieldCheck className={cn("h-5 w-5 mx-auto", c.hex === '#FFFFFF' ? 'text-black' : 'text-white')} />}</button>)}</div>
                         </div>
                      </div>
                      <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60">Technical Surveyor Notes (Specific Layer)</Label><Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="rounded-[2.5rem] min-h-[180px] p-8 text-sm" /></div>
                   </Card>
                </div>
             </div>
          </main>
        ) : (
          <div className="flex-1 bg-muted/30 p-8 flex flex-col items-center gap-8 overflow-auto">
            <div className="flex gap-4 print:hidden sticky top-0 z-[120] bg-background/50 backdrop-blur-md p-4 rounded-2xl shadow-xl border">
              <Button variant="outline" className="rounded-xl font-bold h-12 px-8" onClick={() => setShowReportPreview(false)}>Exit Preview</Button>
              <Button className="rounded-xl font-black uppercase tracking-widest text-xs h-12 px-10 shadow-xl gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print PDF Audit
              </Button>
            </div>
            <div className="w-full max-w-[210mm] mb-20">
               <ReportContent 
                 item={item} 
                 subProjectTitle={subProjectTitle} 
                 professionalOverview={professionalOverview} 
                 currentUsage={currentUsage} 
                 managementIntent={managementIntent} 
                 technicianNotes={technicianNotes}
                 auditData={visibleAudit} 
                 reportImage={reportImage} 
                 userName={user?.displayName} 
                 userUid={user?.uid} 
               />
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

function ReportContent({ item, subProjectTitle, professionalOverview, currentUsage, managementIntent, technicianNotes, auditData, reportImage, userName, userUid }: any) {
  return (
    <div id="print-area" className="flex flex-col">
      <div className="a4-page">
        <header className="flex justify-between items-start border-b-[6px] border-black pb-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-black flex items-center justify-center text-white"><MapPin className="h-6 w-6" /></div>
               <h1 className="text-3xl font-black tracking-tighter uppercase font-headline">{item?.siteName || "General Site"}</h1>
            </div>
            <div className="space-y-1">
               <p className="text-sm font-black text-primary uppercase tracking-widest">{subProjectTitle || item?.title || "Technical Site Audit"}</p>
            </div>
          </div>
          <div className="text-right space-y-2">
             <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Report Transmitted</p>
             <p className="font-black text-lg">{format(new Date(), 'PPP')}</p>
             <Badge variant="outline" className="border-black border-2 font-black text-[9px] uppercase tracking-widest">Page 01 | Executive</Badge>
          </div>
        </header>

        <section className="space-y-6">
           <h2 className="text-xs font-black uppercase tracking-[0.3em] border-b pb-2">I. Professional Management Profile</h2>
           <div className="bg-gray-50 p-8 border-2 border-black rounded-xl">
              <p className="text-lg font-medium leading-relaxed italic text-gray-800 break-words">{professionalOverview || "Technical overview pending agent synthesis."}</p>
           </div>
        </section>
      </div>

      <div className="a4-page">
        <header className="flex justify-between items-end border-b-2 border-black pb-4 mb-8">
           <h2 className="text-xl font-black uppercase tracking-tight">II. Spatial Context & GPS Geometry</h2>
           <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Page 02 | Visualization</span>
        </header>

        <section className="space-y-8">
           {reportImage && (
             <div className="relative h-[120mm] w-full border-4 border-black rounded-2xl overflow-hidden shadow-xl bg-gray-100">
                <img src={reportImage} className="w-full h-full object-cover" alt="Audit Map" />
             </div>
           )}

           <div className="grid grid-cols-2 gap-10 pt-6">
              <div className="space-y-6">
                 <h2 className="text-xs font-black uppercase tracking-[0.3em] border-b pb-2">III. Utilization Rating</h2>
                 <div className="bg-black text-white p-8 space-y-2 shadow-2xl rounded-xl">
                    <p className="text-[11px] font-black uppercase tracking-widest opacity-60">Net Productive Estate</p>
                    <span className="text-5xl font-black font-headline tracking-tighter">{formatArea(Math.abs(auditData.net), 'acres')}</span>
                 </div>
                 <div className="bg-gray-50 p-6 border-l-[10px] border-black space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"><span>Portfolio Efficiency</span><span>{auditData.efficiency?.toFixed(1)}%</span></div>
                    <div className="h-3 w-full bg-gray-200 overflow-hidden rounded-full"><div className="h-full bg-black" style={{ width: `${auditData.efficiency}%` }} /></div>
                 </div>
              </div>
              <div className="space-y-6">
                 <h2 className="text-xs font-black uppercase tracking-[0.3em] border-b pb-2">IV. Master Metrics</h2>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between border-b py-2"><span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Total Asset Gross</span><span className="font-bold">{formatArea(auditData.gross, 'acres')}</span></div>
                    <div className="flex justify-between border-b py-2"><span className="text-[10px] font-black uppercase tracking-widest">Functional Area</span><span className="font-bold">{formatArea(auditData.working, 'acres')}</span></div>
                    <div className="flex justify-between border-b py-2 text-red-600"><span className="text-[10px] font-black uppercase tracking-widest">Internal Exclusions</span><span className="font-bold">-{formatArea(auditData.obstacle, 'acres')}</span></div>
                    <div className="flex justify-between py-2"><span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Layers Included</span><span className="font-bold">{(auditData.items?.length || 0)} Components</span></div>
                 </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  )
}
