"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from "next-themes";
import * as THREE from 'three';
import { getArcTooltip, getPointTooltip } from './GlobeTooltips';
import { useGlobeData, GlobeDataInput } from './useGlobeData';

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

interface GlobeMapProps {
  data: GlobeDataInput[];
}

export const GlobeMap = ({ data }: GlobeMapProps) => {
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 360, height: 320 });
  const [countries, setCountries] = useState<any>(null);
  const [userInteracting, setUserInteracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth || (typeof window !== 'undefined' ? window.innerWidth : 360);
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const height = containerRef.current.offsetHeight || (isMobile ? 320 : 480);
        setDimensions({ width, height });
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

  // Setup Initial Controls & Camera Position
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
        controls.minDistance = 120; // Zoom in limit
        controls.maxDistance = 500; // Zoom out limit

        controls.addEventListener('start', () => setUserInteracting(true));
        controls.addEventListener('end', () => setUserInteracting(false));

        // Focus on Southeast Asia with optimal altitude on mobile to ensure 100% full sphere visibility
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const initialAlt = isMobile ? 2.4 : 1.8;
        const initialLat = isMobile ? 5 : -6.2;
        
        globeRef.current.pointOfView({ lat: initialLat, lng: 106.8, altitude: initialAlt }, 1500);
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
    const targetColor = new THREE.Color(isLight ? '#e0f2fe' : '#020617');
    
    let frameId: number;
    const lerpColor = () => {
      customGlobeMaterial.color.lerp(targetColor, 0.08); 
      
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

  const { arcsData, pointsData, labelsData } = useGlobeData(data, isLight);

  const getPolygonCapColor = useMemo(() => {
    const color = isLight ? '#4ade80' : '#0f172a';
    return () => color;
  }, [isLight]);

  const getPolygonSideColor = useMemo(() => {
    const color = isLight ? '#22c55e' : '#020617';
    return () => color;
  }, [isLight]);

  const getPolygonStrokeColor = useMemo(() => {
    const color = isLight ? '#ffffff' : '#0ea5e9';
    return () => color;
  }, [isLight]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[360px] sm:h-[400px] md:h-[480px] rounded-xl overflow-hidden bg-transparent cursor-move flex items-center justify-center transition-all duration-500 mx-auto"
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
        
        polygonsData={countries ? countries.features : []}
        polygonAltitude={0.015}
        polygonCapColor={getPolygonCapColor} 
        polygonSideColor={getPolygonSideColor} 
        polygonStrokeColor={getPolygonStrokeColor} 

        arcsData={arcsData}
        arcStartLat={(d: any) => d.startLat}
        arcStartLng={(d: any) => d.startLng}
        arcEndLat={(d: any) => d.endLat}
        arcEndLng={(d: any) => d.endLng}
        arcColor={(d: any) => d.color}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        arcAltitude={(d: any) => {
          const phi1 = d.startLat * Math.PI / 180;
          const lambda1 = d.startLng * Math.PI / 180;
          const phi2 = d.endLat * Math.PI / 180;
          const lambda2 = d.endLng * Math.PI / 180;
          
          const cosTheta = Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(lambda1 - lambda2);
          const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
          const chordDepth = 1 - Math.cos(theta / 2);
          
          return chordDepth + 0.02 + (theta * 0.008);
        }}
        arcStroke={isLight ? 0.8 : 0.6}
        arcLabel={(d: any) => getArcTooltip(d)}

        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius="size"
        pointsMerge={true}
        pointLabel={(d: any) => getPointTooltip(d)}

        ringsData={pointsData}
        ringLat="lat"
        ringLng="lng"
        ringColor="color"
        ringMaxRadius={(d: any) => d.isOrigin ? 3 : 1.5}
        ringPropagationSpeed={3}
        ringRepeatPeriod={1000}

        labelsData={labelsData}
        labelLat={(d: any) => d.lat}
        labelLng={(d: any) => d.lng}
        labelDotRadius={0}
        labelSize={(d: any) => d.size || 1.4}
        labelText="name"
        labelColor={(d: any) => d.color}
        labelResolution={2}
        labelAltitude={0.02}
      />
    </div>
  );
};
