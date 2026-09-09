import { useEffect, useRef, useState } from "react";
import { RippleEngine } from "@/lib/ripple/engine";
import type { PaletteId } from "@/lib/ripple/palettes";

interface RippleCanvasProps {
  viscosity: number;
  strength: number;
  palette: PaletteId;
  clearToken: number;
}

export function RippleCanvas({ viscosity, strength, palette, clearToken }: RippleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RippleEngine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new RippleEngine(canvas);
    engineRef.current = engine;
    if (!engine.ok) {
      setError(engine.error ?? "Could not start the surface.");
      return;
    }
    engine.setParams({ viscosity, strength, palette });
    engine.start();
    const win = window as Window & { __undula?: { clear: () => void; drop: (x: number, y: number) => void } };
    win.__undula = {
      clear: () => engine.clear(),
      drop: (x, y) => engine.queueDrop(x, y, 0.9, 0.03),
    };
    return () => {
      delete win.__undula;
      engine.destroy();
      engineRef.current = null;
    };
    // First mount only — params flow through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setParams({ viscosity, strength, palette });
  }, [viscosity, strength, palette]);

  useEffect(() => {
    if (clearToken > 0) engineRef.current?.clear();
  }, [clearToken]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full touch-none"
        aria-label="Interactive fluid surface. Drag to create ripples."
      />
      {error ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background px-6 text-center">
          <p className="max-w-sm text-pretty text-sm text-muted-foreground">{error}</p>
        </div>
      ) : null}
    </>
  );
}
