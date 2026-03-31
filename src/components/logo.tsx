export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" width={size} height={size}>
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8"/>
          <stop offset="100%" stopColor="#6366f1"/>
        </linearGradient>
        <linearGradient id="logo-shine" x1="0" y1="0" x2="0.5" y2="0.5">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="logo-arrow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="1"/>
          <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.9"/>
        </linearGradient>
      </defs>
      <rect x="32" y="32" width="448" height="448" rx="96" fill="url(#logo-bg)"/>
      <rect x="32" y="32" width="448" height="448" rx="96" fill="url(#logo-shine)"/>
      <path d="M256 136 L336 232 L296 232 L296 344 L216 344 L216 232 L176 232 Z" fill="url(#logo-arrow)"/>
      <circle cx="340" cy="180" r="28" fill="none" stroke="#fff" strokeWidth="8" strokeOpacity="0.6"/>
      <circle cx="354" cy="166" r="10" fill="#fff" fillOpacity="0.9"/>
    </svg>
  );
}
