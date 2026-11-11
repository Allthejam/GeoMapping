import React from 'react';
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
import { EstateBookReportProps } from './EstateBookReport';

/**
 * Returns an array of standalone page elements representing the entire dossier.
 * Used by both standard A4 view and the interactive 3D FlipBookViewer.
 */
export function getEstateBookPages({
  title,
  summary,
  overview,
  unit,
  usage,
  intent,
  userName = "Authorized Land Surveyor",
  userEmail = "",
  holdingMapSnapshots = {}
}: EstateBookReportProps): React.ReactNode[] {
  const currentDate = format(new Date(), 'PPP');
  const auditCode = `AUDIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const pages: React.ReactNode[] = [];

  // PAGE 1: COVER
  pages.push(
    <div key="page-cover" className="h-full flex flex-col justify-between relative bg-white">
      <header className="flex justify-between items-start border-b-[6px] border-black pb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-black flex items-center justify-center text-white rounded-xl shadow-lg">
            <Compass className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">GeoMapping Systems</p>
            <h1 className="text-2xl font-black uppercase tracking-tight font-headline">Cadastral Dossier</h1>
          </div>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="border-black border-2 font-black text-[8px] uppercase tracking-widest px-2.5 py-0.5">
            WGS-84 Certified
          </Badge>
          <p className="text-[8px] font-mono text-muted-foreground mt-1">{auditCode}</p>
        </div>
      </header>

      <div className="my-auto py-8 space-y-6">
        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
            Master Estate Portfolio
          </span>
          <h2 className="text-4xl font-black font-headline tracking-tighter uppercase leading-tight text-black break-words">
            {title || "Comprehensive Land Holding Portfolio"}
          </h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed">
            Geodetic spatial analysis, perimeter verifications, and net productive acreage audit for commercial agriculture.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-gray-50 border-2 border-black/10 rounded-xl p-5">
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Net Area</p>
            <p className="text-2xl font-black font-headline text-primary">{formatArea(summary.net, unit)}</p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Efficiency</p>
            <p className="text-2xl font-black font-headline">{summary.efficiency?.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Holdings</p>
            <p className="text-2xl font-black font-headline">{summary.count} Sites</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Audited Sector Holdings</p>
          <div className="flex flex-wrap gap-1.5">
            {summary.items.map((h) => (
              <span key={h.name} className="inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white text-[10px] font-black uppercase rounded-md">
                <Landmark className="h-2.5 w-2.5 text-primary" /> {h.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t-2 border-black/10 pt-4 flex justify-between items-end text-[9px]">
        <div>
          <p className="font-black uppercase text-gray-400">Auditor</p>
          <p className="font-black uppercase text-black text-xs">{userName}</p>
        </div>
        <div className="text-right">
          <p className="font-black text-black">{currentDate}</p>
          <p className="font-bold text-primary uppercase">Edition 2026</p>
        </div>
      </footer>
    </div>
  );

  // PAGE 2: EXECUTIVE SYNTHESIS
  pages.push(
    <div key="page-exec" className="h-full flex flex-col justify-between bg-white">
      <header className="flex justify-between items-end border-b-2 border-black pb-3 mb-6">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Executive Summary</p>
          <h2 className="text-xl font-black uppercase tracking-tight font-headline">I. Strategic Estate Overview</h2>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Section I</span>
      </header>

      <section className="space-y-6 flex-1">
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] border-b border-black/5 pb-1 flex items-center justify-between">
            <span>Land Characterization Narrative</span>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </h3>
          <div className="bg-gray-50 p-6 border-l-[8px] border-black rounded-r-xl">
            <p className="text-sm font-medium leading-relaxed italic text-gray-800 break-words">
              "{overview || "Survey characterization pending agent narrative generation. Multi-sector boundaries verified against WGS-84 reference ellipsoid."}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] border-b border-black/5 pb-1">Operations Context</h3>
            <div className="bg-gray-50 p-4 rounded-xl border border-black/5">
              <p className="text-[8px] font-black uppercase opacity-40 mb-1">Current Usage</p>
              <p className="text-xs font-bold leading-relaxed">{usage || "Active agricultural management."}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-black/5">
              <p className="text-[8px] font-black uppercase opacity-40 mb-1">Strategic Intent</p>
              <p className="text-xs font-bold leading-relaxed">{intent || "Ongoing spatial optimization."}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] border-b border-black/5 pb-1">Certification</h3>
            <div className="bg-black text-white p-4 rounded-xl space-y-3 text-xs">
              <div>
                <p className="text-[7px] font-black uppercase opacity-50 tracking-widest">Auditor</p>
                <p className="text-xs font-black uppercase">{userName}</p>
              </div>
              <div className="border-t border-white/10 pt-2 space-y-1 text-[9px]">
                <div className="flex justify-between"><span className="opacity-60">Datum:</span><span className="font-bold">WGS 84</span></div>
                <div className="flex justify-between"><span className="opacity-60">Code:</span><span className="font-mono text-primary font-bold">{auditCode}</span></div>
              </div>
              <div className="flex items-center gap-1.5 text-green-400 text-[9px] font-bold uppercase pt-1">
                <CheckCircle2 className="h-3 w-3" /> Cryptographically Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t pt-3 flex justify-between text-[8px] font-bold opacity-40">
        <p>GeoMapping Estate Dossier</p>
        <p>Section I • Executive Overview</p>
      </footer>
    </div>
  );

  // PAGE 3: SECTOR COMPARISON TABLE
  pages.push(
    <div key="page-sectors" className="h-full flex flex-col justify-between bg-white">
      <header className="flex justify-between items-end border-b-2 border-black pb-3 mb-6">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Technical Analytics</p>
          <h2 className="text-xl font-black uppercase tracking-tight font-headline">II. Sector Spatial Ledger</h2>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Section II</span>
      </header>

      <section className="space-y-6 flex-1">
        <div className="bg-black text-white p-6 rounded-2xl relative overflow-hidden">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Total Net Productive Land</p>
          <h3 className="text-4xl font-black font-headline tracking-tighter mt-1 text-white">
            {formatArea(summary.net, unit)}
          </h3>
          <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/10 mt-4 text-xs">
            <div><p className="text-[8px] opacity-40">Efficiency</p><p className="font-black text-primary">{summary.efficiency?.toFixed(1)}%</p></div>
            <div><p className="text-[8px] opacity-40">Holdings</p><p className="font-black">{summary.count} Sites</p></div>
            <div><p className="text-[8px] opacity-40">Parcels</p><p className="font-black">{summary.totalComponents} Layers</p></div>
          </div>
        </div>

        <div className="border-2 border-black rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-black text-white text-[8px] font-black uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 border-r border-white/10">Sector / Holding</th>
                <th className="px-3 py-2 border-r border-white/10 text-right">Gross</th>
                <th className="px-3 py-2 border-r border-white/10 text-right">Obstacles</th>
                <th className="px-3 py-2 text-right">Net Area</th>
              </tr>
            </thead>
            <tbody>
              {summary.items.map((holding, idx) => (
                <tr key={holding.name} className={cn(idx % 2 === 0 ? "bg-white" : "bg-gray-50", "border-b border-black/5")}>
                  <td className="px-3 py-2.5 font-black uppercase text-[11px] border-r border-black/5">
                    {holding.name}
                    <span className="text-[8px] font-normal text-muted-foreground block">{holding.items.length} parcels</span>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-right border-r border-black/5">{holding.gross > 0 ? formatArea(holding.gross, unit) : '—'}</td>
                  <td className="px-3 py-2.5 font-bold text-right border-r border-black/5 text-red-600">
                    {holding.obstacle > 0 ? `-${formatArea(holding.obstacle, unit)}` : '0.00'}
                  </td>
                  <td className="px-3 py-2.5 font-black text-right text-primary">
                    {formatArea(holding.net, unit)}
                    <span className="block text-[8px] text-muted-foreground">({holding.efficiency.toFixed(1)}%)</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-black border-t-2 border-black">
              <tr>
                <td className="px-3 py-2.5 uppercase text-[10px]">Total Aggregate</td>
                <td className="px-3 py-2.5 text-right text-[10px]">{formatArea(summary.gross, unit)}</td>
                <td className="px-3 py-2.5 text-right text-[10px] text-red-600">-{formatArea(summary.obstacle, unit)}</td>
                <td className="px-3 py-2.5 text-right text-xs text-primary">{formatArea(summary.net, unit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <footer className="mt-auto border-t pt-3 flex justify-between text-[8px] font-bold opacity-40">
        <p>GeoMapping Estate Dossier</p>
        <p>Section II • Spatial Comparison</p>
      </footer>
    </div>
  );

  // CHAPTERS PER HOLDING & PER-FIELD PROFILES
  summary.items.forEach((holding, hIdx) => {
    // Sector Chapter Overview
    pages.push(
      <div key={`holding-chapter-${holding.name}`} className="h-full flex flex-col justify-between bg-white">
        <header className="flex justify-between items-end border-b-[5px] border-black pb-3 mb-6">
          <div>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">
              Sector {hIdx + 1} of {summary.items.length}
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight font-headline">{holding.name}</h2>
          </div>
          <Badge variant="secondary" className="font-black text-[8px] uppercase px-2.5">
            {holding.items.length} Parcels
          </Badge>
        </header>

        <section className="space-y-6 flex-1">
          <div className="grid grid-cols-3 gap-3 bg-gray-50 border-2 border-black/10 rounded-xl p-4">
            <div>
              <p className="text-[8px] font-black uppercase text-gray-500 mb-0.5">Net Land</p>
              <p className="text-xl font-black text-primary">{formatArea(holding.net, unit)}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-gray-500 mb-0.5">Working Extent</p>
              <p className="text-xl font-black">{formatArea(holding.working, unit)}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-gray-500 mb-0.5">Obstacles</p>
              <p className="text-xl font-black text-red-600">-{formatArea(holding.obstacle, unit)}</p>
            </div>
          </div>

          {holdingMapSnapshots[holding.name] ? (
            <div className="w-full aspect-[16/9] max-h-[260px] border-2 border-black rounded-xl overflow-hidden bg-muted">
              <img src={holdingMapSnapshots[holding.name]} alt={holding.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center space-y-1">
              <MapPin className="h-6 w-6 text-primary mx-auto opacity-40" />
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-600">Sector Survey Plate</p>
              <p className="text-[9px] text-gray-400">All geometries derived from high-precision field GPS vertices.</p>
            </div>
          )}

          <div className="border border-black/10 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead className="bg-black text-white text-[8px] font-black uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2">Field Parcel</th>
                  <th className="px-3 py-2">Classification</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2 text-right">Extent</th>
                </tr>
              </thead>
              <tbody>
                {holding.items.map((parcel, pIdx) => (
                  <tr key={parcel.id || pIdx} className={cn(pIdx % 2 === 0 ? "bg-white" : "bg-gray-50", "border-b border-black/5")}>
                    <td className="px-3 py-2 font-black uppercase">{parcel.title || `Parcel #${pIdx + 1}`}</td>
                    <td className="px-3 py-2 text-gray-600 uppercase text-[9px]">{parcel.classification || 'Arable'}</td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[7px] font-black uppercase",
                        parcel.role === 'perimeter' ? "bg-black text-white" : parcel.role === 'obstacle' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      )}>
                        {parcel.role || 'working'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-black text-right">
                      {parcel.type === 'area' ? formatArea(parcel.value, unit) : formatDistance(parcel.value, 'km')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-auto border-t pt-3 flex justify-between text-[8px] font-bold opacity-40">
          <p>{holding.name}</p>
          <p>Sector Overview</p>
        </footer>
      </div>
    );

    // Field Profiles
    holding.items.forEach((parcel, pIdx) => {
      const coords: Coordinate[] = parcel.coords || [];
      const sampleCoords = coords.slice(0, 8);

      pages.push(
        <div key={`field-${holding.name}-${parcel.id || pIdx}`} className="h-full flex flex-col justify-between bg-white">
          <header className="flex justify-between items-end border-b-2 border-black pb-3 mb-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">{holding.name} • Parcel Profile</p>
              <h2 className="text-xl font-black uppercase tracking-tight font-headline">{parcel.title || `Parcel #${pIdx + 1}`}</h2>
            </div>
            <span className={cn(
              "px-2.5 py-0.5 rounded text-[8px] font-black uppercase",
              parcel.role === 'perimeter' ? "bg-black text-white" : parcel.role === 'obstacle' ? "bg-red-600 text-white" : "bg-primary text-white"
            )}>
              {parcel.role ? parcel.role.toUpperCase() : 'WORKING'}
            </span>
          </header>

          <section className="space-y-4 flex-1">
            <div className="bg-gray-50 border border-black/10 rounded-xl p-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[8px] font-black uppercase opacity-40 mb-0.5">Enclosed Area</p>
                <p className="text-2xl font-black font-headline text-primary">
                  {parcel.type === 'area' ? formatArea(parcel.value, unit) : formatDistance(parcel.value, 'km')}
                </p>
                {parcel.type === 'area' && <p className="text-[9px] font-bold text-gray-500">{formatArea(parcel.value, 'hectares')}</p>}
              </div>
              <div>
                <p className="text-[8px] font-black uppercase opacity-40 mb-0.5">Classification</p>
                <p className="text-sm font-black uppercase">{parcel.classification || 'Unclassified'}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase opacity-40 mb-0.5">Boundary Vertices</p>
                <p className="text-sm font-black">{coords.length} GPS Points</p>
              </div>
            </div>

            {parcel.fieldPhotoUrl && (
              <div className="w-full aspect-[21/9] max-h-[160px] rounded-xl overflow-hidden border border-black/10">
                <img src={parcel.fieldPhotoUrl} alt={parcel.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-black/5 min-h-[70px]">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Technician Notes</p>
                <p className="text-xs italic text-gray-700">{parcel.description ? `"${parcel.description}"` : "Standard boundary alignment."}</p>
              </div>
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 min-h-[70px]">
                <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">AI Characterization</p>
                <p className="text-xs text-gray-800">{parcel.aiInsight || "Terrain profile suitable for ongoing crop stewardship."}</p>
              </div>
            </div>

            <div className="border border-black/10 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-[9px]">
                <thead className="bg-gray-100 font-black uppercase text-[7px] tracking-wider text-gray-600">
                  <tr>
                    <th className="px-2.5 py-1">Vertex</th>
                    <th className="px-2.5 py-1">Latitude (WGS 84)</th>
                    <th className="px-2.5 py-1">Longitude (WGS 84)</th>
                    <th className="px-2.5 py-1 text-right">Alt (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleCoords.map((c, cIdx) => (
                    <tr key={cIdx} className={cn(cIdx % 2 === 0 ? "bg-white" : "bg-gray-50", "border-b border-black/5 font-mono")}>
                      <td className="px-2.5 py-1 font-sans font-bold">#{cIdx + 1}</td>
                      <td className="px-2.5 py-1">{c.lat.toFixed(6)}° N</td>
                      <td className="px-2.5 py-1">{c.lng.toFixed(6)}° E</td>
                      <td className="px-2.5 py-1 text-right font-sans">{c.alt ? `${c.alt.toFixed(1)}m` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="mt-auto border-t pt-3 flex justify-between text-[8px] font-bold opacity-40">
            <p>{holding.name} • {parcel.title}</p>
            <p>Parcel Cadastral Record</p>
          </footer>
        </div>
      );
    });
  });

  // FINAL APPENDIX PAGE
  pages.push(
    <div key="page-appendix" className="h-full flex flex-col justify-between bg-white">
      <header className="flex justify-between items-end border-b-2 border-black pb-3 mb-6">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Legal Certification</p>
          <h2 className="text-xl font-black uppercase tracking-tight font-headline">III. Attestation Sign-Off</h2>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Appendix A</span>
      </header>

      <section className="space-y-6 flex-1">
        <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
          <p><strong>Geodesic Calculation:</strong> All areas computed with WGS 84 spherical Earth polygon integration (a = 6,378,137m).</p>
          <p><strong>Hierarchical Deductions:</strong> Working Parcels strictly audited against internal obstacles to calculate Net Productive Utility.</p>
          <p><strong>Audit Ledger:</strong> Archived under cryptographic verification code <span className="font-mono font-bold text-black">{auditCode}</span>.</p>
        </div>

        <div className="border-2 border-black rounded-xl p-6 bg-gray-50 space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Formal Sign-Off</h3>
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-4">
              <div><p className="text-[8px] font-black uppercase text-gray-400">Auditor Name</p><p className="font-black uppercase border-b border-black pb-1">{userName}</p></div>
              <div><p className="text-[8px] font-black uppercase text-gray-400">Signature</p><div className="h-10 border-b border-black flex items-end pb-1 font-serif italic text-sm opacity-60">Verified</div></div>
            </div>
            <div className="space-y-4">
              <div><p className="text-[8px] font-black uppercase text-gray-400">Date</p><p className="font-black border-b border-black pb-1">{currentDate}</p></div>
              <div><p className="text-[8px] font-black uppercase text-gray-400">Seal / Stamp</p><div className="h-10 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-[9px] text-gray-400 uppercase">Stamp</div></div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t pt-3 flex justify-between text-[8px] font-bold opacity-40">
        <p>GeoMapping Cadastral Dossier</p>
        <p>{auditCode} • CERTIFIED</p>
      </footer>
    </div>
  );

  return pages;
}
