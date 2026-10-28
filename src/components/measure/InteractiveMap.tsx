'use client';

import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMap, useMapEvents, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { Coordinate, formatArea, formatDistance, calculateCentroid } from '@/lib/measure-utils';
import { useEffect, useMemo, useRef } from 'react';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Professional Surveyor Stake Icons with Enhanced Visibility & Contrast
 */
const createSurveyorStakeIcon = (color: string = '#FF4D00', type: string = 'standard') => {
  let content = '';
  const outerShadow = `filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));`;
  const whiteStroke = `border: 2.5px solid white; outline: 1px solid rgba(0,0,0,0.2);`;
  
  if (type === 'footprints') {
    content = `<svg viewBox="0 0 24 24" width="24" height="24" style="${outerShadow}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2.38C4 11.5 5.88 9 8 9a4 4 0 0 1 4 4v.5"/><path d="M12 13v.5"/><path d="M12 19v-2.38c0-2.12 1.88-4.62 4-4.62a4 4 0 0 1 4 4v.5"/><path d="M20 16v.5"/></svg>`;
  } else if (type === 'car') {
    content = `<div style="${outerShadow} background: white; padding: 4px; border-radius: 8px;"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.6 2 12.2 2 12.8V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`;
  } else if (type === 'home') {
    content = `<div style="background-color: #2D5BFF; padding: 8px; border-radius: 12px; border: 4px solid white; box-shadow: 0 8px 30px rgba(0,0,0,0.7);"><svg viewBox="0 0 24 24" width="20" height="18" fill="white"><path d="M3 9.5L12 3L21 9.5V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V9.5Z" /></svg></div>`;
  } else {
    content = `
      <div style="position: relative; width: 30px; height: 45px; display: flex; flex-direction: column; align-items: center; cursor: grab; ${outerShadow}">
        <div style="width: 18px; height: 18px; background: ${color}; ${whiteStroke} border-radius: 5px; z-index: 2;"></div>
        <div style="width: 7px; height: 28px; background: #000; border: 1.5px solid white; border-radius: 0 0 4px 4px; margin-top: -3px;"></div>
      </div>`;
  }

  return L.divIcon({
    className: '',
    html: content,
    iconSize: type === 'standard' ? [30, 45] : [40, 40],
    iconAnchor: type === 'standard' ? [15, 45] : [20, 20],
  });
};

