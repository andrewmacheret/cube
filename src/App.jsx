import { useEffect, useRef, useState } from 'react';
import { World } from './cube/world.js';

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

// The speed slider goes from 0 (1 second per move) to 100 (50 ms per move).
// It's a log scale so each step feels like the same change in speed.
const SLOWEST_MS = 1000;
const FASTEST_MS = 50;
const DEFAULT_SPEED = 27; // about 450 ms per move

function moveDuration(speed) {
  return SLOWEST_MS * (FASTEST_MS / SLOWEST_MS) ** (speed / 100);
}

function savedSpeed() {
  const speed = Number(localStorage.getItem('cube-speed'));
  return localStorage.getItem('cube-speed') !== null && speed >= 0 && speed <= 100 ? speed : DEFAULT_SPEED;
}

export default function App() {
  const containerRef = useRef(null);
  const worldRef = useRef(null);
  const [solving, setSolving] = useState(false);
  const [speed, setSpeed] = useState(savedSpeed);
  const [movesLeft, setMovesLeft] = useState(0);

  useEffect(() => {
    const world = new World({
      container: containerRef.current,
      onSolvingChange: setSolving,
      onMovesLeftChange: setMovesLeft,
      moveDuration: moveDuration(speed)
    });
    worldRef.current = world;
    return () => {
      world.dispose();
      worldRef.current = null;
    };
    // the world is only made once, speed changes go through setMoveDuration
  }, []);

  function changeSpeed(event) {
    const value = Number(event.target.value);
    setSpeed(value);
    localStorage.setItem('cube-speed', String(value));
    worldRef.current?.setMoveDuration(moveDuration(value));
  }

  const movesPerSecond = 1000 / moveDuration(speed);
  const solved = movesLeft === 0;

  return (
    <main className="app">
      <header className="header title">
        <div>
          <h1>Rubik's Cube</h1>
          <p>Drag a face to turn it. Drag the background to spin.</p>
        </div>
        {solved ? (
          <div className="pill good">
            <Icon>
              <path d="M20 6 9 17l-5-5" />
            </Icon>
            Solved
          </div>
        ) : (
          <div className="pill" title="How many moves this solver needs from here">
            <strong>{movesLeft}</strong>
            {movesLeft === 1 ? 'move' : 'moves'} to solve
          </div>
        )}
      </header>

      <div className="canvas-container" ref={containerRef} aria-label="Rubik's Cube. Drag a face to turn it, or drag outside the cube to spin it." role="img" />

      <div className="dock">
        <label className="slider speed" hidden={!solving}>
          <span>Solve speed</span>
          <input
            type="range"
            min="0"
            max="100"
            value={speed}
            onChange={changeSpeed}
            aria-valuetext={`${movesPerSecond.toFixed(1)} moves per second`}
          />
          <span className="slider-value">{movesPerSecond < 10 ? movesPerSecond.toFixed(1) : Math.round(movesPerSecond)}/s</span>
        </label>

        <nav className="controls" aria-label="Cube controls">
          <button type="button" className="control" disabled={solving || solved} onClick={() => worldRef.current?.restart()}>
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
          <button type="button" className="control primary" disabled={solving || solved} aria-busy={solving} onClick={() => worldRef.current?.solve()}>
            <Icon>
              <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
              <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
            </Icon>
            {solving ? 'Solving…' : 'Solve'}
          </button>
        </nav>

        <footer className="footer">
          <a href="https://andrewmacheret.com/">More projects</a>
          <span aria-hidden="true">·</span>
          <a href="https://github.com/andrewmacheret/cube">Source</a>
        </footer>
      </div>
    </main>
  );
}
