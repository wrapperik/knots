// Decorative background: the page colour at the top fading into blurred
// orange and yellow waves at the bottom. Placed inside a `relative` parent.
export function WaveBackground() {
  return (
    <div 
      aria-hidden="true"
     className="pointer-events-none absolute inset-0 overflow-hidden
  animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out
  motion-reduce:animate-none"
    >
      {/* Wash that warms the lower half before the waves begin. */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent from-30% to-(--knots-orange)/40" />

      {/*
        The SVG is larger than the panel on three sides, so the blur
        softens the wave edges without fading out at the panel edges.
      */}
      <svg
        className="absolute -inset-x-16 -bottom-16 h-[calc(65%+4rem)] w-[calc(100%+8rem)] blur-2xl"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
      >
        <path
          fill="#F7B733"
          fillOpacity="0.5"
          d="M0 200 C 260 110, 520 290, 780 210 S 1220 100, 1440 180 V 600 H 0 Z"
        />
        <path
          fill="var(--knots-orange)"
          fillOpacity="0.55"
          d="M0 320 C 300 240, 560 400, 860 320 S 1260 240, 1440 300 V 600 H 0 Z"
        />
        <path
          fill="#F59E2A"
          fillOpacity="0.4"
          d="M0 420 C 240 360, 600 500, 920 420 S 1300 370, 1440 410 V 600 H 0 Z"
        />
        <path
          fill="var(--knots-orange)"
          fillOpacity="0.20"
          d="M0 500 C 280 450, 640 580, 980 500 S 1320 460, 1440 490 V 600 H 0 Z"
        />
      </svg>
    </div>
  )
}
