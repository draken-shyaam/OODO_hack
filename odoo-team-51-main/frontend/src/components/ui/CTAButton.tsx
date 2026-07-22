import { cn } from '../../lib/utils';

interface CTAButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

/** Pure CSS pulse (see .cta-pulse in index.css) — pauses on hover via the
 * :hover selector, scale-up on hover via the transition below. No JS timers. */
export function CTAButton({ children, onClick, variant = 'primary' }: CTAButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-sm',
        'transition-transform duration-200 ease-out hover:scale-105 active:scale-100',
        'cta-pulse',
        variant === 'primary' ? 'bg-primary text-primary-foreground' : 'cta-pulse-secondary bg-secondary text-secondary-foreground'
      )}
    >
      {children}
    </button>
  );
}
