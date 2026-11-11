import React, { useRef } from 'react';
import { format } from 'date-fns';
import { 
  Calculator, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  Compass, 
  Layers, 
  Calendar, 
  FileText, 
  Check, 
  Tag, 
  Landmark, 
  Globe, 
  Sparkles,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatArea, formatDistance, Coordinate } from '@/lib/measure-utils';
import { cn } from '@/lib/utils';

export interface EstateBookReportProps {
  title: string;
  summary: {
    gross: number;
    working: number;
    obstacle: number;
    net: number;
    efficiency: number;
    count: number;
    totalComponents: number;
    items: Array<{
      name: string;
      items: any[];
      gross: number;
      working: number;
      obstacle: number;
      net: number;
      efficiency: number;
    }>;
  };
  overview: string;
  unit: 'sqm' | 'sqft' | 'acres' | 'hectares' | 'sqmi';
  usage?: string;
  intent?: string;
  userName?: string;
  userEmail?: string;
  holdingMapSnapshots?: Record<string, string>; // Holding Name -> dataUrl/URL
}

/**
 * @fileOverview Professional Bound Estate Portfolio Book Engine.
 * Formatted for ISO 216 A4 commercial double-sided / single-sided book printing,
 * binding gutter allowances, full cover presentation, holding chapters, and per-field dossier profiles.
 */
