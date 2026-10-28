
"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import dynamic from 'next/dynamic'
import { useRouter } from "next/navigation"
import { 
  Play, 
  Square, 
  Save, 
  Ruler, 
  RotateCcw, 
  Navigation, 
  Compass, 
  Crosshair, 
  Map as MapIcon, 
  Pencil, 
  X, 
  Loader2, 
  RefreshCw, 
  Landmark, 
  Layers,
  Camera,
  Maximize2,
  Minimize2,
  ChevronLeft,
  MapPin,
  Search,
  Target,
  Home,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
  Zap,
  ChevronRight,
  ImageIcon,
  Type
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coordinate, calculateArea, calculateDistance, formatArea, formatDistance, calculateCentroid } from "@/lib/measure-utils"
import { useFirestore, useUser, useStorage, useCollection } from "@/firebase"
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { toPng } from "html-to-image"
import { useSidebar } from "@/components/ui/sidebar"
import { Slider } from "@/components/ui/slider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Footer } from "@/components/layout/Footer"

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

export default function MeasurePage() {
  const [coords, setCoords] = useState<Coordinate[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [mode, setMode] = useState<'area' | 'line'>('area')
  const [inputType, setInputType] = useState<'gps' | 'manual'>('gps')
  const [currentPos, setCurrentPos] = useState<Coordinate | null>(null)
  const [centerPos, setCenterPos] = useState<{lat: number, lng: number, key: number} | null>(null)
  const [measurementResult, setMeasurementResult] = useState<number | null>(null)
  const [mapZoom, setMapZoom] = useState(18)
  const [mapType, setMapType] = useState<'satellite' | 'terrain'>('satellite')
  const [isAutoFollow, setIsAutoFollow] = useState(true)
  const [showHistoryOverlay, setShowHistoryOverlay] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isTopPanelVisible, setIsTopPanelVisible] = useState(false)

  const [isLeftVisible, setIsLeftVisible] = useState(true)
  const [isRightVisible, setIsRightVisible] = useState(true)

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  
  const [saveSiteName, setSaveSiteName] = useState("")
  const [saveTitle, setSaveTitle] = useState("")
  const [saveDescription, setSaveDescription] = useState("")
  const [saveClassification, setSaveClassification] = useState("")
  const [customClassification, setCustomClassification] = useState("")
  const [saveBoundaryColor, setSaveBoundaryColor] = useState("#2D5BFF")
  const [saveRole, setSaveRole] = useState<"perimeter" | "working" | "obstacle">("working")
  const [isSaving, setIsSaving] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const watchIdRef = useRef<number | null>(null)
  const router = useRouter()
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const { setOpen } = useSidebar()

  const [userProfile, setUserProfile] = useState<any>(null)
  useEffect(() => {
    if (user && db && user.uid !== 'demo-user-id') {
      getDoc(doc(db, "users", user.uid)).then(snap => { if (snap.exists()) setUserProfile(snap.data()); });
    }
  }, [user, db]);

  const homeBasePos = useMemo(() => {
    if (!userProfile?.baseLocation) return null;
    const match = userProfile.baseLocation.match(/([-+]?\d{1,2}\.?\d*),\s*([-+]?\d{1,3}\.?\d*)/);
    return match ? { lat: parseFloat(match[1]), lng: parseFloat(match[2]) } : null;
  }, [userProfile]);

  const wakeLockRef = useRef<any>(null);
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err: any) {}
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRecording) requestWakeLock();
    else releaseWakeLock();
    return () => { releaseWakeLock(); };
  }, [isRecording, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible' && isRecording) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRecording, requestWakeLock]);

  const hasAutoCentered = useRef<'gps' | 'home' | null>(null);
  useEffect(() => {
    if (authLoading) return;
    if (currentPos && hasAutoCentered.current !== 'gps') {
      setCenterPos({ ...currentPos, key: Date.now() });
      hasAutoCentered.current = 'gps';
    } else if (homeBasePos && !hasAutoCentered.current) {
      setCenterPos({ ...homeBasePos, key: Date.now() });
      hasAutoCentered.current = 'home';
    }
  }, [currentPos, homeBasePos, authLoading]);

  const historyQuery = useMemo(() => (db && user && user.uid !== 'demo-user-id') ? collection(db, "users", user.uid, "measurements") : null, [db, user]);
  const { data: cloudHistory } = useCollection(historyQuery as any);
  const historyData = user?.uid === 'demo-user-id' ? [] : (cloudHistory || []);

  const projects = useMemo(() => Array.from(new Set(historyData.map(h => h.siteName || "General"))).sort(), [historyData]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    const success = (pos: GeolocationPosition) => {
      const newCoord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCurrentPos(newCoord);
    };
    const id = navigator.geolocation.watchPosition(success, () => {}, { enableHighAccuracy: true });
    watchIdRef.current = id;
  }, []);

  useEffect(() => { 
    if (inputType === 'gps') requestLocation(); 
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); }; 
  }, [inputType, requestLocation]);

  useEffect(() => {
    if (isRecording && currentPos && inputType === 'gps') {
      setCoords(prev => {
        const last = prev[prev.length - 1];
        if (!last || Math.abs(last.lat - currentPos.lat) > 0.000001 || Math.abs(last.lng - currentPos.lng) > 0.000001) {
          return [...prev, { lat: Number(currentPos.lat), lng: Number(currentPos.lng) }];
        }
        return prev;
      });
    }
  }, [currentPos, isRecording, inputType]);

  const startTracking = () => { 
    setIsRecording(true); 
    setCoords([]); 
    setMeasurementResult(null); 
  };
  
  const stopTracking = () => {
    setIsRecording(false);
    if (coords.length < 2) return;
    if (mode === 'area' && coords.length >= 3) setMeasurementResult(calculateArea(coords));
    else if (mode === 'line') {
      let d = 0;
      for (let i = 0; i < coords.length - 1; i++) d += calculateDistance(coords[i], coords[i+1]);
      setMeasurementResult(d);
    }
    if (coords.length > 0) { 
      setIsAutoFollow(false); 
      setCenterPos({ ...calculateCentroid(coords), key: Date.now() }); 
    }
  };

  /**
   * Helper to restrict specific functions to registered users.
   */
  const restrictedAction = (fn: () => void) => {
    if (!user) {
      toast({
        title: "Registered User Function",
        description: "Please sign in or create an account to use this professional feature.",
        action: (
          <Button variant="default" size="sm" className="rounded-lg font-black uppercase text-[10px]" onClick={() => router.push('/login')}>Sign In</Button>
        )
      });
      return;
    }
    fn();
  };

  const jumpToBase = () => { 
    if (homeBasePos) { 
      setIsAutoFollow(false);
      setCenterPos({ ...homeBasePos, key: Date.now() }); 
      toast({ title: "Home Focus", description: "Map centered on property base." });
    } else { 
      toast({ title: "No Base Set", description: "Configure Property Location in your profile." }); 
    } 
  };

  const snapToLiveGPS = () => {
    setIsAutoFollow(true);
    if (!currentPos) {
      toast({ title: "Locating...", description: "Searching for high-accuracy GPS lock." });
    } else {
      setCenterPos({ ...currentPos, key: Date.now() });
      toast({ title: "Live Tracking", description: "Map following device location." });
    }
    requestLocation();
  };

  const centerView = () => {
    let target: {lat: number, lng: number} | null = null;
    if (coords.length > 0) {
      target = calculateCentroid(coords);
      setIsAutoFollow(false);
    } else if (currentPos) {
      target = currentPos;
      setIsAutoFollow(true);
    }
    
    if (target) {
      setCenterPos({ ...target, key: Date.now() });
      toast({ title: "View Centered" });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setIsAutoFollow(false);
    try {
      const match = searchQuery.match(/^([-+]?\d{1,2}\.?\d*),\s*([-+]?\d{1,3}\.?\d*)$/);
      if (match) { 
        setCenterPos({ lat: parseFloat(match[1]), lng: parseFloat(match[2]), key: Date.now() }); 
        setIsSearchDialogOpen(false); 
        return; 
      }
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await res.json();
      if (data?.[0]) { 
        setCenterPos({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), key: Date.now() }); 
        setIsSearchDialogOpen(false); 
      }
    } finally { setIsSearching(false); }
  };

  const takeSnapshot = async () => {
    if (!mapContainerRef.current) return;
    try {
      const dataUrl = await toPng(mapContainerRef.current, { 
        quality: 0.9, 
        pixelRatio: 1.5,
        fontEmbedCSS: '', 
        filter: (node: HTMLElement) => {
          if (node.tagName === 'SCRIPT') return false;
          if (node.classList?.contains('leaflet-control-zoom')) return false;
          if (node.classList?.contains('leaflet-control-attribution')) return false;
          return true;
        }
      });
      const link = document.createElement('a');
      link.download = `GeoMapping_Snapshot_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Snapshot Captured" });
    } catch (e) {
      toast({ variant: "destructive", title: "Capture Restricted" });
    }
  };

  useEffect(() => {
    if (saveRole === 'perimeter') setSaveBoundaryColor("#000000");
    else if (saveRole === 'working') setSaveBoundaryColor("#16a34a");
    else if (saveRole === 'obstacle') setSaveBoundaryColor("#dc2626");
  }, [saveRole]);

  const handleSave = async () => {
    if (!user || measurementResult === null || !db) return;
    setIsSaving(true);
    let mapUrl = "";
    if (mapContainerRef.current) {
      try {
        const dataUrl = await toPng(mapContainerRef.current, { quality: 0.8, pixelRatio: 1, fontEmbedCSS: '' });
        if (storage) {
          const sRef = storageRef(storage, `users/${user.uid}/measurements/${Date.now()}.png`);
          await uploadString(sRef, dataUrl, 'data_url');
          mapUrl = await getDownloadURL(sRef);
        }
      } catch (e) {}
    }

    const finalClassification = saveClassification === 'OTHER' ? customClassification : saveClassification;

    const payload = {
      siteName: saveSiteName || "General",
      title: saveTitle || "New Survey",
      description: saveDescription,
      type: mode,
      role: saveRole,
      value: Number(measurementResult),
      coords: coords.map(c => ({ lat: Number(c.lat), lng: Number(c.lng) })),
      imageUrl: mapUrl,
      timestamp: serverTimestamp(),
      locationLabel: coords.length > 0 ? `${coords[0].lat.toFixed(4)}, ${coords[0].lng.toFixed(4)}` : "Manual",
      boundaryColor: saveBoundaryColor,
      classification: finalClassification || "Other"
    };
    await addDoc(collection(db, "users", user.uid, "measurements"), payload);
    setIsSaving(false); setIsSaveDialogOpen(false); reset();
    toast({ title: "Saved to Vault" });
  };

  const reset = () => { 
    setCoords([]); 
    setMeasurementResult(null); 
    setIsRecording(false); 
    setIsAutoFollow(true); 
    setMapZoom(18); 
    setCenterPos(null); 
    hasAutoCentered.current = null;
  };
  const toggleFullScreen = () => { setIsFullScreen(!isFullScreen); setOpen(isFullScreen); };

  const areaUnits = userProfile?.preferredAreaUnits || ['acres', 'hectares', 'sqm'];
  const distUnits = userProfile?.preferredDistanceUnits || ['km', 'miles'];

  const classifications = [
    "Arable Land", "Pasture", "Silage", "Wheat", "Barley", "Woodland", 
    "Water Body", "Building Footprint", "Access Road", "Development Site", 
    "Commercial Unit", "Car Parking", "OTHER"
  ];

  return (
    <div className={cn("flex-1 relative bg-background overflow-hidden flex flex-col", isFullScreen && "fixed inset-0 z-[100] h-screen w-screen")}>
      {isSaving && <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="font-black uppercase tracking-widest text-xs">Finalizing Records...</p></div>}

      <div className="flex-1 relative">
        <div className="absolute inset-0 z-0" ref={mapContainerRef}>
          <InteractiveMap 
            currentPos={currentPos} centerPos={centerPos} homePos={homeBasePos} coords={coords} mode={mode} 
            inputType={inputType} zoom={mapZoom} onZoomChange={setMapZoom} mapType={mapType}
            onMapClick={(c) => { if (isRecording && inputType === 'manual') setCoords(prev => [...prev, { lat: Number(c.lat), lng: Number(c.lng) }]); }}
            onMarkerMove={(i, c) => setCoords(prev => { const n = [...prev]; n[i] = { lat: Number(c.lat), lng: Number(c.lng) }; return n; })}
            onMarkerDelete={(i) => setCoords(prev => prev.filter((_, idx) => idx !== i))}
            onVertexInsert={(i, c) => setCoords(prev => { const n = [...prev]; n.splice(i, 0, c); return n; })}
            isManualMode={isRecording && inputType === 'manual'} 
            isRecording={isRecording}
            showHistory={showHistoryOverlay} showLabels={showLabels} historyOverlays={historyData}
            pinType={userProfile?.pinType} pinColor={userProfile?.pinColor} disableAutoFit={!isAutoFollow}
          />
        </div>

        {!isRecording && (
          <div className="absolute top-4 left-0 right-0 z-[500] pointer-events-none flex flex-col items-center gap-2">
             <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl shadow-xl backdrop-blur-md border border-white/20 pointer-events-auto" onClick={() => setIsTopPanelVisible(!isTopPanelVisible)}>
                {isTopPanelVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
             </Button>
             <Card className={cn("bg-background/80 backdrop-blur-md border-none shadow-2xl rounded-2xl p-4 transition-all duration-300 origin-top overflow-hidden pointer-events-auto", isTopPanelVisible ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 invisible")}>
                <div className="flex flex-col gap-6 min-w-[200px]">
                   <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Map Feed</p>
                      <div className="flex bg-muted/50 p-1 rounded-xl gap-1">
                         <Button variant={mapType === 'satellite' ? 'default' : 'ghost'} size="sm" className="flex-1 h-8 text-[10px] font-black uppercase rounded-lg" onClick={() => setMapType('satellite')}>Satellite</Button>
                         <Button variant={mapType === 'terrain' ? 'default' : 'ghost'} size="sm" className="flex-1 h-8 text-[10px] font-black uppercase rounded-lg" onClick={() => setMapType('terrain')}>Terrain</Button>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                         <span>Precision Zoom</span>
                         <span className="text-primary">{mapZoom.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={() => setMapZoom(prev => Math.max(prev-0.5, 1))}><Minus className="h-4 w-4" /></Button>
                         <Slider value={[mapZoom]} min={1} max={22} step={0.1} onValueChange={([v]) => setMapZoom(v)} className="flex-1" />
                         <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={() => setMapZoom(prev => Math.min(prev+0.5, 22))}><Plus className="h-4 w-4" /></Button>
                      </div>
                   </div>
                </div>
             </Card>
          </div>
        )}

        {!isRecording && (
          <div className="absolute top-4 left-4 z-[500] flex flex-col items-start gap-2">
             <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl shadow-xl backdrop-blur-md pointer-events-auto" onClick={() => setIsLeftVisible(!isLeftVisible)}>{isLeftVisible ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</Button>
             <Card className={cn("bg-background/80 backdrop-blur-md shadow-2xl border-none rounded-2xl p-1 transition-all origin-left pointer-events-auto", !isLeftVisible && "scale-x-0 opacity-0 invisible")}>
                <div className="flex flex-col gap-1">
                   <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setIsSearchDialogOpen(true)} title="Search Location"><Search className="h-5 w-5" /></Button>
                   <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => restrictedAction(jumpToBase)} title="Home Base"><Home className="h-5 w-5 text-primary" /></Button>
                   <Button variant={isAutoFollow ? "default" : "ghost"} size="icon" className="h-10 w-10 rounded-xl" onClick={snapToLiveGPS} title="Snap to Live GPS"><Crosshair className={cn("h-5 w-5", isAutoFollow && "animate-pulse")} /></Button>
                   <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => restrictedAction(takeSnapshot)} title="Capture Snapshot"><Camera className="h-5 w-5" /></Button>
                   <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={reset} title="Reset Mapping"><RotateCcw className="h-5 w-5" /></Button>
                   <div className="h-px bg-muted mx-1 my-1" />
                   <Button variant={showHistoryOverlay ? "default" : "ghost"} size="icon" className="h-10 w-10 rounded-xl" onClick={() => restrictedAction(() => setShowHistoryOverlay(!showHistoryOverlay))} title="Toggle Layers"><Layers className="h-5 w-5" /></Button>
                   <Button variant={showLabels ? "default" : "ghost"} size="icon" className="h-10 w-10 rounded-xl" onClick={() => restrictedAction(() => setShowLabels(!showLabels))} title="Toggle Labels"><Type className="h-5 w-5" /></Button>
                </div>
             </Card>
          </div>
        )}

        {!isRecording && (
          <div className="absolute top-4 right-4 z-[500] flex flex-col items-end gap-2">
             <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl shadow-xl backdrop-blur-md pointer-events-auto" onClick={() => setIsRightVisible(!isRightVisible)}>{isRightVisible ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</Button>
             <Card className={cn("bg-background/80 backdrop-blur-md shadow-2xl border-none rounded-2xl p-1 transition-all origin-right pointer-events-auto", !isRightVisible && "scale-x-0 opacity-0 invisible")}>
                <div className="flex flex-col gap-1">
                   <Button variant={mode === 'area' ? 'default' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => setMode('area')} title="Area Mode"><MapIcon className="h-5 w-5" /></Button>
                   <Button variant={mode === 'line' ? 'default' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => setMode('line')} title="Line Mode"><Ruler className="h-5 w-5" /></Button>
                   <div className="h-px bg-muted mx-1 my-1" />
                   <Button variant={inputType === 'gps' ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => { setInputType('gps'); setIsAutoFollow(true); }} title="GPS Tracking Mode"><Navigation className="h-5 w-5" /></Button>
                   <Button variant={inputType === 'manual' ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => { setInputType('manual'); setIsAutoFollow(false); }} title="Manual Drawing Mode"><Pencil className="h-5 w-5" /></Button>
                   <div className="h-px bg-muted mx-1 my-1" />
                   <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={centerView} title="Center View"><Target className="h-5 w-5" /></Button>
                   <div className="h-px bg-muted mx-1 my-1" />
                   <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={toggleFullScreen}><Maximize2 className="h-5 w-5" /></Button>
                </div>
             </Card>
          </div>
        )}

        <div className="absolute bottom-6 left-0 right-0 z-40 px-6 pointer-events-none flex flex-col items-center gap-4">
           {!isRecording && measurementResult === null && (
             <Button className="h-14 w-full max-w-xs rounded-2xl font-black uppercase tracking-widest shadow-2xl pointer-events-auto bg-primary text-white" onClick={startTracking}>
                {inputType === 'gps' ? <Play className="h-5 w-5 fill-current mr-2" /> : <Pencil className="h-5 w-5 mr-2" />}
                {inputType === 'gps' ? 'Start GPS Mapping' : 'Start Free Drawing'}
             </Button>
           )}

           {measurementResult !== null && !isRecording && (
             <Card className="bg-background shadow-2xl border-none rounded-[2rem] p-6 max-w-sm w-full pointer-events-auto animate-in slide-in-from-bottom-4">
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                      {(mode === 'area' ? areaUnits : distUnits).slice(0, 2).map((u: any) => (
                        <div key={u} className="bg-primary/5 rounded-xl p-3 text-center">
                           <p className="text-[7px] font-black uppercase text-muted-foreground opacity-50">{u}</p>
                           <p className="text-sm font-black text-primary">{mode === 'area' ? formatArea(measurementResult, u) : formatDistance(measurementResult, u)}</p>
                        </div>
                      ))}
                   </div>
                   <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={reset}><RotateCcw className="h-4 w-4 mr-2" /> Discard</Button>
                      <Button className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]" onClick={() => restrictedAction(() => setIsSaveDialogOpen(true))}><Save className="h-4 w-4 mr-2" /> Save Record</Button>
                   </div>
                </div>
             </Card>
           )}
        </div>

        {isRecording && (
          <div className="absolute bottom-6 right-6 z-[600]">
             <Button variant="destructive" className="h-20 w-20 rounded-full shadow-2xl flex flex-col items-center justify-center gap-1 border-4 border-white animate-pulse" onClick={stopTracking}>
                <Square className="h-6 w-6 fill-current" />
                <span className="text-[8px] font-black uppercase tracking-widest">Finish</span>
             </Button>
          </div>
        )}
      </div>

      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="rounded-3xl p-6">
          <DialogHeader><DialogTitle className="font-black text-xl uppercase">Jump to Location</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4"><Input placeholder="Address or Lat, Lng" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="h-12 rounded-xl" /></div>
          <DialogFooter><Button className="w-full h-12 rounded-xl font-bold" onClick={handleSearch} disabled={isSearching}>{isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Target className="h-4 w-4 mr-2" />}Jump to Site</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-lg overflow-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tight">Technical Record</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
             <div className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Survey Role</Label>
                   <RadioGroup value={saveRole} onValueChange={(v: any) => setSaveRole(v)} className="grid grid-cols-1 gap-2">
                      {['perimeter', 'working', 'obstacle'].map(r => (
                        <Label key={r} className={cn("flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer", saveRole === r ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:bg-muted/50")}>
                           <div className="flex items-center gap-3"><div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm", r === 'perimeter' ? 'bg-black' : r === 'working' ? 'bg-green-600' : 'bg-red-600')}>{r === 'perimeter' ? <ShieldCheck className="h-4 w-4" /> : r === 'working' ? <LayoutDashboard className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}</div><div className="text-sm font-black uppercase tracking-tight">{r} area</div></div>
                           <RadioGroupItem value={r} className="sr-only" />
                        </Label>
                      ))}
                   </RadioGroup>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Land Classification</Label>
                   <Select value={saveClassification} onValueChange={setSaveClassification}>
                      <SelectTrigger className="h-12 rounded-xl">
                         <SelectValue placeholder="Select classification" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                         {classifications.map(c => <SelectItem key={c} value={c}>{c === 'OTHER' ? 'Custom / Other...' : c}</SelectItem>)}
                      </SelectContent>
                   </Select>
                   {saveClassification === 'OTHER' && (
                     <Input placeholder="Define custom classification..." value={customClassification} onChange={e => setCustomClassification(e.target.value)} className="h-12 rounded-xl mt-2" autoFocus />
                   )}
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Project Site</Label>
                   <Select value={saveSiteName} onValueChange={setSaveSiteName}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select or create project" /></SelectTrigger><SelectContent>{projects.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}<SelectItem value="NEW">+ Create New Project</SelectItem></SelectContent></Select>
                   {saveSiteName === 'NEW' && <Input placeholder="Project Name" onChange={e => setSaveSiteName(e.target.value)} className="h-12 rounded-xl mt-2" />}
                </div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Record Title</Label><Input value={saveTitle} onChange={e => setSaveTitle(e.target.value)} className="h-12 rounded-xl" placeholder="e.g. Phase 2 North" /></div>
                
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Map Highlight Override</Label>
                   <div className="grid grid-cols-4 gap-2">
                      {COLOR_PALETTE.map((c) => (
                        <button key={c.hex} type="button" onClick={() => setSaveBoundaryColor(c.hex)} className={cn("h-10 rounded-lg border-2 transition-all shadow-sm relative overflow-hidden", saveBoundaryColor === c.hex ? "border-primary ring-2 ring-primary/20 scale-95" : "border-white")} style={{ backgroundColor: c.hex }}>
                          {saveBoundaryColor === c.hex && <div className="absolute inset-0 flex items-center justify-center"><ShieldCheck className={cn("h-4 w-4", c.hex === '#FFFFFF' ? 'text-black' : 'text-white')} /></div>}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>
          <DialogFooter className="flex flex-col gap-2"><Button className="w-full h-14 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl" onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Commit to Vault</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {!isFullScreen && <div className="bg-background z-40 border-t"><Accordion type="single" collapsible className="w-full"><AccordionItem value="f" className="border-none"><AccordionTrigger className="px-6 py-3 hover:no-underline text-[10px] font-black uppercase opacity-50 tracking-widest">System Info</AccordionTrigger><AccordionContent><Footer /></AccordionContent></AccordionItem></Accordion></div>}
    </div>
  )
}
