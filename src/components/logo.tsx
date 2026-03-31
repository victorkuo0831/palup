export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" width={size} height={size}>
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e1b4b"/>
          <stop offset="100%" stopColor="#0f0f23"/>
        </linearGradient>
        <linearGradient id="logo-accent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5b4fc"/>
          <stop offset="100%" stopColor="#6366f1"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="512" height="512" rx="112" fill="url(#logo-bg)"/>
      <rect x="0" y="0" width="512" height="512" rx="112" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.3"/>
      <rect x="152" y="128" width="36" height="256" rx="4" fill="url(#logo-accent)"/>
      <path d="M188 128 h80 a72 72 0 0 1 0 144 h-80" fill="none" stroke="url(#logo-accent)" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M340 240 L368 200 L396 240" fill="none" stroke="#818cf8" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7"/>
    </svg>
  );
}
