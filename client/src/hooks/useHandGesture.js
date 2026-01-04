import { useEffect, useState, useRef } from 'react';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';

const useHandGesture = (videoRef, onResult) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const gestureRecognizer = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    const loadModel = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      gestureRecognizer.current = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/gesture_recognizer.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO"
      });

      setIsLoaded(true);
    };

    loadModel();
  }, []);

  useEffect(() => {
    if (!isLoaded || !videoRef.current) return;

    const predict = () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const nowInMs = Date.now();
        const results = gestureRecognizer.current.recognizeForVideo(videoRef.current, nowInMs);
        
        if (onResult) {
          onResult(results);
        }
      }
      requestRef.current = requestAnimationFrame(predict);
    };

    predict();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isLoaded, videoRef, onResult]);

  return { isLoaded };
};

export default useHandGesture;