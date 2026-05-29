"use client";

export function PitchField() {
  return (
    <div className="relative aspect-[3/4] max-h-64 w-full rounded-xl overflow-hidden border border-line bg-gradient-to-b from-green-900/40 to-green-950/60">
      <svg viewBox="0 0 100 140" className="absolute inset-0 w-full h-full p-2" aria-hidden>
        <rect x="5" y="5" width="90" height="130" fill="none" stroke="rgba(57,255,20,0.3)" strokeWidth="0.5" />
        <line x1="5" y1="70" x2="95" y2="70" stroke="rgba(57,255,20,0.3)" strokeWidth="0.5" />
        <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(57,255,20,0.3)" strokeWidth="0.5" />
        <rect x="25" y="5" width="50" height="22" fill="none" stroke="rgba(57,255,20,0.25)" strokeWidth="0.5" />
        <rect x="25" y="113" width="50" height="22" fill="none" stroke="rgba(57,255,20,0.25)" strokeWidth="0.5" />
      </svg>
      {/* Heatmap dots */}
      {[
        { x: "30%", y: "25%" },
        { x: "55%", y: "40%" },
        { x: "70%", y: "55%" },
        { x: "45%", y: "70%" },
        { x: "60%", y: "80%" },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute h-3 w-3 rounded-full bg-neon/40 blur-sm"
          style={{ left: dot.x, top: dot.y, transform: "translate(-50%, -50%)" }}
        />
      ))}
    </div>
  );
}
