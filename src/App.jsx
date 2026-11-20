import { useEffect, useRef, useState } from 'react';
import { World } from './cube/world.js';

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

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
      <header className="title">
        <h1>Rubik's Cube</h1>
        <p>Drag a face to turn it. Drag the background to spin.</p>
      </header>

      <div className="canvas-container" ref={containerRef} aria-label="Rubik's Cube. Drag a face to turn it, or drag outside the cube to spin it." role="img" />

      <nav className="controls" aria-label="Cube controls">
        <button type="button" className="control" disabled={solving} onClick={() => worldRef.current?.restart()}>
          <Icon>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </Icon>
          Restart
        </button>
        <button type="button" className="control" disabled={solving} onClick={() => worldRef.current?.shuffle()}>
          <Icon>
            <path d="M16 3h5v5" />
            <path d="M4 20 21 3" />
            <path d="M21 16v5h-5" />
            <path d="m15 15 6 6" />
            <path d="M4 4l5 5" />
          </Icon>
          Shuffle
        </button>
        <button type="button" className="control primary" disabled={solving} aria-busy={solving} onClick={() => worldRef.current?.solve()}>
          <Icon>
            <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
            <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
          </Icon>
          {solving ? 'Solving…' : 'Solve'}
        </button>
      </nav>
    </main>
  );
}
