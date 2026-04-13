import { useId } from 'react';

interface LaplaceLogoProps {
  size?: number;
  className?: string;
}

export function LaplaceLogo({ size = 28, className }: LaplaceLogoProps) {
  const id = useId();
  const clipId = `circle-clip-${id}`;
  const maskId = `mountain-mask-${id}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="48" />
        </clipPath>
        <mask id={maskId}>
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <path d="M 18 48 C 28 20 72 20 82 48 L 82 52 L 18 52 Z" fill="black" />
        </mask>
      </defs>

      <circle cx="50" cy="50" r="48" className="fill-primary" />

      <g clipPath={`url(#${clipId})`}>
        <g mask={`url(#${maskId})`} className="fill-primary-foreground">
          <rect x="0" y="6" width="100" height="7" />
          <rect x="0" y="16" width="100" height="7" />
          <rect x="0" y="26" width="100" height="7" />
          <rect x="0" y="36" width="100" height="7" />
          <rect x="0" y="46" width="100" height="7" />
          <rect x="0" y="56" width="100" height="7" />
          <rect x="0" y="66" width="100" height="7" />
          <rect x="0" y="76" width="100" height="7" />
          <rect x="0" y="86" width="100" height="7" />
        </g>
      </g>
    </svg>
  );
}
