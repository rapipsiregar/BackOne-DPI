// src/components/ui/useGlobeData.ts
import { useMemo } from 'react';
import { SMALL_LABEL_COUNTRIES, getStaggeredCoordinates } from './globeOffsets';

export interface GlobeDataInput {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  fromLabel: string;
  toLabel: string;
  value: number;
  download: number;
  upload: number;
  countryCode?: string;
}

export function useGlobeData(data: GlobeDataInput[], isLight: boolean) {
  const arcsData = useMemo(() => {
    return data.map(d => ({
      ...d,
      color: isLight ? ['#38bdf8', '#0284c7'] : ['#0ea5e9', '#38bdf8'],
    }));
  }, [data, isLight]);

  const pointsData = useMemo(() => {
    const points: any[] = [];
    const originSet = new Set<string>();
    const destSet = new Set<string>();
    
    arcsData.forEach(arc => {
      const originKey = `${arc.startLat},${arc.startLng}`;
      const destKey = `${arc.endLat},${arc.endLng}`;
      
      if (!destSet.has(destKey)) {
        points.push({
          lat: arc.endLat,
          lng: arc.endLng,
          size: 0.1,
          color: isLight ? '#0284c7' : '#38bdf8',
          name: arc.toLabel,
          value: arc.value,
          upload: arc.upload,
          download: arc.download,
          isOrigin: false
        });
        destSet.add(destKey);
      }
      
      if (!originSet.has(originKey)) {
        points.push({
          lat: arc.startLat,
          lng: arc.startLng,
          size: 0.2,
          color: '#f43f5e',
          name: arc.fromLabel,
          value: 0,
          upload: 0,
          download: 0,
          isOrigin: true
        });
        originSet.add(originKey);
      }
    });

    return points;
  }, [arcsData, isLight]);

  const labelsData = useMemo(() => {
    const labels: any[] = [];
    const originSet = new Set();
    const destSet = new Set();

    arcsData.forEach(arc => {
      const originKey = `${arc.startLat},${arc.startLng}`;
      const destKey = `${arc.endLat},${arc.endLng}`;
      
      if (!destSet.has(destKey)) {
        // Shift and stagger coordinates (Southeast Asia, Europe, Caribbean, Indian Ocean, Latin America)
        const { lat, lng } = getStaggeredCoordinates(arc.countryCode || '', arc.endLat, arc.endLng);
        const size = SMALL_LABEL_COUNTRIES.has(arc.countryCode || '') ? 0.9 : 1.4;
        
        labels.push({
          lat,
          lng,
          name: arc.toLabel,
          color: isLight ? '#0f172a' : '#f8fafc',
          size
        });
        destSet.add(destKey);
      }
      
      if (!originSet.has(originKey)) {
        labels.push({
          lat: arc.startLat,
          lng: arc.startLng,
          name: arc.fromLabel,
          color: isLight ? '#0f172a' : '#f8fafc',
          size: 1.4
        });
        originSet.add(originKey);
      }
    });
    
    return labels;
  }, [arcsData, isLight]);

  return { arcsData, pointsData, labelsData };
}
