import { useState, useEffect } from 'react';

type Listener = (scene: number) => void;
let currentScene = 0;
const listeners = new Set<Listener>();

export const scrollStore = {
  getScene: () => currentScene,
  setScene: (scene: number) => {
    if (scene !== currentScene) {
      currentScene = scene;
      listeners.forEach((l) => l(currentScene));
    }
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useActiveScene(): number {
  const [scene, setScene] = useState(scrollStore.getScene());

  useEffect(() => {
    return scrollStore.subscribe((newScene) => setScene(newScene));
  }, []);

  return scene;
}