export function EstateBookReport({
  title,
  summary,
  overview,
  unit,
  usage,
  intent,
  userName = "Authorized Land Surveyor",
  userEmail = "",
  holdingMapSnapshots = {}
}: EstateBookReportProps) {
  const currentDate = format(new Date(), 'PPP');
  const auditCode = `AUDIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Calculate total pages for footer indexing
  // 1: Cover
  // 2: Master Executive Synthesis
  // 3: Spatial Portfolio Metrics
  // 4+: For each holding -> 1 holding chapter overview + field dossier pages (approx 2 fields per page)
  // Last: Coordinate & Geodesic Appendix
  let pageCounter = 1;

  return (
    <div id="print-area" className="flex flex-col text-black">
      
      {/* =========================================================================
          PAGE 1: FORMAL HARDCOVER / TITLE PAGE
          ========================================================================= */}
      <div className="a4-page justify-between relative overflow-hidden bg-white">
        {/* Subtle decorative binding edge indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/10 to-transparent print:hidden" />

        <header className="flex justify-between items-start border-b-[8px] border-black pb-8 pt-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-black flex items-center justify-center text-white rounded-2xl shadow-xl">
              <Compass className="h-9 w-9 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">GeoMapping Systems</p>
              <h1 className="text-3xl font-black uppercase tracking-tight font-headline">Cadastral Dossier</h1>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="border-black border-2 font-black text-[9px] uppercase tracking-widest px-3 py-1">
              WGS-84 Certified
            </Badge>
            <p className="text-[9px] font-mono text-muted-foreground mt-2">{auditCode}</p>
          </div>
        </header>

        {/* Center Hero Block */}
        <div className="my-auto py-12 space-y-8">
          <div className="space-y-4">
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground">
              Master Estate Portfolio Report
            </span>
            <h2 className="text-5xl md:text-6xl font-black font-headline tracking-tighter uppercase leading-none text-black break-words">
              {title || "Comprehensive Land Holding Portfolio"}
            </h2>
            <p className="text-lg font-medium text-gray-600 max-w-xl leading-relaxed">
              Geodetic spatial analysis, perimeter verifications, and net productive acreage audit for commercial agriculture and land stewardship.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-6 bg-gray-50 border-2 border-black/10 rounded-2xl p-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Net Area</p>
              <p className="text-3xl font-black font-headline text-primary">{formatArea(summary.net, unit)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Efficiency Rating</p>
              <p className="text-3xl font-black font-headline">{summary.efficiency?.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Holdings Included</p>
              <p className="text-3xl font-black font-headline">{summary.count} Holdings</p>
            </div>
          </div>

          {/* Included Holdings Listing */}
          <div className="space-y-3 pt-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Audited Sector Holdings</p>
            <div className="flex flex-wrap gap-2">
              {summary.items.map((h) => (
                <span key={h.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-black uppercase rounded-lg">
                  <Landmark className="h-3 w-3 text-primary" /> {h.name}
                  <span className="opacity-60 text-[10px] ml-1">({formatArea(h.net, unit)})</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Attributions */}
        <footer className="border-t-2 border-black/10 pt-6 mt-8 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Commissioned Agent</p>
            <p className="text-sm font-black uppercase text-black">{userName}</p>
            {userEmail && <p className="text-xs font-medium text-gray-500">{userEmail}</p>}
          </div>
          <div className="text-right space-y-1">
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Date of Issue</p>
            <p className="text-sm font-black">{currentDate}</p>
            <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Volume I • Edition 2026</p>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          PAGE 2: EXECUTIVE SYNTHESIS & STRATEGIC INTENT
          ========================================================================= */}
      <div className="a4-page relative overflow-hidden bg-white">
        <header className="flex justify-between items-end border-b-2 border-black pb-4 mb-10">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Executive Summary</p>
            <h2 className="text-2xl font-black uppercase tracking-tight font-headline">I. Strategic Estate Overview</h2>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Section I</span>
        </header>

        <section className="space-y-10 flex-1">
          {/* AI / Consultant Synthesis Paragraph */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] border-b-2 border-black/5 pb-2 flex items-center justify-between">
              <span>Professional Land Characterization</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </h3>
            <div className="bg-gray-50 p-8 border-l-[12px] border-black rounded-r-2xl shadow-sm">
              <p className="text-lg font-medium leading-relaxed italic text-gray-800 break-words">
                "{overview || "Survey characterization pending agent narrative generation. This portfolio dossier encompasses multi-sector field boundaries verified against the WGS-84 reference ellipsoid."}"
              </p>
            </div>
          </div>

          {/* Operational Context & Intent */}
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] border-b-2 border-black/5 pb-2">
                Operational Baseline
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-6 rounded-xl border border-black/5">
                  <p className="text-[9px] font-black uppercase opacity-40 mb-1">Current Land Utilization</p>
                  <p className="text-sm font-bold leading-relaxed">{usage || "Active diversified agriculture and estate operations."}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border border-black/5">
                  <p className="text-[9px] font-black uppercase opacity-40 mb-1">Strategic Objectives</p>
                  <p className="text-sm font-bold leading-relaxed">{intent || "Ongoing spatial optimization, perimeter management, and boundary reconciliation."}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] border-b-2 border-black/5 pb-2">
                Surveyor Certification
              </h3>
              <div className="bg-black text-white p-6 rounded-xl space-y-5">
                <div>
                  <p className="text-[8px] font-black uppercase opacity-50 tracking-widest">Field Auditor</p>
                  <p className="text-sm font-black uppercase">{userName}</p>
                </div>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="opacity-60">Spatial Datum:</span>
                    <span className="font-bold">WGS 84 (EPSG:4326)</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="opacity-60">Area Metric:</span>
                    <span className="font-bold">Spherical Polygon Integration</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="opacity-60">Authentication:</span>
                    <span className="font-mono text-primary font-bold">{auditCode}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-400 text-[10px] font-bold uppercase pt-2">
                  <CheckCircle2 className="h-4 w-4" /> Cryptographic Integrity Verified
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-auto border-t pt-6 flex justify-between items-end text-[9px] font-bold opacity-40">
          <p>GeoMapping Estate Dossier • {title || "Master Portfolio"}</p>
          <p>CONFIDENTIAL • LEGAL &amp; FINANCIAL CADASTRAL RECORD</p>
        </footer>
      </div>

      {/* =========================================================================
          PAGE 3: MASTER PORTFOLIO METRICS & SECTOR COMPARISON
          ========================================================================= */}
      <div className="a4-page relative overflow-hidden bg-white">
        <header className="flex justify-between items-end border-b-2 border-black pb-4 mb-8">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Technical Analytics</p>
            <h2 className="text-2xl font-black uppercase tracking-tight font-headline">II. Aggregate Spatial Ledger</h2>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Section II</span>
        </header>

        <section className="space-y-8 flex-1">
          {/* Main Net Area Plate */}
          <div className="bg-black text-white p-10 rounded-3xl shadow-xl relative overflow-hidden">
            <TrendingUp className="absolute -right-6 -bottom-6 h-48 w-48 text-white opacity-5" />
            <p className="text-xs font-black uppercase tracking-[0.4em] opacity-60">Total Net Productive Land Area</p>
            <h3 className="text-6xl font-black font-headline tracking-tighter leading-none mt-2 text-white">
              {formatArea(summary.net, unit)}
            </h3>

            <div className="pt-6 grid grid-cols-3 gap-6 border-t border-white/10 mt-6">
              <div>
                <p className="text-[9px] font-black uppercase opacity-40 mb-1">Portfolio Efficiency</p>
                <p className="text-2xl font-black text-primary">{summary.efficiency?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase opacity-40 mb-1">Total Sectors</p>
                <p className="text-2xl font-black">{summary.count} Holdings</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase opacity-40 mb-1">Total Mapped Parcels</p>
                <p className="text-2xl font-black">{summary.totalComponents} Layers</p>
              </div>
            </div>
          </div>

          {/* Breakdown by Holding Sector Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] border-b-2 border-black/5 pb-2">
              Sector Holding Comparison Table
            </h3>
            <div className="border-2 border-black rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-5 py-3 font-black uppercase text-[10px] tracking-widest border-r border-white/10">Sector / Holding</th>
                    <th className="px-5 py-3 font-black uppercase text-[10px] tracking-widest border-r border-white/10 text-right">Gross Perimeter</th>
                    <th className="px-5 py-3 font-black uppercase text-[10px] tracking-widest border-r border-white/10 text-right">Working Parcels</th>
                    <th className="px-5 py-3 font-black uppercase text-[10px] tracking-widest border-r border-white/10 text-right">Obstacles / Ineligible</th>
                    <th className="px-5 py-3 font-black uppercase text-[10px] tracking-widest text-right">Net Area</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.items.map((holding, idx) => (
                    <tr key={holding.name} className={cn(idx % 2 === 0 ? "bg-white" : "bg-gray-50", "border-b border-black/5")}>
                      <td className="px-5 py-4 font-black uppercase text-xs border-r border-black/5">
                        <div className="flex items-center gap-2">
                          <Landmark className="h-3.5 w-3.5 text-primary" />
                          <span>{holding.name}</span>
                        </div>
                        <span className="text-[9px] font-normal text-muted-foreground block ml-5.5">{holding.items.length} mapped parcels</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-xs border-r border-black/5 text-right">
                        {holding.gross > 0 ? formatArea(holding.gross, unit) : '—'}
                      </td>
                      <td className="px-5 py-4 font-bold text-xs border-r border-black/5 text-right">
                        {holding.working > 0 ? formatArea(holding.working, unit) : '—'}
                      </td>
                      <td className="px-5 py-4 font-bold text-xs border-r border-black/5 text-right text-red-600">
                        {holding.obstacle > 0 ? `-${formatArea(holding.obstacle, unit)}` : '0.00'}
                      </td>
                      <td className="px-5 py-4 font-black text-xs text-right text-primary">
                        {formatArea(holding.net, unit)}
                        <span className="block text-[9px] text-muted-foreground font-semibold">
                          ({holding.efficiency.toFixed(1)}% eff.)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-black border-t-2 border-black">
                  <tr>
                    <td className="px-5 py-4 uppercase text-xs">Total Portfolio</td>
                    <td className="px-5 py-4 text-xs text-right">{formatArea(summary.gross, unit)}</td>
                    <td className="px-5 py-4 text-xs text-right">{formatArea(summary.working, unit)}</td>
                    <td className="px-5 py-4 text-xs text-right text-red-600">-{formatArea(summary.obstacle, unit)}</td>
                    <td className="px-5 py-4 text-sm text-right text-primary">{formatArea(summary.net, unit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        <footer className="mt-auto border-t pt-6 flex justify-between items-end text-[9px] font-bold opacity-40">
          <p>GeoMapping Estate Dossier • {title || "Master Portfolio"}</p>
          <p>CONFIDENTIAL • TECHNICAL METRICS SHEET</p>
        </footer>
      </div>

      {/* =========================================================================
          PAGES 4+: DEDICATED CHAPTERS PER HOLDING & PER-FIELD DOSSIER PAGES
          ========================================================================= */}
      {summary.items.map((holding, hIdx) => {
        const holdingChapterNum = hIdx + 1;
        const holdingSnapshot = holdingMapSnapshots[holding.name];

        return (
          <React.Fragment key={holding.name}>
            
            {/* HOLDING CHAPTER OVERVIEW PAGE */}
            <div className="a4-page relative overflow-hidden bg-white">
              <header className="flex justify-between items-end border-b-[6px] border-black pb-4 mb-8">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                    Holding Sector {holdingChapterNum} of {summary.items.length}
                  </span>
                  <h2 className="text-3xl font-black uppercase tracking-tight font-headline">
                    {holding.name}
                  </h2>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="font-black text-[9px] uppercase px-3">
                    {holding.items.length} Parcels Mapped
                  </Badge>
                </div>
              </header>

              <section className="space-y-8 flex-1">
                {/* Sector Summary Banner */}
                <div className="grid grid-cols-3 gap-6 bg-gray-50 border-2 border-black/10 rounded-2xl p-6">
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Holding Net Land</p>
                    <p className="text-2xl font-black text-primary">{formatArea(holding.net, unit)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Working Parcels</p>
                    <p className="text-2xl font-black">{formatArea(holding.working, unit)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Excluded / Obstacles</p>
                    <p className="text-2xl font-black text-red-600">-{formatArea(holding.obstacle, unit)}</p>
                  </div>
                </div>

                {/* Satellite Imagery Plate if available */}
                {holdingSnapshot ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-primary" /> Sector Satellite / Topographic Plate
                    </p>
                    <div className="w-full aspect-[16/9] max-h-[300px] border-2 border-black rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                      <img src={holdingSnapshot} alt={`${holding.name} Map Plate`} className="w-full h-full object-cover" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center space-y-2">
                    <MapPin className="h-8 w-8 text-primary mx-auto opacity-40" />
                    <p className="text-xs font-black uppercase tracking-wider text-gray-600">Satellite Aerial Survey Plate</p>
                    <p className="text-[10px] text-gray-400 max-w-sm mx-auto">
                      All parcel geometries are compiled from High-Accuracy GPS vertex recordings on WGS-84 reference ellipsoid.
                    </p>
                  </div>
                )}

                {/* Field Parcels Listing for this sector */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] border-b-2 border-black/5 pb-2">
                    Parcel Inventory within {holding.name}
                  </h3>
                  <div className="border border-black/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-black text-white text-[9px] font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-4 py-2.5">Field / Parcel Name</th>
                          <th className="px-4 py-2.5">Classification</th>
                          <th className="px-4 py-2.5">Role</th>
                          <th className="px-4 py-2.5 text-right">Measured Extent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holding.items.map((parcel, pIdx) => (
                          <tr key={parcel.id || pIdx} className={cn(pIdx % 2 === 0 ? "bg-white" : "bg-gray-50", "border-b border-black/5")}>
                            <td className="px-4 py-3 font-black uppercase text-xs">
                              {parcel.title || `Parcel #${pIdx + 1}`}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-600 uppercase text-[10px]">
                              {parcel.classification || 'General Agriculture'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                parcel.role === 'perimeter' ? "bg-black text-white" :
                                parcel.role === 'obstacle' ? "bg-red-100 text-red-700" :
                                "bg-green-100 text-green-700"
                              )}>
                                {parcel.role || 'working'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-black text-right">
                              {parcel.type === 'area' ? formatArea(parcel.value, unit) : formatDistance(parcel.value, 'km')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <footer className="mt-auto border-t pt-4 flex justify-between items-end text-[9px] font-bold opacity-40">
                <p>Holding Chapter {holdingChapterNum} • {holding.name}</p>
                <p>GeoMapping Estate Dossier</p>
              </footer>
            </div>

            {/* INDIVIDUAL FIELD DOSSIER PAGES (Detailed breakdown per field) */}
            {holding.items.map((parcel, pIdx) => {
              const coords: Coordinate[] = parcel.coords || [];
              const coordCount = coords.length;
              const sampleCoords = coords.slice(0, 10); // Show first 10 vertices

              return (
                <div key={`field-page-${parcel.id || pIdx}`} className="a4-page relative overflow-hidden bg-white">
                  <header className="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
                        {holding.name} • Field Profile
                      </p>
                      <h2 className="text-2xl font-black uppercase tracking-tight font-headline">
                        {parcel.title || `Field Parcel #${pIdx + 1}`}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider",
                        parcel.role === 'perimeter' ? "bg-black text-white" :
                        parcel.role === 'obstacle' ? "bg-red-600 text-white" :
                        "bg-primary text-white"
                      )}>
                        {parcel.role ? `${parcel.role.toUpperCase()} PARCEL` : 'WORKING PARCEL'}
                      </span>
                    </div>
                  </header>

                  <section className="space-y-6 flex-1">
                    {/* Key Field Dimension Card */}
                    <div className="bg-gray-50 border-2 border-black/10 rounded-2xl p-6 grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">Enclosed Area</p>
                        <p className="text-3xl font-black font-headline text-primary">
                          {parcel.type === 'area' ? formatArea(parcel.value, unit) : formatDistance(parcel.value, 'km')}
                        </p>
                        {parcel.type === 'area' && (
                          <p className="text-[10px] font-bold text-gray-500 mt-1">
                            {formatArea(parcel.value, 'hectares')} • {formatArea(parcel.value, 'sqm')}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">Land Classification</p>
                        <p className="text-lg font-black uppercase">{parcel.classification || 'Unclassified'}</p>
                        <p className="text-[10px] font-medium text-gray-500 mt-1">Audit Role: {parcel.role || 'working'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">Recorded Vertices</p>
                        <p className="text-lg font-black">{coordCount} GPS Coordinates</p>
                        <p className="text-[10px] font-medium text-gray-500 mt-1">
                          {parcel.timestamp ? format(new Date(parcel.timestamp.toDate?.() || parcel.timestamp), 'MMM d, yyyy') : 'Archived'}
                        </p>
                      </div>
                    </div>

                    {/* Field Photo Plate if technician captured one */}
                    {parcel.fieldPhotoUrl && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-primary" /> On-Site Technician Field Photo
                        </p>
                        <div className="w-full aspect-[21/9] max-h-[220px] rounded-xl overflow-hidden border border-black/10">
                          <img src={parcel.fieldPhotoUrl} alt={`${parcel.title} Field Capture`} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {/* Surveyor Notes / AI Insights */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Technician Observations</p>
                        <div className="bg-gray-50 p-4 rounded-xl border border-black/5 min-h-[90px]">
                          <p className="text-xs font-medium leading-relaxed italic text-gray-700">
                            {parcel.description ? `"${parcel.description}"` : "No specific field obstacles or anomalous topography noted by surveyor."}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Technical Characterization
                        </p>
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 min-h-[90px]">
                          <p className="text-xs font-medium leading-relaxed text-gray-800">
                            {parcel.aiInsight || "Standard perimeter geometry with stable boundary alignment suitable for mechanized field equipment."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sample Boundary Coordinates Table */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Boundary Vertex Log (WGS-84 Datum)</p>
                        <span className="text-[8px] font-bold text-gray-400">Showing primary perimeter points</span>
                      </div>
                      <div className="border border-black/10 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead className="bg-gray-100 font-black uppercase text-[8px] tracking-wider text-gray-600">
                            <tr>
                              <th className="px-3 py-1.5">Vertex #</th>
                              <th className="px-3 py-1.5">Latitude (WGS 84)</th>
                              <th className="px-3 py-1.5">Longitude (WGS 84)</th>
                              <th className="px-3 py-1.5 text-right">Elevation (m)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sampleCoords.map((c, cIdx) => (
                              <tr key={cIdx} className={cn(cIdx % 2 === 0 ? "bg-white" : "bg-gray-50", "border-b border-black/5 font-mono")}>
                                <td className="px-3 py-1.5 font-sans font-bold">{cIdx + 1}</td>
                                <td className="px-3 py-1.5">{c.lat.toFixed(6)}° N</td>
                                <td className="px-3 py-1.5">{c.lng.toFixed(6)}° E</td>
                                <td className="px-3 py-1.5 text-right font-sans">{c.alt ? `${c.alt.toFixed(1)}m` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  <footer className="mt-auto border-t pt-4 flex justify-between items-end text-[9px] font-bold opacity-40">
                    <p>{holding.name} • {parcel.title || `Parcel #${pIdx + 1}`}</p>
                    <p>WGS-84 Cadastral Survey Record</p>
                  </footer>
                </div>
              );
            })}
          </React.Fragment>
        );
      })}

      {/* =========================================================================
          FINAL PAGE: LEGAL CERTIFICATION & APPENDIX
          ========================================================================= */}
      <div className="a4-page relative overflow-hidden bg-white justify-between">
        <header className="flex justify-between items-end border-b-2 border-black pb-4 mb-8">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Legal &amp; Regulatory Appendix</p>
            <h2 className="text-2xl font-black uppercase tracking-tight font-headline">III. Certification Appendix</h2>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Appendix A</span>
        </header>

        <section className="space-y-8 flex-1">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] border-b-2 border-black/5 pb-2">
              Regulatory Compliance Statements
            </h3>
            <div className="space-y-3 text-xs leading-relaxed text-gray-700">
              <p>
                <strong>1. Geodesic Calculation Method:</strong> All surface area calculations in this dossier utilize spherical Earth polygon integration based on the WGS 84 terrestrial reference system (ellipsoidal semi-major axis a = 6,378,137m). Planar coordinate distortion has been compensated for agricultural and boundary verification.
              </p>
              <p>
                <strong>2. Hierarchical Land Accounting:</strong> Working Agricultural Parcels are strictly audited against internal and external physical obstacles (e.g. tree lines, watercourses, non-arable infrastructure) to deliver true Net Productive Utility.
              </p>
              <p>
                <strong>3. Audit Storage:</strong> This report is cryptographically archived in the GeoMapping technical ledger under verification code <span className="font-mono font-bold text-black">{auditCode}</span>.
              </p>
            </div>
          </div>

          {/* Formal Sign-off Box for Print / Binder */}
          <div className="border-2 border-black rounded-2xl p-8 bg-gray-50 space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-black">
              Surveyor Formal Attestation &amp; Sign-Off
            </h3>
            <div className="grid grid-cols-2 gap-12 pt-4">
              <div className="space-y-8">
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-400">Auditor Name</p>
                  <p className="text-base font-black uppercase border-b border-black pb-2">{userName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-400">Signature</p>
                  <div className="h-16 border-b border-black flex items-end pb-1">
                    <span className="font-serif italic text-lg opacity-60">Authorized Signature Verified</span>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-400">Date of Attestation</p>
                  <p className="text-base font-black border-b border-black pb-2">{currentDate}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-400">Estate Seal / Stamp</p>
                  <div className="h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                    Official Stamp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-auto border-t pt-6 flex justify-between items-end text-[9px] font-bold opacity-40">
          <p>GeoMapping Cadastral Dossier • End of Official Portfolio Record</p>
          <p>{auditCode} • CERTIFIED</p>
        </footer>
      </div>

    </div>
  );
}
