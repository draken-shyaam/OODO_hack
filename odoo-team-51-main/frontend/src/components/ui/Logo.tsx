import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  /** Pixel size for both width and height. */
  size?: number;
}

/**
 * Recreated as an SVG, not the source JPEG — the source has a baked-in
 * light-gray background, which would show as a mismatched square the
 * moment it's placed on a dark sidebar/card. An SVG with no fill behind it
 * is genuinely transparent, and the ring/letter use `currentColor`'s theme
 * token so they flip from dark-on-light to light-on-dark automatically,
 * the same way every other icon in the app already does.
 */
export function Logo({ className, size = 32 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      role="img"
      aria-label="PINERP"
    >
      {/* Four "people" nodes — brand accent colors, fixed across themes */}
      <g fill="#14b8a6">
        <circle cx="50" cy="17" r="7" />
        <ellipse cx="50" cy="31" rx="9" ry="12" />
      </g>
      <g fill="#14b8a6" transform="rotate(180 50 50)">
        <circle cx="50" cy="17" r="7" />
        <ellipse cx="50" cy="31" rx="9" ry="12" />
      </g>
      <g fill="#7c3aed" transform="rotate(90 50 50)">
        <circle cx="50" cy="17" r="7" />
        <ellipse cx="50" cy="31" rx="9" ry="12" />
      </g>
      <g fill="#7c3aed" transform="rotate(-90 50 50)">
        <circle cx="50" cy="17" r="7" />
        <ellipse cx="50" cy="31" rx="9" ry="12" />
      </g>

      {/* Ring + letterform — theme-aware so it stays readable in dark mode */}
      <circle cx="50" cy="50" r="24" fill="none" stroke="var(--foreground)" strokeWidth="6.5" />
      <text
        x="50"
        y="53"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="30"
        fontWeight="700"
        fontFamily="var(--font-sans)"
        fill="var(--foreground)"
      >
        P
      </text>
    </svg>
  );
}
