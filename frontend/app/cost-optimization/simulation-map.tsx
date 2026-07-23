"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Checkpoint } from "./data";

let L: any = null;
if (typeof window !== "undefined") {
  L = require("leaflet");
}

export function SimulationMap({ checkpoints, simulationStep }: { checkpoints: Checkpoint[], simulationStep: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const routeLayer = useRef<any>(null);
  const truckMarker = useRef<any>(null);
  
  useEffect(() => {
    if (!L || !mapRef.current) return;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([20, 80], 4);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(leafletMap.current);
    }
    
    return () => {
      // Don't destroy on unmount if we want snappy tab switching, but standard practice is:
      // if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
    }
  }, []);

  useEffect(() => {
    if (!leafletMap.current || !checkpoints || checkpoints.length === 0) return;

    if (routeLayer.current) leafletMap.current.removeLayer(routeLayer.current);
    if (truckMarker.current) leafletMap.current.removeLayer(truckMarker.current);

    const latlngs = checkpoints.map(c => [c.lat, c.lng]);
    
    routeLayer.current = L.featureGroup().addTo(leafletMap.current);

    // Draw lines
    const line = L.polyline(latlngs, {
      color: '#10B981',
      weight: 3,
      dashArray: '5, 10',
      opacity: 0.6
    }).addTo(routeLayer.current);

    // Draw checkpoints
    checkpoints.forEach((c, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === checkpoints.length - 1;
      
      const iconHtml = `
        <div style="background-color: ${isStart || isEnd ? '#0F2922' : 'white'}; 
                    border: 2px solid #10B981; 
                    width: 14px; height: 14px; 
                    border-radius: 50%;
                    box-shadow: 0 0 4px rgba(0,0,0,0.3);">
        </div>
      `;
      
      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([c.lat, c.lng], { icon }).addTo(routeLayer.current);
      
      // Tooltip
      if (simulationStep > 0 && simulationStep >= idx) {
         marker.bindTooltip(`
           <div style="font-family: sans-serif; font-size: 11px;">
             <strong>${c.name}</strong><br/>
             <span style="color:#EF4444">Added Cost: +$${c.addedCost}</span><br/>
             <span style="color:#F97316">Delay: ${c.delay}</span><br/>
             <span style="color:#64748B">Reason: ${c.reason}</span>
           </div>
         `, { permanent: true, direction: 'top', offset: [0, -10] }).openTooltip();
      }
    });

    // Fit bounds
    leafletMap.current.fitBounds(routeLayer.current.getBounds(), { padding: [50, 50] });

    // Draw Truck Playhead
    if (simulationStep > 0) {
      // Calculate current position based on simulationStep
      // Step 1: at index 0, Step 2: between 0 and 1, etc. (simplified logic)
      let currentIdx = simulationStep - 1;
      if (currentIdx >= checkpoints.length) currentIdx = checkpoints.length - 1;
      
      const c = checkpoints[currentIdx];
      
      const truckIcon = L.divIcon({
        html: `<div style="background: white; border: 2px solid #0F2922; border-radius: 4px; padding: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">🚚</div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      truckMarker.current = L.marker([c.lat, c.lng], { icon: truckIcon }).addTo(leafletMap.current);
    }

  }, [checkpoints, simulationStep]);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}
