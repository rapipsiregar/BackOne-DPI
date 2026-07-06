"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from "next-themes";
import * as THREE from 'three';
import { fmtBytes } from "@/lib/utils";

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
  "UA": [31.1656, 48.3794],
  "RU": [105.3188, 61.5240],
  "HU": [19.5033, 47.1625],
  "BD": [90.3563, 23.6850],
  "AU": [133.7751, -25.2744],
  "IN": [78.9629, 20.5937],
  "DE": [10.4515, 51.1657],
  "FR": [2.2137, 46.2276],
  "ES": [-3.7492, 40.4637],
  "BR": [-51.9253, -14.2350],
  "MY": [101.9758, 4.2105],
  "TH": [100.9925, 15.8700],
  "VN": [108.2772, 14.0583],
  "PH": [121.7740, 12.8797],
  "TW": [120.9605, 23.6978],
  "GR": [21.8243, 39.0742]
};

// Jakarta, Indonesia as Origin
const ORIGIN_LAT = -6.2088;
const ORIGIN_LNG = 106.8456;

interface GlobeMapProps {
  data: {
    countryCode: string;
    value: number;
    upload?: number;
    download?: number;
    label: string;
  }[];
}

export const GlobeMap = ({ data }: GlobeMapProps) => {
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [countries, setCountries] = useState<any>(null);
  const [userInteracting, setUserInteracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
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
    
    const loadCountries = async () => {
      try {
        const res = await fetch('/ne_110m_admin_0_countries.geojson');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setCountries(data);
      } catch (err) {
        console.error('Failed to load countries', err);
      }
    };
    
    loadCountries();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Setup Initial Controls & Position
  useEffect(() => {
    let checkInterval = setInterval(() => {
      if (globeRef.current && globeRef.current.controls) {
        clearInterval(checkInterval);

        const controls = globeRef.current.controls();
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.8;
        controls.minPolarAngle = Math.PI / 4; 
        controls.maxPolarAngle = Math.PI * 3/4;
        controls.minDistance = 140; // Zoom in limit
        controls.maxDistance = 350; // Zoom out limit

        // Listen for interactions to pause auto-rotate smoothly
        controls.addEventListener('start', () => setUserInteracting(true));
        controls.addEventListener('end', () => setUserInteracting(false));

        // Focus on Southeast Asia initially
        globeRef.current.pointOfView({ lat: ORIGIN_LAT, lng: ORIGIN_LNG, altitude: 1.8 }, 2000);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, []);

  // Manage Auto Rotate based on Interaction
  useEffect(() => {
    if (globeRef.current && globeRef.current.controls) {
      const controls = globeRef.current.controls();
      controls.autoRotate = !userInteracting;
      controls.autoRotateSpeed = 1.0;
    }
  }, [userInteracting]);

  // Create a custom material that we can mutate safely
  const customGlobeMaterial = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial();
    mat.color.set('#020617'); // Default to dark mode
    return mat;
  }, []);

  // Smooth Material Color Interpolation for Theme Switching
  useEffect(() => {
    // Target ocean colors
    const targetColor = new THREE.Color(isLight ? '#e0f2fe' : '#020617');
    
    let frameId: number;
    const lerpColor = () => {
      customGlobeMaterial.color.lerp(targetColor, 0.08); // Smooth interpolation step
      
      const rDiff = Math.abs(customGlobeMaterial.color.r - targetColor.r);
      const gDiff = Math.abs(customGlobeMaterial.color.g - targetColor.g);
      const bDiff = Math.abs(customGlobeMaterial.color.b - targetColor.b);
      
      if (rDiff + gDiff + bDiff > 0.01) {
        frameId = requestAnimationFrame(lerpColor);
      } else {
        customGlobeMaterial.color.copy(targetColor);
      }
    };
    lerpColor();
    
    return () => cancelAnimationFrame(frameId);
  }, [isLight, customGlobeMaterial]);

  // Prepare Data Memos
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
          color: isLight ? ['#38bdf8', '#0284c7'] : ['#0ea5e9', '#38bdf8'],
          name: d.label,
          value: d.value,
          upload: d.upload || 0,
          download: d.download || 0
        };
      });
  }, [data, isLight]);

  const pointsData = useMemo(() => {
    const points = arcsData.map(arc => ({
      lat: arc.endLat,
      lng: arc.endLng,
      size: 0.1,
      color: isLight ? '#0284c7' : '#38bdf8',
      name: arc.name,
      value: arc.value,
      upload: arc.upload,
      download: arc.download,
      isOrigin: false
    }));

    points.push({
      lat: ORIGIN_LAT,
      lng: ORIGIN_LNG,
      size: 0.2,
      color: '#f43f5e',
      name: 'Indonesia (Origin)',
      value: 0,
      upload: 0,
      download: 0,
      isOrigin: true
    });

    return points;
  }, [arcsData, isLight]);

  // Extract All Labels + Origin to display statically
  const labelsData = useMemo(() => {
    const staticLabels = arcsData.map(arc => ({
      lat: arc.endLat,
      lng: arc.endLng,
      name: arc.name,
      color: isLight ? '#0f172a' : '#f8fafc'
    }));
    
    // Add origin
    staticLabels.push({
      lat: ORIGIN_LAT,
      lng: ORIGIN_LNG,
      name: 'Indonesia',
      color: isLight ? '#e11d48' : '#fda4af'
    });
    
    return staticLabels;
  }, [arcsData, isLight]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[500px] rounded-xl overflow-visible bg-transparent cursor-move flex items-center justify-center transition-all duration-500"
      onMouseEnter={() => setUserInteracting(true)}
      onMouseLeave={() => setUserInteracting(false)}
    >
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeMaterial={customGlobeMaterial}
        backgroundColor="rgba(0,0,0,0)"
        showGraticules={true}
        showAtmosphere={true}
        atmosphereColor={isLight ? "#38bdf8" : "#1e40af"}
        atmosphereAltitude={isLight ? 0.15 : 0.25}
        
        // Polygons Configuration
        polygonsData={countries ? countries.features : []}
        polygonAltitude={0.015}
        polygonCapColor={() => isLight ? '#4ade80' : '#0f172a'} 
        polygonSideColor={() => isLight ? '#22c55e' : '#020617'} 
        polygonStrokeColor={() => isLight ? '#ffffff' : '#0ea5e9'} 

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
        arcStroke={isLight ? 0.8 : 0.6}
        arcLabel={(d: any) => `
          <div style="background: rgba(0,0,0,0.85); color: white; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; min-width: 180px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 6px; margin-bottom: 6px;">Flow to ${d.name}</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #9ca3af;">Total Traffic:</span> <span>${fmtBytes(d.value)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #38bdf8;">Download:</span> <span>${fmtBytes(d.download)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #4ade80;">Upload:</span> <span>${fmtBytes(d.upload)}</span>
            </div>
          </div>
        `}

        // Points configuration
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius="size"
        pointsMerge={true}
        pointLabel={(d: any) => `
          <div style="background: rgba(0,0,0,0.85); color: white; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; min-width: ${d.value > 0 ? '180px' : 'auto'}; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="font-weight: 600; font-size: 14px; ${d.value > 0 ? 'border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 6px; margin-bottom: 6px;' : ''}">${d.name}</div>
            ${d.value > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #9ca3af;">Total Traffic:</span> <span>${fmtBytes(d.value)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #38bdf8;">Download:</span> <span>${fmtBytes(d.download)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #4ade80;">Upload:</span> <span>${fmtBytes(d.upload)}</span>
              </div>
            ` : ''}
          </div>
        `}

        // Rings configuration (Ping effect for points)
        ringsData={pointsData}
        ringLat="lat"
        ringLng="lng"
        ringColor="color"
        ringMaxRadius={(d: any) => d.isOrigin ? 3 : 1.5}
        ringPropagationSpeed={3}
        ringRepeatPeriod={1000}

        // Labels Configuration (All Destinations + Origin)
        labelsData={labelsData}
        labelLat="lat"
        labelLng="lng"
        labelText="name"
        labelSize={1.4}
        labelDotRadius={0.2}
        labelColor="color"
        labelResolution={5}
        labelAltitude={0.03}
      />
    </div>
  );
};
