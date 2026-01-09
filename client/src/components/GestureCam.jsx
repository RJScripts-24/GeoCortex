import React, { useRef, useEffect } from 'react';
import { useGlobalStore } from '../context/GlobalStore';
import useHandGesture from '../hooks/useHandGesture';

const GestureCam = () => {
  const videoRef = useRef(null);
  const { setGesture } = useGlobalStore();

  const onGestureDetected = (result) => {
    if (result && result.gestures.length > 0) {
      const categoryName = result.gestures[0][0].categoryName;
      setGesture(categoryName);
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