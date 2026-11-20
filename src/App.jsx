import { useEffect, useRef, useState } from 'react';
import { World } from './cube/world.js';

export default function App() {
  const containerRef = useRef(null);
  const worldRef = useRef(null);
  const [solving, setSolving] = useState(false);

  useEffect(() => {
    const world = new World({ container: containerRef.current, onSolvingChange: setSolving });
    worldRef.current = world;
    return () => {
      world.dispose();
      worldRef.current = null;
    };
  }, []);

  return (
    <main className="app">
      <div className="canvas-container" ref={containerRef} aria-label="Rubik's Cube. Drag a face to turn it, or drag outside the cube to spin it." role="img" />
      <div className="buttons">
        <button type="button" disabled={solving} onClick={() => worldRef.current?.restart()}>
          Restart
        </button>
        <button type="button" disabled={solving} onClick={() => worldRef.current?.shuffle()}>
          Shuffle
        </button>
        <button type="button" disabled={solving} onClick={() => worldRef.current?.solve()}>
          {solving ? 'Solving…' : 'Solve'}
        </button>
      </div>
    </main>
  );
}