const createDraggableLabelIcon = (title: string, value: string, color: string = '#2D5BFF', isActive: boolean = false) => {
  const isWhite = color.toLowerCase() === '#f8fafc' || color.toLowerCase() === '#ffffff';
  const textColor = isWhite ? '#000000' : '#ffffff';
  const borderColor = isActive ? 'rgba(45,91,255,1)' : 'rgba(255,255,255,0.7)';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        background-color: ${color}; 
        color: ${textColor}; 
        padding: 14px 22px; 
        border-radius: 18px; 
        box-shadow: 0 20px 50px rgba(0,0,0,0.6); 
        text-align: center; 
        min-width: 150px;
        font-family: Inter, sans-serif;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 11px;
        border: 4px solid ${borderColor};
        cursor: pointer;
        ${isActive ? 'outline: 6px solid rgba(45,91,255,0.3);' : ''}
      ">
        <div style="margin-bottom: 7px; opacity: 0.85; font-size: 10px;">${title}</div>
        <div style="border-top: 2px solid ${borderColor}; padding-top: 7px; font-size: 15px; tracking-tight: -0.02em;">${value}</div>
      </div>
    `,
    iconSize: [170, 75],
    iconAnchor: [85, 37],
  });
};

function findInsertIndex(coords: Coordinate[], clickLatLng: L.LatLng): number {
  if (coords.length < 2) return coords.length;
  let minDistance = Infinity;
  let insertIndex = coords.length;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const distance = L.LineUtil.pointToSegmentDistance(L.point(clickLatLng.lat, clickLatLng.lng), L.point(p1.lat, p1.lng), L.point(p2.lat, p2.lng));
    if (distance < minDistance) { minDistance = distance; insertIndex = i + 1; }
  }
  return insertIndex;
}

interface InteractiveMapProps {
  currentPos?: Coordinate | null;
  centerPos?: {lat: number, lng: number, key?: number} | null;
  homePos?: Coordinate | null;
  coords: Coordinate[];
  mode: 'area' | 'line';
  activeRecordId?: string;
  inputType?: 'gps' | 'manual';
  zoom?: number;
  onZoomChange?: (z: number) => void;
  mapType?: 'satellite' | 'terrain';
  onMapClick?: (coord: Coordinate) => void;
  onMarkerMove?: (idx: number, coord: Coordinate) => void;
  onMarkerDelete?: (idx: number) => void;
  onVertexInsert?: (idx: number, coord: Coordinate) => void;
  onLabelMove?: (id: string, coord: Coordinate) => void;
  onViewportChange?: (lat: number, lng: number, zoom: number) => void;
  labelPos?: Coordinate | null;
  onRecordClick?: (recordId: string) => void;
  isManualMode?: boolean;
  isRecording?: boolean;
  showHistory?: boolean;
  historyOverlays?: any[];
  visibleLayerIds?: string[];
  showLabels?: boolean;
  pinType?: 'standard' | 'footprints' | 'car';
  pinColor?: string;
  disableAutoFit?: boolean;
}

function ViewportManager({ centerPos, zoom }: { centerPos?: {lat: number, lng: number, key?: number} | null, zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (centerPos) {
      map.setView([centerPos.lat, centerPos.lng], zoom || 18, { animate: true });
    }
  }, [centerPos, map, zoom]);
  return null;
}

function MapEvents({ onMapClick, isManualMode, onViewportChange }: { onMapClick?: (c: Coordinate) => void, isManualMode: boolean, onViewportChange?: (lat: number, lng: number, zoom: number) => void }) {
  const map = useMap();
  useMapEvents({
    click: (e) => {
      if (isManualMode && onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
    moveend: () => {
      if (onViewportChange) {
        const center = map.getCenter();
        onViewportChange(center.lat, center.lng, map.getZoom());
      }
    }
  });
  return null;
}

function LayoutChangeHandler() {
  const map = useMap();
  const { state } = useSidebar();
  useEffect(() => {
    const timer = setTimeout(() => { map.invalidateSize(); }, 300);
    return () => clearTimeout(timer);
  }, [state, map]);
  return null;
}

export default function InteractiveMap({ 
  currentPos, centerPos, homePos, coords, mode, activeRecordId,
  inputType = 'gps', zoom = 18, mapType = 'satellite',
  onMapClick, onMarkerMove, onMarkerDelete, onVertexInsert, onLabelMove, onViewportChange, labelPos, onRecordClick,
  isManualMode = false, isRecording = false, showHistory = false, historyOverlays = [],
  visibleLayerIds, showLabels = true, pinType = 'standard',
  pinColor = '#FF4D00', disableAutoFit = false
}: InteractiveMapProps) {
  const activeLayerRef = useRef<L.Polyline | L.Polygon | null>(null);
  const activeColor = pinColor || (inputType === 'gps' ? '#FF4D00' : '#2D5BFF');
  
  const surveyorIcon = useMemo(() => createSurveyorStakeIcon(activeColor, pinType), [activeColor, pinType]);
  const homeIcon = useMemo(() => createSurveyorStakeIcon('#2D5BFF', 'home'), []);

  // Sort history overlays by role to ensure proper Z-index layering
  // Hierarchy (Back to Front): Perimeter -> Working Area -> Obstacle
  const sortedOverlays = useMemo(() => {
    if (!historyOverlays) return [];
    const priority: Record<string, number> = {
      'perimeter': 1,
      'working': 2,
      'obstacle': 3
    };
    return [...historyOverlays].sort((a, b) => {
      const pA = priority[a.role as string] || 0;
      const pB = priority[b.role as string] || 0;
      return pA - pB;
    });
  }, [historyOverlays]);

  // Ensure active layer geometry AND color updates
  useEffect(() => {
    if (activeLayerRef.current) {
      activeLayerRef.current.setLatLngs(coords.map(c => [c.lat, c.lng] as [number, number]));
      activeLayerRef.current.setStyle({ color: activeColor });
    }
  }, [coords, activeColor]);

  const handleLineClick = (e: L.LeafletMouseEvent) => {
    if (!isManualMode || !onVertexInsert) return;
    L.DomEvent.stopPropagation(e);
    const idx = findInsertIndex(coords, e.latlng);
    onVertexInsert(idx, { lat: e.latlng.lat, lng: e.latlng.lng });
  };

  return (
    <div className="h-full w-full bg-muted overflow-hidden">
      <MapContainer 
        center={centerPos ? [centerPos.lat, centerPos.lng] : [51.505, -0.09]} 
        zoom={zoom} 
        zoomSnap={0.1}
        zoomDelta={0.1}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; Esri'
          crossOrigin="anonymous"
          url={mapType === 'satellite' 
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          }
          maxZoom={22}
          maxNativeZoom={19}
        />
        
        <ViewportManager centerPos={centerPos} zoom={zoom} />
        <MapEvents onMapClick={onMapClick} isManualMode={isManualMode} onViewportChange={onViewportChange} />
        <LayoutChangeHandler />

        {homePos && !isRecording && <Marker position={[homePos.lat, homePos.lng]} icon={homeIcon} interactive={false} />}

        {showHistory && sortedOverlays.map(item => {
          if (visibleLayerIds && !visibleLayerIds.includes(item.id)) return null;
          
          const positions = item.coords.map((c: any) => [c.lat, c.lng] as [number, number]);
          if (positions.length < 2) return null;
          
          const isActiveRecord = Boolean(activeRecordId && item.id === activeRecordId);
          // Priority: Current selection (pinColor) > Saved database color
          const itemColor = isActiveRecord ? pinColor : (item.boundaryColor || '#2D5BFF');
          
          const labelPoint = (isActiveRecord && labelPos)
            ? labelPos
            : (item.labelLat && item.labelLng) 
              ? { lat: item.labelLat, lng: item.labelLng } 
              : calculateCentroid(item.coords);

          return (
            <FeatureGroup key={`hist-${item.id}-${itemColor}`}>
              {item.type === 'area' ? (
                <Polygon 
                  positions={positions} 
                  color={itemColor} 
                  fillOpacity={0.25} 
                  weight={3.5} 
                  dashArray="10, 12" 
                  eventHandlers={{
                    click: (e) => {
                      if (onRecordClick) {
                        L.DomEvent.stopPropagation(e);
                        onRecordClick(item.id);
                      }
                    }
                  }}
                />
              ) : (
                <Polyline 
                  positions={positions} 
                  color={itemColor} 
                  weight={3.5} 
                  dashArray="6, 12" 
                  eventHandlers={{
                    click: (e) => {
                      if (onRecordClick) {
                        L.DomEvent.stopPropagation(e);
                        onRecordClick(item.id);
                      }
                    }
                  }}
                />
              )}
              {showLabels && (
                <Marker 
                  position={[labelPoint.lat, labelPoint.lng]} 
                  icon={createDraggableLabelIcon(item.title, item.type === 'area' ? formatArea(item.value, 'acres') : formatDistance(item.value, 'km'), itemColor as string, isActiveRecord)} 
                  draggable={isManualMode}
                  zIndexOffset={isActiveRecord ? 2000 : 1000}
                  eventHandlers={{
                    click: (e) => {
                      if (onRecordClick) {
                        L.DomEvent.stopPropagation(e);
                        onRecordClick(item.id);
                      }
                    },
                    dragend: (e) => {
                      if (onLabelMove) {
                        const latlng = e.target.getLatLng();
                        onLabelMove(item.id, { lat: latlng.lat, lng: latlng.lng });
                      }
                    }
                  }}
                />
              )}
            </FeatureGroup>
          );
        })}

        {currentPos && !isManualMode && !isRecording && <Marker position={[currentPos.lat, currentPos.lng]} icon={surveyorIcon} interactive={false} />}

        {coords.length > 1 && (
          mode === 'area' && coords.length > 2 ? (
            <Polygon 
              ref={ref => { activeLayerRef.current = ref; }} 
              positions={coords.map(c => [c.lat, c.lng] as [number, number])} 
              color={activeColor} 
              fillOpacity={0.3} 
              weight={5} 
              eventHandlers={{ click: handleLineClick }}
              interactive={true}
            />
          ) : (
            <Polyline 
              ref={ref => { activeLayerRef.current = ref; }} 
              positions={coords.map(c => [c.lat, c.lng] as [number, number])} 
              color={activeColor} 
              weight={5} 
              dashArray="10, 10" 
              eventHandlers={{ click: handleLineClick }}
              interactive={true}
            />
          )
        )}

        {isManualMode && coords.map((coord, idx) => (
          <Marker 
            key={`v-${idx}`} position={[coord.lat, coord.lng]} draggable={true} icon={surveyorIcon}
            eventHandlers={{
              drag: (e) => {
                const latlng = e.target.getLatLng();
                if (activeLayerRef.current) {
                  const currentLatLngs = (activeLayerRef.current.getLatLngs() as any);
                  const ring = Array.isArray(currentLatLngs[0]) ? currentLatLngs[0] : currentLatLngs;
                  ring[idx] = latlng;
                  activeLayerRef.current.setLatLngs(currentLatLngs);
                }
              },
              dragend: (e) => {
                const latlng = e.target.getLatLng();
                if (onMarkerMove) onMarkerMove(idx, { lat: latlng.lat, lng: latlng.lng });
              },
              click: (e) => { L.DomEvent.stopPropagation(e); if (onMarkerDelete) onMarkerDelete(idx); }
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
