import React, { useEffect, useRef } from 'react';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { useGlobalStore } from '../context/GlobalStore';
import { fetchHeatLayer, fetchAnalysis } from '../services/api';

const MapViewer = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const overlayRef = useRef(null);
  const { year, activeLayer, gesture, setAnalysis, setIsAnalyzing } = useGlobalStore();

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 12.9716, lng: 77.5946 },
      zoom: 13,
      tilt: 67.5,
      heading: 45,
      mapId: '15431d2b4ce52a73',
      disableDefaultUI: true,
      backgroundColor: '#000000',
    });

    mapInstance.current = map;

    const overlay = new GoogleMapsOverlay({
      layers: [],
    });

    overlay.setMap(map);
    overlayRef.current = overlay;

    map.addListener('click', async (e) => {
      if (!e.latLng) return;
      
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setIsAnalyzing(true);
      try {
        const result = await fetchAnalysis(lat, lng);
        setAnalysis(result.analysis);
      } catch (error) {
        console.error(error);
      } finally {
        setIsAnalyzing(false);
      }
    });

  }, [setAnalysis, setIsAnalyzing]);

  useEffect(() => {
    const updateLayers = async () => {
      if (!overlayRef.current) return;

      let layers = [];

      if (activeLayer === 'heat') {
        try {
          const data = await fetchHeatLayer(year);
          if (data && data.tileUrl) {
            const heatLayer = new TileLayer({
              id: 'heat-layer',
              data: data.tileUrl,
              minZoom: 0,
              maxZoom: 19,
              tileSize: 256,
              renderSubLayers: props => {
                const { bbox: { west, south, east, north } } = props.tile;
                return new BitmapLayer(props, {
                  data: null,
                  image: props.data,
                  bounds: [west, south, east, north]
                });
              },
              opacity: 0.6
            });
            layers.push(heatLayer);
          }
        } catch (error) {
          console.error(error);
        }
      }

      overlayRef.current.setProps({ layers });
    };

    updateLayers();
  }, [year, activeLayer]);

  useEffect(() => {
    if (!mapInstance.current) return;

    let interval;
    const step = 0.05;

    if (gesture === 'Closed_Fist') {
      interval = setInterval(() => {
        mapInstance.current.setZoom(mapInstance.current.getZoom() + step);
      }, 50);
    } else if (gesture === 'Pointing_Up') {
      mapInstance.current.setZoom(13);
      mapInstance.current.setTilt(45);
      mapInstance.current.setCenter({ lat: 12.9716, lng: 77.5946 });
    }

    return () => clearInterval(interval);
  }, [gesture]);

  return (
    <div ref={mapRef} className="absolute inset-0 w-full h-full bg-black" />
  );
};

export default MapViewer;