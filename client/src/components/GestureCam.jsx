import React, { useRef, useEffect } from 'react';
import { useGlobalStore } from '../context/GlobalStore';
import useHandGesture from '../hooks/useHandGesture';

const GestureCam = () => {
  const videoRef = useRef(null);
  const { setGesture, setActiveLayer, activeLayer } = useGlobalStore();
  const lastModeSwitchRef = useRef(0);
  const DEBOUNCE_MS = 1000; // 1 second debounce to prevent rapid switching

  const onGestureDetected = (result) => {
    if (result && result.gestures.length > 0) {
      const categoryName = result.gestures[0][0].categoryName;
      setGesture(categoryName);

      // Mode switching logic with debounce
      const now = Date.now();
      if (now - lastModeSwitchRef.current < DEBOUNCE_MS) {
        return; // Skip if within debounce period
      }

      // Closed Fist -> Thermal mode
      if (categoryName === 'Closed_Fist' && activeLayer !== 'heat') {
        setActiveLayer('heat');
        lastModeSwitchRef.current = now;
        console.log('[GestureCam] Switching to Thermal mode via gesture');
      }
      // Pointing Up -> Satellite mode
      else if (categoryName === 'Pointing_Up' && activeLayer !== 'none') {
        setActiveLayer('none');
        lastModeSwitchRef.current = now;
        console.log('[GestureCam] Switching to Satellite mode via gesture');
      }
    } else {
      setGesture('None');
    }
  };

  const { isLoaded } = useHandGesture(videoRef, onGestureDetected);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 320,
            height: 240,
            frameRate: { ideal: 30 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error(err);
      }
    };

    startCamera();
  }, []);

  return (
    <div className="absolute bottom-4 left-4 z-50">
      <div className="relative rounded-lg overflow-hidden border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-black/80 w-40 h-32">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
        <div className="absolute top-2 right-2">
          <div className={`w-2 h-2 rounded-full ${isLoaded ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        </div>
      </div>
    </div>
  );
};

export default GestureCam;