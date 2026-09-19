export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-label="AARVAK" role="img">
      <defs>
        <linearGradient id="aarvakHouse" x1="18" y1="212" x2="216" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7FD3C8" />
          <stop offset="0.45" stopColor="#A7DFDA" />
          <stop offset="1" stopColor="#A49AEA" />
        </linearGradient>
      </defs>
      <path d="M 120 34 L 196 196 L 150 196" fill="none" stroke="url(#aarvakHouse)"
            strokeWidth="21" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 120 34 L 44 196 L 104 196" fill="none" stroke="url(#aarvakHouse)"
            strokeWidth="21" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 120 96 L 158 176 L 120 152 L 96 176 Z" fill="#B9AEF2" />
    </svg>
  );
}
