"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fmtBytes } from '@/lib/utils';

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

const COUNTRY_COORDS: Record<string, [number, number]> = {
  "ID": [113.9213, -0.7893],
  "US": [-95.7129, 37.0902],
  "HK": [114.1095, 22.3964],
  "SG": [103.8198, 1.3521],
  "JP": [138.2529, 36.2048],
  "SC": [55.4920, -4.6796],
  "GB": [-3.4360, 55.3781],
  "IT": [12.5674, 41.8719],
  "CN": [104.1954, 35.8617],
  "KR": [127.7669, 35.9078],
  "CA": [-106.3468, 56.1304],
  "LU": [6.1296, 49.8153],
  "NL": [5.2913, 52.1326],
  "TR": [35.2433, 38.9637],
  "UA": [31.1656, 48.3794]
};

// Jakarta, Indonesia as Origin
const ORIGIN_LAT = -6.2088;
const ORIGIN_LNG = 106.8456;

interface GlobeMapProps {
  data: {
    countryCode: string;
    value: number;
    label: string;
  }[];
}

export const GlobeMap = ({ data }: GlobeMapProps) => {
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle resizing
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight || 500
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    // Auto-rotate configuration
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 1.0;
      
      // Focus on Southeast Asia initially
      globeRef.current.pointOfView({ lat: ORIGIN_LAT, lng: ORIGIN_LNG, altitude: 1.8 }, 2000);
    }
  }, []);

  const arcsData = useMemo(() => {
    return data
      .filter(d => d.countryCode !== "ID" && COUNTRY_COORDS[d.countryCode])
      .map(d => {
        const [lng, lat] = COUNTRY_COORDS[d.countryCode];
        return {
          startLat: ORIGIN_LAT,
          startLng: ORIGIN_LNG,
          endLat: lat,
          endLng: lng,
          color: ['#0ea5e9', '#38bdf8'],
          name: d.label,
          value: d.value
        };
      });
  }, [data]);

  const pointsData = useMemo(() => {
    const points = arcsData.map(arc => ({
      lat: arc.endLat,
      lng: arc.endLng,
      size: 0.1,
      color: '#38bdf8',
      name: arc.name,
      value: arc.value
    }));
    
    // Add origin point
    points.push({
      lat: ORIGIN_LAT,
      lng: ORIGIN_LNG,
      size: 0.2,
      color: '#f43f5e',
      name: 'Indonesia (Origin)',
      value: 0
    });
    
    return points;
  }, [arcsData]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[500px] rounded-xl overflow-visible bg-transparent cursor-move flex items-center justify-center"
    >
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none bg-black/60 p-3 rounded-lg border border-white/10 backdrop-blur-md">
        <div className="text-sm font-medium text-white flex items-center gap-2">
          Global Traffic Flows
        </div>
        <p className="text-xs text-slate-400 mt-1">Interactive 3D visualization of network traffic</p>
      </div>

      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        
        // Arcs configuration
        arcsData={arcsData}
        arcStartLat={(d: any) => d.startLat}
        arcStartLng={(d: any) => d.startLng}
        arcEndLat={(d: any) => d.endLat}
        arcEndLng={(d: any) => d.endLng}
        arcColor={(d: any) => d.color}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        arcAltitude={0.3}
        arcStroke={0.7}
        
        // Points configuration
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius="size"
        pointsMerge={true}
        
        // Rings configuration (Ping effect for points)
        ringsData={pointsData}
        ringLat="lat"
        ringLng="lng"
        ringColor="color"
        ringMaxRadius={(d: any) => d.name === 'Indonesia (Origin)' ? 3 : 1.5}
        ringPropagationSpeed={3}
        ringRepeatPeriod={1000}
        
        // Labels configuration
        labelsData={pointsData}
        labelLat="lat"
        labelLng="lng"
        labelText="name"
        labelSize={1.2}
        labelDotRadius={0.5}
        labelColor={() => 'rgba(255, 255, 255, 0.8)'}
        labelResolution={2}
      />
    </div>
  );
};
