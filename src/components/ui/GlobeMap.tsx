"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fmtBytes } from '@/lib/utils';
import { useTheme } from "next-themes";

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
  const [countries, setCountries] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Generate a beautiful, ultra-fresh gradient blue texture for the Light Mode ocean
  const lightGlobeTexture = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#bae6fd'); // sky-200 (light bright blue at the top)
      gradient.addColorStop(0.5, '#38bdf8'); // sky-400 (vibrant blue equator)
      gradient.addColorStop(1, '#0284c7'); // sky-600 (deeper rich blue at the bottom)
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 512);
    }
    return canvas.toDataURL('image/png');
  }, []);

  // Generate a sleek, deep gradient dark texture for the Dark Mode ocean
  const darkGlobeTexture = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#0f172a'); // slate-900 
      gradient.addColorStop(0.5, '#020617'); // slate-950 (deepest dark blue/black)
      gradient.addColorStop(1, '#000000'); // black
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 512);
    }
    return canvas.toDataURL('image/png');
  }, []);

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
    
    // Fetch high-res vector polygons for both themes' continents
    fetch('https://unpkg.com/globe.gl/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries)
      .catch(err => console.error('Failed to load countries', err));

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    // Auto-rotate and controls configuration
    // Since Globe is dynamically imported, we must wait until the ref is actually populated.
    let checkInterval = setInterval(() => {
      if (globeRef.current && globeRef.current.controls) {
        clearInterval(checkInterval);

        const controls = globeRef.current.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2; // Adjusted auto-rotate speed to 1.5

        // Enable inertia/damping for smooth deceleration after dragging
        controls.enableDamping = true;
        controls.dampingFactor = 0.035;

        // Adjust the manual rotation sensitivity
        controls.rotateSpeed = 0.8;

        // Remove boundaries to allow 360 degree rotation in all directions (as much as OrbitControls allows)
        controls.minPolarAngle = 0; // The top pole (North)
        controls.maxPolarAngle = Math.PI; // The bottom pole (South)

        // Focus on Southeast Asia initially
        globeRef.current.pointOfView({ lat: ORIGIN_LAT, lng: ORIGIN_LNG, altitude: 1.8 }, 2000);
      }
    }, 100);

    return () => clearInterval(checkInterval);
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
      className="relative w-full h-[500px] rounded-xl overflow-visible bg-transparent cursor-move flex items-center justify-center transition-all duration-500"
    >

      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        showGraticules={true}
        globeImageUrl={isLight ? lightGlobeTexture : darkGlobeTexture}
        showAtmosphere={true}
        atmosphereColor={isLight ? "#0ea5e9" : "#1e40af"}
        atmosphereAltitude={isLight ? 0.15 : 0.25}
        
        // Polygons Configuration for Unified Vector Designs
        polygonsData={countries ? countries.features : []}
        polygonAltitude={0.015}
        polygonCapColor={() => isLight ? '#4ade80' : '#0f172a'} // Fresh green for light, dark slate for dark
        polygonSideColor={() => isLight ? '#22c55e' : '#020617'} // Depth colors
        polygonStrokeColor={() => isLight ? '#bbf7d0' : '#0284c7'} // Crisp bright borders for light, neon blue for dark

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
        labelColor={() => isLight ? '#0f172a' : 'rgba(255, 255, 255, 0.8)'}
        labelResolution={2}
      />
    </div>
  );
};
